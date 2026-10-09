/**
 * Configuração da consulta de CPF no SIGED (sistema da rede municipal de
 * educação), usada para preencher o cadastro de beneficiária.
 *
 * Até 10/2026 a URL e o token Bearer estavam escritos em
 * `mulheres/beneficiarias/actions.ts` — num repositório PÚBLICO. O token
 * vazou (está no histórico do git desde 15/06/2026) e precisa ser rotacionado
 * pela equipe do SIGED; tirá-lo do código só impede que o NOVO vaze também.
 *
 * - `SIGED_API_TOKEN` é obrigatório e não tem padrão: segredo não mora no
 *   código. Sem ele a consulta fica desligada, e o formulário continua
 *   funcionando — só não preenche sozinho.
 * - `SIGED_API_URL` é opcional. O padrão é o endpoint de HOMOLOGAÇÃO, que é o
 *   que o sistema sempre usou; troque pelo de produção quando a equipe do
 *   SIGED fornecer.
 */

export const SIGED_URL_PADRAO =
  "https://homolog.siged.educacao.aju.br/webservice/users/findByCPF";

/** Tempo máximo de espera pela API externa. Lenta, ela travava o formulário. */
export const SIGED_TIMEOUT_MS = 8000;

export type ConfigSiged = { url: string; token: string };

type Ambiente = Record<string, string | undefined>;

/** Lê a configuração do ambiente. `null` = consulta desligada (sem token). */
export function configSiged(env: Ambiente = process.env): ConfigSiged | null {
  const token = env.SIGED_API_TOKEN?.trim();
  if (!token) return null;
  const url = env.SIGED_API_URL?.trim() || SIGED_URL_PADRAO;
  return { url, token };
}

/** Registro devolvido pelo SIGED (só os campos que o SIGMA usa). */
export type RegistroSiged = {
  userName?: string;
  userSocialName?: string;
  userBorn?: string; // "DD/MM/AAAA"
  userPhone1?: string;
  userMail?: string;
  userAddressStreet?: string;
  userAddressNumber?: string;
  userAddressDistrict?: string;
  userAddressCity?: string;
};

/**
 * Consulta um CPF no SIGED. Sem autorização própria: quem chama (a action de
 * cada módulo) faz o `assertAccess` do seu módulo antes.
 * `data: null` = CPF não encontrado.
 */
export async function consultarCpfSiged(
  cpf: string,
): Promise<{ success: true; data: RegistroSiged | null } | { success: false; error: string }> {
  const limpo = String(cpf ?? "").replace(/\D/g, "");
  if (limpo.length !== 11) {
    return { success: false, error: "CPF inválido. Deve conter 11 dígitos numéricos." };
  }
  const siged = configSiged();
  if (!siged) return { success: false, error: "Consulta à rede municipal não configurada." };
  try {
    const response = await fetch(siged.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${siged.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ userCPF: limpo }),
      signal: AbortSignal.timeout(SIGED_TIMEOUT_MS),
    });
    if (!response.ok) return { success: false, error: `Erro na API externa: ${response.statusText}` };
    const json = await response.json();
    if (json?.status === "success" && Array.isArray(json.data) && json.data.length > 0) {
      return { success: true, data: json.data[0] as RegistroSiged };
    }
    return { success: true, data: null };
  } catch (error) {
    console.error("Erro ao consultar o SIGED:", error);
    return { success: false, error: "Erro de conexão ao buscar CPF." };
  }
}

/** "DD/MM/AAAA" do SIGED → "AAAA-MM-DD" (campo date); "" se não der. */
export function nascimentoDoSiged(valor?: string | null): string {
  const p = String(valor ?? "").split("/");
  return p.length === 3 && p[2].length === 4 ? `${p[2]}-${p[1].padStart(2, "0")}-${p[0].padStart(2, "0")}` : "";
}

/** Telefone do SIGED em dígitos, sem o 55 do país. */
export function telefoneDoSiged(valor?: string | null): string {
  let t = String(valor ?? "").replace(/\D/g, "");
  if (t.startsWith("55") && (t.length === 12 || t.length === 13)) t = t.slice(2);
  return t;
}
