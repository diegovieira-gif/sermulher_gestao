/**
 * Curso Sigma — cálculo do progresso das vídeo-aulas.
 *
 * O progresso não é "até onde a barra chegou": quem arrasta para o fim não
 * assistiu. Guardamos os TRECHOS realmente tocados ([início, fim] em segundos)
 * e o percentual é a parte da duração coberta por eles. Rever um trecho não
 * soma de novo; assistir em dias diferentes soma.
 *
 * Módulo puro (sem Directus, sem React): usado no servidor, no cliente e nos
 * testes unitários.
 */

export type Trecho = [number, number];

/** A partir deste percentual a aula conta como concluída. */
export const LIMIAR_CONCLUSAO = 90;

/** Junta trechos que se tocam ou se sobrepõem (tolerância de 1 s). */
export function mesclarTrechos(...listas: Array<Trecho[] | null | undefined>): Trecho[] {
  const todos = listas
    .flatMap((l) => (Array.isArray(l) ? l : []))
    .filter(
      (t): t is Trecho =>
        Array.isArray(t) &&
        t.length === 2 &&
        Number.isFinite(t[0]) &&
        Number.isFinite(t[1]) &&
        t[1] > t[0],
    )
    .map(([a, b]) => [Math.max(0, a), b] as Trecho)
    .sort((x, y) => x[0] - y[0]);

  const saida: Trecho[] = [];
  for (const [a, b] of todos) {
    const ultimo = saida[saida.length - 1];
    if (ultimo && a <= ultimo[1] + 1) ultimo[1] = Math.max(ultimo[1], b);
    else saida.push([a, b]);
  }
  return saida.map(([a, b]) => [Math.round(a * 10) / 10, Math.round(b * 10) / 10]);
}

/** Segundos cobertos pelos trechos, sem passar da duração da aula. */
export function segundosAssistidos(trechos: Trecho[], duracao: number): number {
  if (!(duracao > 0)) return 0;
  return mesclarTrechos(trechos).reduce(
    (soma, [a, b]) => soma + Math.max(0, Math.min(b, duracao) - Math.min(a, duracao)),
    0,
  );
}

/** Percentual assistido (0–100, uma casa decimal). */
export function percentualAssistido(trechos: Trecho[], duracao: number): number {
  if (!(duracao > 0)) return 0;
  const p = (segundosAssistidos(trechos, duracao) / duracao) * 100;
  // os últimos segundos costumam ser o cartão final: acima do limiar, arredonda
  return Math.min(100, Math.round(p * 10) / 10);
}

/**
 * Progresso no curso inteiro: média do percentual de cada aula PUBLICADA
 * (aula não assistida conta zero). Progresso de aula despublicada não entra.
 */
export function progressoDoCurso(
  aulaIds: Array<string | number>,
  percentuais: Map<string, number> | Record<string, number>,
): { percentual: number; concluidas: number; total: number } {
  const total = aulaIds.length;
  if (!total) return { percentual: 0, concluidas: 0, total: 0 };
  const ler = (id: string | number) =>
    percentuais instanceof Map ? percentuais.get(String(id)) : percentuais[String(id)];
  let soma = 0;
  let concluidas = 0;
  for (const id of aulaIds) {
    const p = Math.min(100, Math.max(0, Number(ler(id) ?? 0)));
    soma += p;
    if (p >= LIMIAR_CONCLUSAO) concluidas++;
  }
  return { percentual: Math.round((soma / total) * 10) / 10, concluidas, total };
}

/** "125" → "2:05". */
export function formatarDuracao(segundos: number): string {
  const s = Math.max(0, Math.round(segundos));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Agrupa as aulas por módulo, mantendo a ordem em que aparecem. */
export function agruparPorModulo<T extends { modulo: string }>(aulas: T[]): Array<{ modulo: string; aulas: T[] }> {
  const grupos: Array<{ modulo: string; aulas: T[] }> = [];
  for (const aula of aulas) {
    const g = grupos.find((x) => x.modulo === aula.modulo);
    if (g) g.aulas.push(aula);
    else grupos.push({ modulo: aula.modulo, aulas: [aula] });
  }
  return grupos;
}
