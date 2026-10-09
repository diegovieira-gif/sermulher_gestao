import { test, expect } from "@playwright/test";
import {
  booleano,
  dataEmBrasilia,
  formatarData,
  formatarDataHora,
  limitesDoMes,
  mesAtualEmBrasilia,
  ultimoDiaDoMes,
} from "../../src/lib/datas";

/**
 * Datas no horário de Brasília. O servidor roda em UTC e o navegador em
 * UTC-3: sem estas regras, datas aparecem um dia antes e "hoje" vira amanhã
 * depois das 21h.
 */

test("23h em Brasília ainda é o mesmo dia (em UTC já é o seguinte)", () => {
  const instante = new Date("2026-10-09T02:30:00Z"); // 23h30 do dia 08 em Brasília
  expect(dataEmBrasilia(instante)).toBe("2026-10-08");
  expect(mesAtualEmBrasilia(new Date("2026-11-01T01:00:00Z"))).toEqual({ ano: 2026, mes: 10 });
});

test("data pura não volta um dia; timestamp vira a data de Brasília", () => {
  expect(formatarData("2026-10-08")).toBe("08/10/2026");
  expect(formatarData("2026-10-08T14:00:00")).toBe("08/10/2026");
  expect(formatarData("2026-10-09T01:00:00.000Z")).toBe("08/10/2026");
  expect(formatarData(null)).toBe("-");
  expect(formatarDataHora("2026-08-16T14:00:00")).toBe("16/08/2026 14:00");
  expect(formatarDataHora("2026-08-16T17:00:00.000Z")).toBe("16/08/2026 14:00");
});

test("limites do mês incluem o último dia inteiro", () => {
  const l = limitesDoMes(2026, 10);
  expect(l.inicio).toBe("2026-10-01");
  expect(l.fim).toBe("2026-10-31");
  expect(l.inicioInstante).toBe("2026-10-01T03:00:00.000Z");
  expect(l.fimInstante).toBe("2026-11-01T03:00:00.000Z");
  expect(limitesDoMes(2026, 12).fimInstante).toBe("2027-01-01T03:00:00.000Z");
  expect(ultimoDiaDoMes(2028, 2)).toBe(29);
});

test("booleano aceita o 1/0 do SQLite", () => {
  for (const v of [true, 1, "1", "true"]) expect(booleano(v)).toBe(true);
  for (const v of [false, 0, "0", null, undefined, ""]) expect(booleano(v)).toBe(false);
});
