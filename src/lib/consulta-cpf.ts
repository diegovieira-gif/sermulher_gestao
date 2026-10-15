import { consultarCpfSiged } from "./siged";
import { combinarDados, dadosDoHub, dadosDoSiged, type DadosPessoa } from "./dados-pessoa";

/**
 * Busca de uma pessoa pelo CPF nas bases da Prefeitura, para os cadastros do
 * SIGMA se preencherem sozinhos. SÓ NO SERVIDOR: a chave do Hub nunca vai ao
 * navegador.
 *
 * - Hub de Dados (SEMED): `GET {HUB_CONSULTA_URL}/{cpf}` com Bearer
 *   HUB_CONSULTA_TOKEN (token com escopo hub/cidadao — o Bearer legado MD5 é
 *   recusado). Sem token, o Hub fica de fora e vale só o SIGED.
 * - SIGED: ver lib/siged.ts.
 *
 * Cada consulta fica registrada na auditoria do Hub em nome da SERMULHER:
 * chame só quando alguém digitou o CPF num cadastro.
 */

export const HUB_CONSULTA_URL_PADRAO = "https://portal.educacao.aju.br/webservice/hub/cidadao";
const TIMEOUT_MS = 8000;

/** URL da ficha: o CPF vai no caminho (formato da documentação da SEMED). */
export function urlFichaHub(cpf: string, base = HUB_CONSULTA_URL_PADRAO): string {
  return `${base.replace(/\/+$/, "")}/${cpf}`;
}

/** Ficha do Hub pelo CPF; null = não encontrado, Hub desligado ou fora do ar. */
export async function consultarCpfHub(cpf: string): Promise<DadosPessoa | null> {
  const token = process.env.HUB_CONSULTA_TOKEN?.trim();
  const limpo = String(cpf ?? "").replace(/\D/g, "");
  if (!token || limpo.length !== 11) return null;
  const base = process.env.HUB_CONSULTA_URL?.trim() || HUB_CONSULTA_URL_PADRAO;
  try {
    const res = await fetch(urlFichaHub(limpo, base), {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (res.status === 401 || res.status === 403) {
      console.error("[hub-consulta] chave recusada pelo Hub (HTTP", res.status + ")");
      return null;
    }
    return dadosDoHub(await res.json().catch(() => null));
  } catch (error) {
    console.error("[hub-consulta] falha:", error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Hub + SIGED em paralelo, combinados (ver combinarDados). `origens` diz de
 * onde veio o que foi achado, para a tela informar.
 */
export async function consultarCpfUnificado(
  cpf: string,
): Promise<{ dados: DadosPessoa | null; origens: string[] }> {
  const [hub, siged] = await Promise.all([
    consultarCpfHub(cpf),
    consultarCpfSiged(cpf).then((r) => (r.success ? dadosDoSiged(r.data) : null)).catch(() => null),
  ]);
  return combinarDados(hub, siged);
}
