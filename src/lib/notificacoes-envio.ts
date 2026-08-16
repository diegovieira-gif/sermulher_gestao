import "server-only";
import { readItems, readSingleton, updateItem } from "@directus/sdk";
import { getDirectusAdmin } from "@/lib/directus";

/**
 * Consumidor da fila de notificações: entrega por e-mail e WhatsApp.
 *
 * Roda pelo agendador (`/api/notificacoes/enviar`). Cada canal é registrado
 * individualmente em `canais`, de modo que uma segunda execução não reenvia o
 * que já saiu — o cron pode disparar quantas vezes quiser.
 *
 * Nenhum canal é obrigatório: sem SMTP configurado o e-mail simplesmente não
 * sai, sem telefone/consentimento o WhatsApp não sai, e o aviso continua
 * disponível no sino. Degradar é melhor que falhar.
 */

const COLLECTION = "notificacoes";
/** Teto por execução: evita que uma fila represada vire uma rajada de envio. */
const LOTE = 50;

interface NotificacaoPendente {
  id: number;
  tipo: string;
  titulo: string;
  mensagem: string;
  canais: Record<string, unknown> | null;
  destinatario: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    telefone_notificacao?: string | null;
    notificar_whatsapp?: boolean | number | null;
  } | null;
}

// --- E-mail -------------------------------------------------------------------

function smtpConfigurado(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM);
}

async function enviarEmail(
  para: string,
  assunto: string,
  texto: string,
): Promise<{ ok: boolean; erro?: string }> {
  if (!smtpConfigurado()) return { ok: false, erro: "SMTP não configurado" };

  try {
    // Import dinâmico: sem SMTP configurado o nodemailer nem é carregado.
    const nodemailer = (await import("nodemailer")).default;

    const porta = Number(process.env.SMTP_PORT || 587);
    const transporte = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: porta,
      // 465 é TLS implícito; as demais portas usam STARTTLS.
      secure: porta === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
    });

    await transporte.sendMail({
      from: process.env.SMTP_FROM,
      to: para,
      subject: assunto,
      text: texto,
    });
    return { ok: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return { ok: false, erro: msg.slice(0, 200) };
  }
}

// --- WhatsApp (GoWA) ----------------------------------------------------------

/**
 * Normaliza o número no mesmo padrão do disparo de campanhas.
 *
 * A regra do nono dígito não é capricho: contas de WhatsApp em DDDs >= 31
 * (Sergipe é 79) costumam estar registradas SEM o 9 extra, e o GoWA envia
 * para o JID exato que recebe — com o 9 sobrando, a mensagem não chega.
 */
function formatarNumeroWhatsapp(telefone: string): string {
  let n = telefone.replace(/\D/g, "");
  if (n.length === 10 || n.length === 11) n = "55" + n;
  if (n.startsWith("55") && n.length === 13) {
    const ddd = parseInt(n.substring(2, 4), 10);
    if (n.charAt(4) === "9" && ddd >= 31) n = n.substring(0, 4) + n.substring(5);
  }
  return n;
}

function numeroValido(digitos: string): boolean {
  if (!/^55\d{10,11}$/.test(digitos)) return false;
  const ddd = parseInt(digitos.substring(2, 4), 10);
  return ddd >= 11 && ddd <= 99;
}

interface ConfigGowa {
  url: string;
  token: string;
}

/**
 * Lê a configuração do GoWA do mesmo lugar que o módulo de Marketing.
 *
 * Os campos ainda se chamam `evolution_api_*` — nome legado da época em que o
 * disparo usava a Evolution API. A implementação atual é GoWA.
 */
async function lerConfigGowa(): Promise<ConfigGowa | null> {
  try {
    const client = getDirectusAdmin();
    const cfg = (await client.request(
      readSingleton("configuracoes_site", {
        fields: ["evolution_api_url", "evolution_api_token"],
      }),
    )) as { evolution_api_url?: string; evolution_api_token?: string };

    if (!cfg?.evolution_api_url || !cfg?.evolution_api_token) return null;
    return {
      url: cfg.evolution_api_url.replace(/\/$/, ""),
      token: cfg.evolution_api_token,
    };
  } catch {
    return null;
  }
}

async function enviarWhatsapp(
  cfg: ConfigGowa,
  telefone: string,
  texto: string,
): Promise<{ ok: boolean; erro?: string }> {
  const numero = formatarNumeroWhatsapp(telefone);
  if (!numeroValido(numero)) return { ok: false, erro: "número inválido" };

  try {
    const res = await fetch(`${cfg.url}/send/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + Buffer.from(cfg.token).toString("base64"),
      },
      body: JSON.stringify({
        phone: `${numero}@s.whatsapp.net`,
        message: texto,
      }),
    });
    if (!res.ok) {
      return { ok: false, erro: `GoWA respondeu ${res.status}` };
    }
    return { ok: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return { ok: false, erro: msg.slice(0, 200) };
  }
}

// --- Varredura ------------------------------------------------------------------

export interface ResultadoEnvio {
  analisadas: number;
  emailEnviados: number;
  whatsappEnviados: number;
  falhas: number;
}

export async function enviarNotificacoesPendentes(): Promise<ResultadoEnvio> {
  const client = getDirectusAdmin();
  const agora = new Date().toISOString();

  const pendentes = (await client.request(
    readItems(COLLECTION, {
      filter: {
        cancelada_em: { _null: true },
        // Já vencidas ou imediatas — o lembrete agendado para amanhã fica de fora.
        _or: [
          { agendada_para: { _null: true } },
          { agendada_para: { _lte: agora } },
        ],
      },
      fields: [
        "id",
        "tipo",
        "titulo",
        "mensagem",
        "canais",
        "destinatario.id",
        "destinatario.first_name",
        "destinatario.last_name",
        "destinatario.email",
        "destinatario.telefone_notificacao",
        "destinatario.notificar_whatsapp",
      ],
      sort: ["date_created"],
      limit: LOTE,
    }),
  )) as unknown as NotificacaoPendente[];

  const resultado: ResultadoEnvio = {
    analisadas: 0,
    emailEnviados: 0,
    whatsappEnviados: 0,
    falhas: 0,
  };

  const cfgGowa = await lerConfigGowa();

  for (const n of pendentes) {
    const canais = (n.canais || {}) as Record<string, unknown>;
    const destinatario = n.destinatario;
    if (!destinatario) continue;

    // Nada a fazer se ambos os canais externos já foram resolvidos.
    if (canais.email && canais.whatsapp) continue;
    resultado.analisadas++;

    const texto = `${n.titulo}\n\n${n.mensagem}`;
    const alteracoes: Record<string, unknown> = { ...canais };

    // E-mail
    if (!canais.email && destinatario.email && smtpConfigurado()) {
      const r = await enviarEmail(destinatario.email, n.titulo, n.mensagem);
      alteracoes.email = r.ok
        ? { enviado_em: new Date().toISOString() }
        : { erro: r.erro, tentado_em: new Date().toISOString() };
      if (r.ok) resultado.emailEnviados++;
      else resultado.falhas++;
    }

    // WhatsApp — exige número E consentimento explícito. O Directus devolve
    // booleanos como 1/0 nesta instância, daí a comparação frouxa.
    const querWhats =
      destinatario.notificar_whatsapp === true ||
      destinatario.notificar_whatsapp === 1;
    if (
      !canais.whatsapp &&
      querWhats &&
      destinatario.telefone_notificacao &&
      cfgGowa
    ) {
      const r = await enviarWhatsapp(
        cfgGowa,
        destinatario.telefone_notificacao,
        texto,
      );
      alteracoes.whatsapp = r.ok
        ? { enviado_em: new Date().toISOString() }
        : { erro: r.erro, tentado_em: new Date().toISOString() };
      if (r.ok) resultado.whatsappEnviados++;
      else resultado.falhas++;
    }

    if (Object.keys(alteracoes).length !== Object.keys(canais).length) {
      try {
        await client.request(updateItem(COLLECTION, n.id, { canais: alteracoes }));
      } catch (error) {
        console.error("[notificacoes] falha ao marcar canais:", error);
      }
    }
  }

  return resultado;
}
