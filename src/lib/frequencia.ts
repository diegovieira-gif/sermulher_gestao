/**
 * Frequência de um participante da Sala Azul.
 *
 * Fonte única: a lista de presença das sessões do ciclo. É a mesma conta do
 * Relatório de Acompanhamento enviado ao Judiciário — sessão sem chamada
 * lançada conta como falta. A avaliação, a lista do ciclo e o histórico do
 * infrator mostram este valor; ninguém o digita.
 */
export function percentualDeFrequencia(totalSessoes: number, presencas: number): number {
  if (!totalSessoes || totalSessoes <= 0) return 0;
  const presentes = Math.min(Math.max(presencas, 0), totalSessoes);
  return Math.round((presentes / totalSessoes) * 100);
}

export type FrequenciaCalculada = {
  totalSessoes: number;
  presencas: number;
  percentual: number;
};

/**
 * Cruza as sessões do ciclo com os registros de presença. Presença de uma
 * sessão que não está mais no ciclo (excluída) é ignorada.
 */
export function frequenciasPorParticipacao(
  sessaoIds: number[],
  registros: Array<Record<string, unknown>>,
  participacaoIds: number[],
): Map<number, FrequenciaCalculada> {
  const sessoes = new Set(sessaoIds.map(Number));
  const presentes = new Map<number, Set<number>>();
  for (const r of registros) {
    if (r.presente !== true) continue;
    const sessao = Number(r.sessao_id);
    const participacao = Number(r.participacao_id);
    if (!sessoes.has(sessao)) continue;
    if (!presentes.has(participacao)) presentes.set(participacao, new Set());
    presentes.get(participacao)!.add(sessao);
  }
  const total = sessoes.size;
  return new Map(
    participacaoIds.map((id) => {
      const n = presentes.get(Number(id))?.size ?? 0;
      return [Number(id), { totalSessoes: total, presencas: n, percentual: percentualDeFrequencia(total, n) }];
    }),
  );
}
