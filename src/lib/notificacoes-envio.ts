import "server-only";
import { readItems, readSingleton, updateItem } from "@directus/sdk";
import { getDirectusAdmin } from "@/lib/directus";
import { booleano } from "@/lib/datas";
import {
  canalResolvido,
  decidirEmail,
  decidirWhatsapp,
  estadoEnviado,
  estadoFalha,
  estadoPulado,
  formatarNumeroWhatsapp,
  lerCanais,
  notificacaoPrecisaEnvio,
  numeroWhatsappValido,
} from "@/lib/notificacoes-formato";

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
 *
 * Todo canal termina RESOLVIDO (entregue, pulado ou desistido após
 * MAX_TENTATIVAS) — ver `notificacoes-formato.ts`. Um canal que "não se
 * aplica" e ficasse sem registro manteria o aviso na frente da fila para
 * sempre; com 50 desses, nada mais saía.
 */

const COLLECTION = "notificacoes";
/** Teto por execução: evita que uma fila represada vire uma rajada de envio. */
const LOTE = 50;
/** Tamanho de cada página lida ao procurar o que ainda precisa de envio. */
const PAGINA = 200;
/** Teto de páginas por varredura — a janela abaixo já limita o volume. */
const MAX_PAGINAS = 25;
/**
 * Janela de envio por canal externo. Aviso que não saiu em 3 dias (ex.: o cron
 * ficou parado) deixa de ir por e-mail/WhatsApp — "amanhã tem evento" chegando
 * depois do evento é pior que nada. Continua no sino. Também limita a leitura:
 * `canais` é JSON e o Directus não filtra dentro dele, então o "já resolvido"
 * é decidido em memória.
 */
const JANELA_MS = 3 * 24 * 60 * 60 * 1000;

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
      // Sem isto, um STARTTLS que falhasse faria o nodemailer seguir em texto
      // claro — e a senha de app iria pela rede sem cifra.
      requireTLS: porta !== 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
      // Um SMTP que não responde não pode travar a varredura inteira: o lote
      // seguinte reprocessa o que ficou pendente.
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
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
  if (!numeroWhatsappValido(numero)) return { ok: false, erro: "número inválido" };

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

/**
 * Lê, por páginas em ordem de id, os avisos vencidos que ainda têm canal
 * externo a processar — até `LOTE`. Paginar por `id > último` (e não um único
 * `limit: 50` por data) impede que avisos já resolvidos ocupem o lote.
 */
async function lerPendentes(
  client: ReturnType<typeof getDirectusAdmin>,
  agora: Date,
): Promise<NotificacaoPendente[]> {
  const agoraIso = agora.toISOString();
  const inicioJanela = new Date(agora.getTime() - JANELA_MS).toISOString();
  const encontrados: NotificacaoPendente[] = [];
  let ultimoId = 0;

  for (let pagina = 0; pagina < MAX_PAGINAS && encontrados.length < LOTE; pagina++) {
    const linhas = (await client.request(
      readItems(COLLECTION, {
        filter: {
          _and: [
            { id: { _gt: ultimoId } },
            { cancelada_em: { _null: true } },
            // Imediatos criados na janela, ou agendados que venceram na janela.
            // O lembrete agendado para amanhã fica de fora.
            {
              _or: [
                {
                  _and: [
                    { agendada_para: { _null: true } },
                    { date_created: { _gte: inicioJanela } },
                  ],
                },
                {
                  _and: [
                    { agendada_para: { _lte: agoraIso } },
                    { agendada_para: { _gte: inicioJanela } },
                  ],
                },
              ],
            },
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
        sort: ["id"],
        limit: PAGINA,
      }),
    )) as unknown as NotificacaoPendente[];

    for (const n of linhas) {
      if (notificacaoPrecisaEnvio(n.canais, agora)) encontrados.push(n);
      if (encontrados.length >= LOTE) break;
    }
    if (linhas.length < PAGINA) break;
    ultimoId = linhas[linhas.length - 1].id;
  }

  return encontrados;
}

async function gravarCanais(
  client: ReturnType<typeof getDirectusAdmin>,
  id: number,
  canais: Record<string, unknown>,
): Promise<void> {
  try {
    await client.request(updateItem(COLLECTION, id, { canais }));
  } catch (error) {
    console.error("[notificacoes] falha ao marcar canais:", error);
  }
}

export async function enviarNotificacoesPendentes(): Promise<ResultadoEnvio> {
  const client = getDirectusAdmin();
  const pendentes = await lerPendentes(client, new Date());

  const resultado: ResultadoEnvio = {
    analisadas: 0,
    emailEnviados: 0,
    whatsappEnviados: 0,
    falhas: 0,
  };

  // Só consulta o GoWA se houver o que mandar.
  const cfgGowa = pendentes.length > 0 ? await lerConfigGowa() : null;
  const smtp = smtpConfigurado();

  for (const n of pendentes) {
    const canais = lerCanais(n.canais);
    const destinatario = n.destinatario;
    const alteracoes: Record<string, unknown> = { ...canais };
    resultado.analisadas++;

    // Destinatário apagado: nada a entregar, mas o aviso precisa sair da fila.
    if (!destinatario) {
      for (const k of ["email", "whatsapp"] as const) {
        if (!canalResolvido(canais[k])) {
          alteracoes[k] = estadoPulado("sem destinatário");
        }
      }
      await gravarCanais(client, n.id, alteracoes);
      continue;
    }

    const texto = `${n.titulo}\n\n${n.mensagem}`;

    // E-mail
    const decEmail = decidirEmail(canais.email, {
      email: destinatario.email,
      smtp,
    });
    if (decEmail.acao === "pular") {
      alteracoes.email = estadoPulado(decEmail.motivo);
    } else if (decEmail.acao === "enviar") {
      const r = await enviarEmail(destinatario.email!, n.titulo, n.mensagem);
      alteracoes.email = r.ok ? estadoEnviado() : estadoFalha(canais.email, r.erro);
      if (r.ok) resultado.emailEnviados++;
      else resultado.falhas++;
    }

    // WhatsApp — exige número E consentimento explícito. O Directus devolve
    // booleanos como 1/0 nesta instância, daí o `booleano`.
    const decWhats = decidirWhatsapp(canais.whatsapp, {
      consentimento: booleano(destinatario.notificar_whatsapp),
      telefone: destinatario.telefone_notificacao,
      gowa: Boolean(cfgGowa),
    });
    if (decWhats.acao === "pular") {
      alteracoes.whatsapp = estadoPulado(decWhats.motivo);
    } else if (decWhats.acao === "enviar" && cfgGowa) {
      const r = await enviarWhatsapp(
        cfgGowa,
        destinatario.telefone_notificacao!,
        texto,
      );
      alteracoes.whatsapp = r.ok
        ? estadoEnviado()
        : estadoFalha(canais.whatsapp, r.erro);
      if (r.ok) resultado.whatsappEnviados++;
      else resultado.falhas++;
    }

    if (decEmail.acao !== "aguardar" || decWhats.acao !== "aguardar") {
      await gravarCanais(client, n.id, alteracoes);
    }
  }

  return resultado;
}
