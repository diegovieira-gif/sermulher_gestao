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
