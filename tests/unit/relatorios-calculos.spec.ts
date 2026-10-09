import { test, expect } from "@playwright/test";
import {
  faixaEtaria,
  filtroMesDateTime,
  idadeEm,
  limitesDoMesDateTime,
} from "../../src/app/(admin)/relatorios/calculos";

/**
 * Cálculos dos Indicadores, do RMA e do Dashboard.
 *
 * O erro que motivou o módulo: `_between [dia 1, último dia]` num campo
 * dateTime corta em "último dia 00:00" — tudo o que entrou no último dia do
 * mês sumia dos relatórios, sem nenhum aviso.
 */

test.describe("limitesDoMesDateTime", () => {
  test("vai do dia 1 00:00 ao dia 1 do mês seguinte (exclusivo)", () => {
    expect(limitesDoMesDateTime(2026, 10)).toEqual({
      inicio: "2026-10-01T00:00:00",
      fimExclusivo: "2026-11-01T00:00:00",
    });
  });

  test("dezembro vira janeiro do ano seguinte", () => {
    expect(limitesDoMesDateTime(2026, 12).fimExclusivo).toBe("2027-01-01T00:00:00");
  });

  test("o último dia do mês fica dentro do filtro", () => {
    const { _gte, _lt } = filtroMesDateTime(2026, 2);
    const ultimoDia = "2026-02-28T18:30:00";
    expect(ultimoDia >= _gte && ultimoDia < _lt).toBe(true);
    expect("2026-03-01T00:00:00" < _lt).toBe(false);
  });
});

test.describe("idadeEm", () => {
  test("no dia do aniversário já conta o ano novo", () => {
    expect(idadeEm("1990-10-08", "2026-10-08")).toBe(36);
  });

  test("na véspera do aniversário ainda não", () => {
    expect(idadeEm("1990-10-08", "2026-10-07")).toBe(35);
  });

  test("aceita referência com hora (dateTime)", () => {
    expect(idadeEm("2010-01-31", "2026-01-31T09:00:00")).toBe(16);
  });

  test("data ausente ou ilegível vira null", () => {
    expect(idadeEm(null, "2026-10-08")).toBeNull();
    expect(idadeEm("", "2026-10-08")).toBeNull();
    expect(idadeEm("08/10/1990", "2026-10-08")).toBeNull();
  });

  test("nascimento depois da referência não gera idade negativa", () => {
    expect(idadeEm("2030-01-01", "2026-10-08")).toBeNull();
  });
});

test.describe("faixaEtaria", () => {
  test("menores de 18 têm faixa própria", () => {
    expect(faixaEtaria(17)).toBe("Menor de 18 (<18)");
    expect(faixaEtaria(18)).toBe("Jovem (18-29)");
  });

  test("limites das faixas adultas", () => {
    expect(faixaEtaria(29)).toBe("Jovem (18-29)");
    expect(faixaEtaria(30)).toBe("Adulta (30-59)");
    expect(faixaEtaria(59)).toBe("Adulta (30-59)");
    expect(faixaEtaria(60)).toBe("Idosa (60+)");
  });

  test("sem data de nascimento conta como não informada", () => {
    expect(faixaEtaria(null)).toBe("Não informada");
  });
});
