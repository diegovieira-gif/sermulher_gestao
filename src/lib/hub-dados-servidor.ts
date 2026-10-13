import { NextResponse } from "next/server";
import { directusAdminConfig } from "./directus";
import { secureCompare } from "./secure-compare";
import { elegiveisHub, type BeneficiariaHub } from "./hub-dados";

/**
 * Parte de servidor da fonte do Hub de Dados (ver lib/hub-dados.ts):
 * autenticação, leitura no Directus e registro de cada consulta.
 */

/** Tempo máximo de cada leitura no Directus: responder erro rápido é melhor
 *  para o Hub do que deixar a conexão pendurada (pedido do contrato). */
const TIMEOUT_MS = 8000;

/**
 * Token do Hub: HUB_DADOS_TOKEN no ambiente (Coolify). Sem ele a fonte fica
 * desligada (503). Token ausente ou errado → 401, como pede o contrato —
 * nunca 200 com "failed" no corpo.
 */
export function respostaDeAutenticacao(request: Request): NextResponse | null {
  const esperado = process.env.HUB_DADOS_TOKEN?.trim();
  if (!esperado) {
    return NextResponse.json(
      { status: "failed", message: "Fonte do Hub de Dados não configurada." },
      { status: 503 },
    );
  }
  const informado = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!informado || !secureCompare(informado, esperado)) {
    return NextResponse.json(
      { status: "failed", message: "Token inválido ou ausente." },
      { status: 401, headers: { "WWW-Authenticate": "Bearer" } },
    );
  }
  return null;
}

async function lerDirectus<T>(caminho: string): Promise<T> {
  const { url, token } = directusAdminConfig();
  const res = await fetch(`${url}${caminho}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Directus ${res.status} em ${caminho.split("?")[0]}`);
  return ((await res.json())?.data ?? []) as T;
}

/** Beneficiárias que podem ir ao Hub, já filtradas e em ordem estável. */
export async function carregarElegiveisHub(): Promise<BeneficiariaHub[]> {
  const filtroCpf = encodeURIComponent(JSON.stringify({ cpf: { _nnull: true, _nempty: true } }));
  const [beneficiarias, atendimentos] = await Promise.all([
    lerDirectus<BeneficiariaHub[]>(
      `/items/beneficiarias?fields=id,cpf,nome_completo,data_nascimento,possui_medida_protetiva,date_created,date_updated&filter=${filtroCpf}&sort=id&limit=-1`,
    ),
    lerDirectus<{ beneficiaria: number | null }[]>(
      `/items/atendimentos?fields=beneficiaria&filter=${encodeURIComponent(
        JSON.stringify({ medida_protetiva: { _eq: true } }),
      )}&limit=-1`,
    ),
  ]);
  const comMedida = new Set(
    atendimentos.map((a) => Number(a.beneficiaria)).filter((n) => Number.isFinite(n)),
  );
  return elegiveisHub(beneficiarias, comMedida);
}

/**
 * Uma linha por consulta do Hub no log do servidor (Coolify → Logs), para
 * auditoria: quem pediu, o quê e quanto saiu. Nunca registra CPF ou nome.
 */
export function registrarConsultaHub(
  request: Request,
  info: { rota: string; status: number; qtd?: number; erro?: string },
) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "?";
  console.info(
    "[hub-dados] " +
      JSON.stringify({ em: new Date().toISOString(), ip, ...info }),
  );
}
