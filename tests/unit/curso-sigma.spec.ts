import { test, expect } from "@playwright/test";
import {
  agruparPorModulo,
  formatarDuracao,
  mesclarTrechos,
  percentualAssistido,
  progressoDoCurso,
  segundosAssistidos,
} from "../../src/lib/curso-sigma";

/**
 * Progresso do Curso Sigma. O percentual é o que a pessoa ASSISTIU, não até
 * onde a barra chegou: é o número que a gestão vai olhar para saber quem já
 * fez o treinamento.
 */

test.describe("mesclarTrechos", () => {
  test("junta trechos sobrepostos ou encostados e ordena", () => {
    expect(mesclarTrechos([[10, 20], [0, 5], [19, 30], [5.5, 8]])).toEqual([
      [0, 8],
      [10, 30],
    ]);
  });

  test("soma listas diferentes (servidor + navegador)", () => {
    expect(mesclarTrechos([[0, 10]], [[30, 40]], null, undefined)).toEqual([
      [0, 10],
      [30, 40],
    ]);
  });

  test("descarta lixo: invertido, vazio, não numérico, negativo", () => {
    const sujo = [[5, 5], [9, 3], ["a", 2], [-4, 2], [1, Number.NaN]] as unknown as [number, number][];
    expect(mesclarTrechos(sujo)).toEqual([[0, 2]]);
  });
});

test.describe("percentualAssistido", () => {
  test("rever o mesmo trecho não soma de novo", () => {
    expect(percentualAssistido([[0, 50], [0, 50], [10, 40]], 100)).toBe(50);
  });

  test("pular para o fim não conta o que foi pulado", () => {
    expect(percentualAssistido([[0, 10], [95, 100]], 100)).toBe(15);
  });

  test("trecho além da duração é cortado; nunca passa de 100", () => {
    expect(segundosAssistidos([[90, 400]], 100)).toBe(10);
    expect(percentualAssistido([[0, 400]], 100)).toBe(100);
  });

  test("aula sem duração conhecida fica em zero", () => {
    expect(percentualAssistido([[0, 10]], 0)).toBe(0);
  });
});

test.describe("progressoDoCurso", () => {
  test("média das aulas publicadas; aula não vista conta zero", () => {
    expect(progressoDoCurso([1, 2, 3, 4], { "1": 100, "2": 50 })).toEqual({
      percentual: 37.5,
      concluidas: 1,
      total: 4,
    });
  });

  test("conclui a partir de 90% e ignora aula despublicada", () => {
    const p = progressoDoCurso([1, 2], new Map([["1", 92], ["2", 89], ["99", 100]]));
    expect(p.concluidas).toBe(1);
    expect(p.percentual).toBe(90.5);
  });

  test("curso sem aulas", () => {
    expect(progressoDoCurso([], {})).toEqual({ percentual: 0, concluidas: 0, total: 0 });
  });
});

test("formatarDuracao e agruparPorModulo", () => {
  expect(formatarDuracao(125)).toBe("2:05");
  expect(formatarDuracao(59.6)).toBe("1:00");
  const g = agruparPorModulo([
    { modulo: "0", id: 1 },
    { modulo: "0", id: 2 },
    { modulo: "1", id: 3 },
  ]);
  expect(g.map((x) => [x.modulo, x.aulas.length])).toEqual([["0", 2], ["1", 1]]);
});
