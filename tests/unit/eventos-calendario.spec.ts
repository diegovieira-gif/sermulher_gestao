import { test, expect } from "@playwright/test";
import {
  agoraDeParede,
  dateDeParede,
  paraCalendarEvent,
  textoDeParede,
} from "../../src/app/(admin)/eventos/calendario";

/**
 * Datas do calendário unificado: o servidor manda texto de parede e o
 * navegador monta o Date. 14:00 tem de aparecer 14:00 e o dia 20 no dia 20,
 * qualquer que seja o fuso da máquina — por isso os testes comparam os
 * componentes LOCAIS do Date, e não o instante.
 */

test.describe("textoDeParede", () => {
  test("dateTime do Directus vira AAAA-MM-DDTHH:mm", () => {
    expect(textoDeParede("2026-08-16T14:00:00")).toBe("2026-08-16T14:00");
  });

  test("date continua só data", () => {
    expect(textoDeParede("2026-03-20")).toBe("2026-03-20");
  });

  test("ausente ou lixo vira vazio", () => {
    expect(textoDeParede(null)).toBe("");
    expect(textoDeParede("abc")).toBe("");
  });
});

test.describe("dateDeParede", () => {
  test("mantém a hora de parede", () => {
    const d = dateDeParede("2026-08-16T14:00");
    expect([d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes()])
      .toEqual([2026, 8, 16, 14, 0]);
  });

  test("só data cai no próprio dia (meio-dia local)", () => {
    const d = dateDeParede("2026-03-20");
    expect([d.getFullYear(), d.getMonth() + 1, d.getDate()]).toEqual([2026, 3, 20]);
  });

  test("paraCalendarEvent usa o início quando não há fim", () => {
    const e = paraCalendarEvent({
      id: 1,
      title: "x",
      start: "2026-08-16T14:00",
      end: "",
      allDay: false,
      type: "manual",
      color: "#000",
    });
    expect(e.end.getTime()).toBe(e.start.getTime());
  });
});

test.describe("agoraDeParede", () => {
  test("converte o instante para a hora de Brasília", () => {
    expect(agoraDeParede(new Date("2026-10-08T17:05:09.000Z"))).toBe("2026-10-08T14:05:09");
  });

  test("perto da meia-noite UTC continua no dia de Brasília", () => {
    expect(agoraDeParede(new Date("2026-10-09T01:30:00.000Z"))).toBe("2026-10-08T22:30:00");
  });
});
