/**
 * Datas no horário de Brasília (Sergipe: UTC-3, sem horário de verão),
 * independentemente do fuso do servidor ou do navegador.
 *
 * Os dois erros que este módulo evita, e que apareciam por todo o sistema:
 *
 * 1. `new Date("2026-10-08")` é meia-noite em UTC = 21h do dia 07 em Brasília.
 *    Formatado no fuso local, a data aparece UM DIA ANTES.
 * 2. `new Date().toISOString().slice(0, 10)` é o dia em UTC: das 21h à
 *    meia-noite em Brasília, "hoje" vira AMANHÃ.
 *
 * Módulo puro — servidor, cliente e testes.
 */

export const FUSO = "America/Maceio";

/** "AAAA-MM-DD" de um instante, no calendário de Brasília. */
export function dataEmBrasilia(instante: Date = new Date()): string {
  // en-CA formata como AAAA-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instante);
}

/** Hoje em Brasília, "AAAA-MM-DD" (valor padrão de campos de data). */
export function hojeEmBrasilia(): string {
  return dataEmBrasilia(new Date());
}

/** Mês corrente em Brasília (1–12). */
export function mesAtualEmBrasilia(agora: Date = new Date()): { ano: number; mes: number } {
  const [ano, mes] = dataEmBrasilia(agora).split("-").map(Number);
  return { ano, mes };
}

/** Último dia do mês (28–31). */
export function ultimoDiaDoMes(ano: number, mes: number): number {
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
}

/**
 * Limites de um mês para filtrar no Directus.
 *
 * - Campo `date` (só data): `_between [inicio, fim]` com as datas.
 * - Campo `timestamp` (instante em UTC): `_gte inicioInstante`, `_lt fimInstante`
 *   — o mês de Brasília, convertido para UTC. NUNCA `_between` com a data do
 *   último dia: o limite vira 00:00 e o dia inteiro some do relatório.
 */
export function limitesDoMes(ano: number, mes: number) {
  const mm = String(mes).padStart(2, "0");
  const ultimo = ultimoDiaDoMes(ano, mes);
  const proxAno = mes === 12 ? ano + 1 : ano;
  const proxMes = String(mes === 12 ? 1 : mes + 1).padStart(2, "0");
  return {
    inicio: `${ano}-${mm}-01`,
    fim: `${ano}-${mm}-${String(ultimo).padStart(2, "0")}`,
    /** 00:00 do dia 1 em Brasília, em ISO UTC. */
    inicioInstante: new Date(`${ano}-${mm}-01T00:00:00-03:00`).toISOString(),
    /** 00:00 do dia 1 do mês seguinte em Brasília, em ISO UTC (exclusivo). */
    fimInstante: new Date(`${proxAno}-${proxMes}-01T00:00:00-03:00`).toISOString(),
  };
}

/**
 * "08/10/2026" a partir do que o Directus devolve:
 * - "2026-10-08" (date) → sem conversão de fuso;
 * - "2026-10-08T14:00:00" (dateTime, hora de parede) → a data escrita;
 * - "2026-10-08T17:00:00.000Z" (timestamp) → a data em Brasília.
 */
export function formatarData(valor: string | null | undefined, vazio = "-"): string {
  if (!valor) return vazio;
  const s = String(valor);
  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(s)) {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return vazio;
    const [a, m, dia] = dataEmBrasilia(d).split("-");
    return `${dia}/${m}/${a}`;
  }
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : vazio;
}

/** "08/10/2026 14:00" — mesma regra de fuso de `formatarData`. */
export function formatarDataHora(valor: string | null | undefined, vazio = "-"): string {
  if (!valor) return vazio;
  const s = String(valor);
  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(s)) {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return vazio;
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: FUSO, day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
    }).format(d).replace(",", "");
  }
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (!m) return vazio;
  return m[4] ? `${m[3]}/${m[2]}/${m[1]} ${m[4]}:${m[5]}` : `${m[3]}/${m[2]}/${m[1]}`;
}

/**
 * Data "AAAA-MM-DD" como Date ao MEIO-DIA local — para bibliotecas que exigem
 * Date (calendário, date-fns). Meio-dia não troca de dia em nenhum fuso do país.
 */
export function dataLocal(valor: string): Date {
  const [a, m, d] = valor.slice(0, 10).split("-").map(Number);
  return new Date(a, m - 1, d, 12, 0, 0);
}

/** Booleano do Directus: esta instância (SQLite) devolve 1/0 em vários campos. */
export function booleano(v: unknown): boolean {
  return v === true || v === 1 || v === "1" || v === "true";
}
