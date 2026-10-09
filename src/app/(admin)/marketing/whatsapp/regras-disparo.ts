/**
 * Regras puras do disparo de campanhas de WhatsApp.
 *
 * Fora do `actions.ts` porque arquivos "use server" só podem exportar funções
 * assíncronas, e porque estas regras precisam de teste unitário: errar aqui
 * significa mensagem duplicada para centenas de beneficiárias.
 */

/**
 * Um disparo "running" mais antigo que isto é considerado abandonado (o
 * processo caiu no meio, ou o fluxo do n8n nunca devolveu o status). Só vale
 * para campanhas AUTOMÁTICAS, que precisam rodar de novo no dia seguinte; a
 * manual em "running" segue bloqueada — reenviar é decisão humana (duplicar a
 * campanha), não do sistema.
 */
export const DISPARO_ABANDONADO_MS = 6 * 60 * 60 * 1000;

export interface CampanhaParaDisparo {
  status?: string | null;
  tipo?: string | null;
  data_envio?: string | null;
}

/**
 * Motivo para RECUSAR um disparo, ou `null` se pode disparar.
 *
 * - "running": já há um envio em andamento → disparar de novo duplicaria as
 *   mensagens (clique duplo, duas abas, cron sobreposto).
 * - "completed": a campanha manual já foi enviada. A automática volta a
 *   rodar todo dia; para ela a proteção do mesmo dia é `ultima_execucao`.
 */
export function motivoBloqueioDisparo(
  campanha: CampanhaParaDisparo,
  agora: Date = new Date(),
): string | null {
  const automatica = campanha.tipo === "automatica";

  if (campanha.status === "running") {
    if (automatica) {
      const inicio = campanha.data_envio ? new Date(campanha.data_envio).getTime() : NaN;
      const abandonado =
        Number.isNaN(inicio) || agora.getTime() - inicio >= DISPARO_ABANDONADO_MS;
      if (abandonado) return null;
    }
    return "Esta campanha já está sendo enviada. Aguarde o término antes de disparar de novo.";
  }

  if (campanha.status === "completed" && !automatica) {
    return "Esta campanha já foi enviada. Para reenviar, crie uma nova campanha (ou duplique esta).";
  }

  return null;
}

/** Mesmo instante, ao segundo — o banco pode descartar os milissegundos. */
export function mesmoSegundo(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  const ta = new Date(a).getTime();
  const tb = new Date(b).getTime();
  if (Number.isNaN(ta) || Number.isNaN(tb)) return false;
  return Math.floor(ta / 1000) === Math.floor(tb / 1000);
}

/**
 * "AAAA-MM-DD" de `hoje` (já no calendário de Brasília) menos N anos.
 * 29/02 em ano não bissexto vira 28/02 — sem rolar para março.
 */
export function dataMenosAnos(hoje: string, anos: number): string {
  const [a, m, d] = hoje.slice(0, 10).split("-").map(Number);
  const ano = a - anos;
  const ultimoDia = new Date(Date.UTC(ano, m, 0)).getUTCDate();
  const dia = Math.min(d, ultimoDia);
  return `${String(ano).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

/** Mês (1–12) e dia de "AAAA-MM-DD" — para o filtro de aniversariantes. */
export function mesEDia(hoje: string): { mes: number; dia: number } {
  const [, m, d] = hoje.slice(0, 10).split("-").map(Number);
  return { mes: m, dia: d };
}
