import { test, expect } from "@playwright/test";
import { pactuacoesPreenchidas } from "../../src/app/(admin)/cram/schemas";
import { planejarFrequencia } from "../../src/app/(admin)/escola/frequencia-plano";

/**
 * CRAM (PIA) e Escola (chamada): lógica pura extraída das actions.
 */

test.describe("pactuacoesPreenchidas", () => {
  test("descarta linhas totalmente em branco e mantém as preenchidas", () => {
    const linhas = [
      { demanda_identificada: "", servico_ofertado: "  ", acao_realizada: "" },
      { id: 3, demanda_identificada: "Moradia", servico_ofertado: "", acao_realizada: "" },
      { demanda_identificada: "", servico_ofertado: "CRAS", acao_realizada: "" },
    ];
    const resultado = pactuacoesPreenchidas(linhas);
    expect(resultado).toHaveLength(2);
    expect(resultado[0].id).toBe(3);
    expect(resultado[1].servico_ofertado).toBe("CRAS");
  });

  test("aceita lista ausente", () => {
    expect(pactuacoesPreenchidas(undefined)).toEqual([]);
    expect(pactuacoesPreenchidas(null)).toEqual([]);
  });
});

test.describe("planejarFrequencia", () => {
  test("data sem chamada: cria todas", () => {
    const plano = planejarFrequencia([], [
      { beneficiariaId: 1, presente: true },
      { beneficiariaId: 2, presente: false },
    ]);
    expect(plano.criar).toHaveLength(2);
    expect(plano.atualizar).toEqual([]);
    expect(plano.remover).toEqual([]);
  });

  test("atualiza só o que mudou, lendo 1/0 do SQLite", () => {
    const plano = planejarFrequencia(
      [
        { id: 10, beneficiaria: 1, presente: 1 },
        { id: 11, beneficiaria: 2, presente: 1 },
      ],
      [
        { beneficiariaId: 1, presente: true },
        { beneficiariaId: 2, presente: false },
      ],
    );
    expect(plano.atualizar).toEqual([{ id: 11, presente: false }]);
    expect(plano.criar).toEqual([]);
    expect(plano.remover).toEqual([]);
  });

  test("remove duplicatas (fica a mais antiga) e quem saiu da lista", () => {
    const plano = planejarFrequencia(
      [
        { id: 21, beneficiaria: 1, presente: 0 },
        { id: 20, beneficiaria: 1, presente: 1 },
        { id: 30, beneficiaria: 9, presente: 1 },
      ],
      [
        { beneficiariaId: 1, presente: true },
        { beneficiariaId: 2, presente: true },
      ],
    );
    expect(plano.atualizar).toEqual([]);
    expect(plano.remover.sort()).toEqual([21, 30]);
    expect(plano.criar).toEqual([{ beneficiariaId: 2, presente: true }]);
  });
});
