import { test, expect } from "@playwright/test";
import { frequenciasPorParticipacao, percentualDeFrequencia } from "../../src/lib/frequencia";

/**
 * Frequência da Sala Azul: calculada pela lista de presença, com a mesma
 * conta do relatório enviado ao Judiciário.
 */

test.describe("percentualDeFrequencia", () => {
  test("arredonda para inteiro", () => {
    expect(percentualDeFrequencia(3, 2)).toBe(67);
    expect(percentualDeFrequencia(8, 8)).toBe(100);
  });

  test("ciclo sem sessões dá zero, não divisão por zero", () => {
    expect(percentualDeFrequencia(0, 0)).toBe(0);
  });

  test("nunca passa de 100 nem fica negativa", () => {
    expect(percentualDeFrequencia(4, 9)).toBe(100);
    expect(percentualDeFrequencia(4, -1)).toBe(0);
  });
});

test.describe("frequenciasPorParticipacao", () => {
  const sessoes = [10, 11, 12, 13];

  test("sessão sem chamada lançada conta como falta, como no relatório", () => {
    const f = frequenciasPorParticipacao(sessoes, [
      { sessao_id: 10, participacao_id: 1, presente: true },
      { sessao_id: 11, participacao_id: 1, presente: true },
      { sessao_id: 12, participacao_id: 1, presente: false },
    ], [1]);
    expect(f.get(1)).toEqual({ totalSessoes: 4, presencas: 2, percentual: 50 });
  });

  test("participação sem nenhum registro aparece com zero", () => {
    expect(frequenciasPorParticipacao(sessoes, [], [7]).get(7)?.percentual).toBe(0);
  });

  test("ignora presença de sessão excluída e registro duplicado", () => {
    const f = frequenciasPorParticipacao(sessoes, [
      { sessao_id: 10, participacao_id: 1, presente: true },
      { sessao_id: 10, participacao_id: 1, presente: true },
      { sessao_id: 99, participacao_id: 1, presente: true },
    ], [1]);
    expect(f.get(1)?.presencas).toBe(1);
    expect(f.get(1)?.percentual).toBe(25);
  });

  test("ids que chegam como texto do Directus casam com números", () => {
    const f = frequenciasPorParticipacao(sessoes, [
      { sessao_id: "13", participacao_id: "2", presente: true },
    ], [2]);
    expect(f.get(2)?.presencas).toBe(1);
  });
});
