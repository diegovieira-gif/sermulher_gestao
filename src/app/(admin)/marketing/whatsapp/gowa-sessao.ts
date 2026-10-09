"use server";

/**
 * Reconectar o WhatsApp do GoWA sem sair do SIGMA.
 *
 * Antes, quando a sessão caía, alguém precisava abrir o painel do GoWA
 * (http://…:3005) e entrar com o usuário e a senha do Basic Auth — que ficam
 * guardados no SIGMA e não deveriam circular pela equipe. Aqui o servidor
 * conversa com o GoWA usando essas credenciais e devolve à tela só o que ela
 * precisa: a imagem do QR Code (já baixada, em data URL) ou o código de
 * pareamento. A URL e a senha do GoWA nunca chegam ao navegador por este
 * caminho.
 *
 * API do go-whatsapp-web-multidevice:
 * - GET /app/status            → { results: { is_connected, is_logged_in } }
 * - GET /app/login             → { results: { qr_link, qr_duration } }
 * - GET /app/login-with-code   → { results: { pair_code } }  (?phone=55…)
 * - GET /app/reconnect         → reconecta uma sessão já pareada
 */

import { readSingleton } from "@directus/sdk";
import { getDirectusAdmin } from "@/lib/directus";
import { assertAccess } from "@/lib/permissions";

type Falha = { success: false; error: string };

type Gowa = { base: string; auth: string };

/** Envelope de resposta do GoWA: { code, message, results }. */
type RespostaGowa = {
  code?: string;
  message?: string;
  results?: {
    message?: string;
    is_connected?: boolean;
    is_logged_in?: boolean;
    qr_link?: string;
    qr_duration?: number;
    pair_code?: string;
    device_id?: string;
  };
} | null;

async function conexaoGowa(): Promise<Gowa | null> {
  const directus = getDirectusAdmin();
  const cfg = (await directus.request(
    readSingleton("configuracoes_site", {
      fields: ["evolution_api_url", "evolution_api_token"],
    }),
  )) as { evolution_api_url?: string | null; evolution_api_token?: string | null } | null;
  const base = (cfg?.evolution_api_url || "").trim().replace(/\/+$/, "");
  const token = (cfg?.evolution_api_token || "").trim();
  if (!base || !token) return null;
  return { base, auth: "Basic " + Buffer.from(token).toString("base64") };
}

async function chamar(
  g: Gowa,
  caminho: string,
  init: { method?: string; body?: unknown } = {},
): Promise<{ ok: boolean; status: number; json: RespostaGowa }> {
  const res = await fetch(`${g.base}${caminho}`, {
    method: init.method ?? "GET",
    headers: { Authorization: g.auth, ...(init.body ? { "Content-Type": "application/json" } : {}) },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const json = (await res.json().catch(() => null)) as RespostaGowa;
  return { ok: res.ok, status: res.status, json };
}

/** Id do aparelho criado quando o GoWA não tem nenhum (v8, multi-aparelho). */
const APARELHO_PADRAO = "SERMULHER RECEPÇÃO";

/** Cadastra o aparelho no GoWA se ele não existir. */
async function garantirAparelho(g: Gowa, id: string): Promise<void> {
  const lista = await chamar(g, "/devices");
  const aparelhos = (lista.json as { results?: { id?: string }[] | null } | null)?.results ?? [];
  if (aparelhos.some((a) => a.id === id)) return;
  await chamar(g, "/devices", { method: "POST", body: { device_id: id } });
}

const SEM_CONFIG = "O GoWA não está configurado (URL e credenciais em Configuração de Integração).";

function mensagemDoGowa(json: RespostaGowa, padrao: string): string {
  const m = json?.message || json?.results?.message;
  return typeof m === "string" && m ? `${padrao} (${m})` : padrao;
}

/** Situação da sessão do WhatsApp no GoWA. */
export async function statusWhatsapp(): Promise<
  { success: true; conectado: boolean; logado: boolean } | Falha
> {
  await assertAccess("marketing");
  try {
    const g = await conexaoGowa();
    if (!g) return { success: false, error: SEM_CONFIG };
    const r = await chamar(g, "/app/status");
    if (!r.ok) return { success: false, error: mensagemDoGowa(r.json, `GoWA respondeu ${r.status}`) };
    const s = r.json?.results ?? {};
    return { success: true, conectado: !!s.is_connected, logado: !!s.is_logged_in };
  } catch (e) {
    console.error("statusWhatsapp:", e);
    return { success: false, error: "Não foi possível alcançar o GoWA." };
  }
}

/**
 * Gera um QR Code novo. O GoWA devolve um LINK para a imagem no próprio
 * servidor dele (às vezes com o host interno do container); a imagem é
 * baixada aqui, com o Basic Auth, e vai para a tela como data URL.
 */
export async function gerarQrCodeWhatsapp(): Promise<
  | { success: true; jaConectado: true }
  | { success: true; jaConectado: false; imagem: string; validadeSeg: number }
  | Falha
> {
  await assertAccess("marketing");
  try {
    const g = await conexaoGowa();
    if (!g) return { success: false, error: SEM_CONFIG };

    let st = await chamar(g, "/app/status");
    if (st.ok && st.json?.results?.is_logged_in) return { success: true, jaConectado: true };
    // GoWA v8 é multi-aparelho: sem nenhum aparelho cadastrado, tudo responde
    // DEVICE_ID_REQUIRED. Cria um, para o QR ter onde se vincular.
    if (st.json?.code === "DEVICE_ID_REQUIRED") {
      await garantirAparelho(g, APARELHO_PADRAO);
      st = await chamar(g, "/app/status");
    }
    const aparelho = st.json?.results?.device_id || APARELHO_PADRAO;

    let r = await chamar(g, "/app/login");
    // Celular desvinculou o aparelho ("session deleted"): o GoWA guarda as
    // credenciais mortas e, antes de gerar QR, tenta retomá-las — e falha com
    // "reconnect error" para sempre. Com a sessão comprovadamente fora do ar
    // (status sem login), limpar a sessão velha é o que destrava o QR.
    if (!r.ok && /reconnect/i.test(String(r.json?.message || ""))) {
      const s = await chamar(g, "/app/status");
      if (s.ok && !s.json?.results?.is_logged_in) {
        // No v8, o logout também descadastra o aparelho: recria com o mesmo id.
        await chamar(g, "/app/logout");
        await garantirAparelho(g, aparelho);
        r = await chamar(g, "/app/login");
      }
    }
    if (!r.ok) {
      const msg = String(r.json?.message || "");
      if (/already/i.test(msg)) return { success: true, jaConectado: true };
      return { success: false, error: mensagemDoGowa(r.json, "O GoWA não gerou o QR Code") };
    }
    const link = String(r.json?.results?.qr_link || "");
    if (!link) return { success: false, error: "O GoWA não devolveu o QR Code." };

    // Só o caminho do link: o host que o GoWA informa pode ser o interno.
    let caminho: string;
    try {
      const u = new URL(link, g.base);
      caminho = u.pathname + u.search;
    } catch {
      return { success: false, error: "Link do QR Code inválido." };
    }
    const img = await fetch(`${g.base}${caminho}`, {
      headers: { Authorization: g.auth },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const tipo = (img.headers.get("content-type") || "").split(";")[0].trim();
    if (!img.ok || !tipo.startsWith("image/")) {
      return { success: false, error: "Não foi possível baixar a imagem do QR Code." };
    }
    const bytes = Buffer.from(await img.arrayBuffer());
    const validadeSeg = Number(r.json?.results?.qr_duration) || 30;
    return {
      success: true,
      jaConectado: false,
      imagem: `data:${tipo};base64,${bytes.toString("base64")}`,
      validadeSeg,
    };
  } catch (e) {
    console.error("gerarQrCodeWhatsapp:", e);
    return { success: false, error: "Não foi possível alcançar o GoWA." };
  }
}

/**
 * Código de pareamento: alternativa ao QR quando o celular é o mesmo aparelho
 * que mostra a tela (não dá para escanear a si mesmo). No WhatsApp:
 * Aparelhos conectados → Conectar com número de telefone.
 */
export async function codigoPareamentoWhatsapp(
  telefone: string,
): Promise<{ success: true; codigo: string } | Falha> {
  await assertAccess("marketing");
  let digitos = String(telefone || "").replace(/\D/g, "");
  if (digitos.length === 10 || digitos.length === 11) digitos = `55${digitos}`;
  if (digitos.length < 12 || digitos.length > 13) {
    return { success: false, error: "Informe o número com DDD, ex.: (79) 99999-0000." };
  }
  try {
    const g = await conexaoGowa();
    if (!g) return { success: false, error: SEM_CONFIG };
    const r = await chamar(g, `/app/login-with-code?phone=${digitos}`);
    const codigo = r.json?.results?.pair_code;
    if (!r.ok || typeof codigo !== "string" || !codigo) {
      return { success: false, error: mensagemDoGowa(r.json, "O GoWA não gerou o código") };
    }
    return { success: true, codigo };
  } catch (e) {
    console.error("codigoPareamentoWhatsapp:", e);
    return { success: false, error: "Não foi possível alcançar o GoWA." };
  }
}

/** Reconecta uma sessão que já está pareada mas caiu (sem novo QR). */
export async function reconectarWhatsapp(): Promise<{ success: true; logado: boolean } | Falha> {
  await assertAccess("marketing");
  try {
    const g = await conexaoGowa();
    if (!g) return { success: false, error: SEM_CONFIG };
    const r = await chamar(g, "/app/reconnect");
    if (!r.ok) return { success: false, error: mensagemDoGowa(r.json, "O GoWA não reconectou") };
    const st = await chamar(g, "/app/status");
    return { success: true, logado: !!st.json?.results?.is_logged_in };
  } catch (e) {
    console.error("reconectarWhatsapp:", e);
    return { success: false, error: "Não foi possível alcançar o GoWA." };
  }
}
