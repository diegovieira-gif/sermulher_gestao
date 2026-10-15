import { request } from "node:https";
import { consultarCpfSiged } from "./siged";
import { combinarDados, dadosDoHub, dadosDoSiged, type DadosPessoa } from "./dados-pessoa";

/**
 * Busca de uma pessoa pelo CPF nas bases da Prefeitura, para os cadastros do
 * SIGMA se preencherem sozinhos. SÓ NO SERVIDOR: a chave do Hub nunca vai ao
 * navegador.
 *
 * - Hub de Dados (`hub/cidadao`, SEMED): HUB_CONSULTA_TOKEN no ambiente;
 *   HUB_CONSULTA_URL opcional. Sem token, o Hub fica de fora e vale só o SIGED.
 * - SIGED: ver lib/siged.ts.
 *
 * Cada consulta fica registrada na auditoria do Hub em nome da SERMULHER:
 * chame só quando alguém digitou o CPF num cadastro.
 */

export const HUB_CONSULTA_URL_PADRAO = "https://portal.educacao.aju.br/webservice/hub/cidadao";
const TIMEOUT_MS = 8000;

/**
 * O Hub pede GET com corpo JSON (`{"method":"cidadao","cpf":…}`) — o `fetch`
 * não envia corpo em GET, por isso o `https.request` direto.
 */
function getComCorpo(url: string, token: string, corpo: unknown): Promise<{ status: number; json: unknown }> {
  const body = Buffer.from(JSON.stringify(corpo));
  return new Promise((resolve, reject) => {
    const req = request(
      url,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "Content-Length": body.length,
        },
        timeout: TIMEOUT_MS,
      },
      (res) => {
        const partes: Buffer[] = [];
        res.on("data", (c: Buffer) => partes.push(c));
        res.on("end", () => {
          let json: unknown = null;
          try {
            json = JSON.parse(Buffer.concat(partes).toString("utf8"));
          } catch {
            /* resposta não-JSON: trata como falha */
          }
          resolve({ status: res.statusCode ?? 0, json });
        });
      },
    );
    req.on("timeout", () => req.destroy(new Error("tempo esgotado no Hub de Dados")));
    req.on("error", reject);
    req.end(body);
  });
}

/** Ficha do Hub pelo CPF; null = não encontrado, Hub desligado ou fora do ar. */
export async function consultarCpfHub(cpf: string): Promise<DadosPessoa | null> {
  const token = process.env.HUB_CONSULTA_TOKEN?.trim();
  const limpo = String(cpf ?? "").replace(/\D/g, "");
  if (!token || limpo.length !== 11) return null;
  const url = process.env.HUB_CONSULTA_URL?.trim() || HUB_CONSULTA_URL_PADRAO;
  try {
    const r = await getComCorpo(url, token, { method: "cidadao", cpf: limpo });
    if (r.status === 401 || r.status === 403) {
      console.error("[hub-consulta] chave recusada pelo Hub (HTTP", r.status + ")");
      return null;
    }
    return dadosDoHub(r.json);
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
