import { test, expect } from "@playwright/test";
import {
  DISPARO_ABANDONADO_MS,
  dataMenosAnos,
  mesEDia,
  mesmoSegundo,
  motivoBloqueioDisparo,
} from "../../src/app/(admin)/marketing/whatsapp/regras-disparo";

/**
 * Regras do disparo de campanhas de WhatsApp. Errar aqui é mensagem duplicada
 * para centenas de beneficiárias, ou a campanha de aniversário indo para as
 * aniversariantes de amanhã.
 */

const AGORA = new Date("2026-10-08T12:00:00.000Z");

test.describe("motivoBloqueioDisparo", () => {
  test("rascunho e agendada podem disparar", () => {
    expect(motivoBloqueioDisparo({ status: "draft" }, AGORA)).toBeNull();
    expect(motivoBloqueioDisparo({ status: "scheduled" }, AGORA)).toBeNull();
  });

  test("manual em andamento ou concluída é recusada", () => {
    expect(motivoBloqueioDisparo({ status: "running", tipo: "manual" }, AGORA)).not.toBeNull();
    expect(motivoBloqueioDisparo({ status: "completed", tipo: "manual" }, AGORA)).not.toBeNull();
    // Manual parada em "running" há dias continua bloqueada: reenviar é
    // decisão humana.
    expect(
      motivoBloqueioDisparo(
        { status: "running", tipo: "manual", data_envio: "2026-10-01T12:00:00.000Z" },
        AGORA,
      ),
    ).not.toBeNull();
  });

  test("automática concluída roda de novo no dia seguinte", () => {
    expect(motivoBloqueioDisparo({ status: "completed", tipo: "automatica" }, AGORA)).toBeNull();
  });

  test("automática em andamento recente é recusada; abandonada é liberada", () => {
    const recente = new Date(AGORA.getTime() - 60_000).toISOString();
    const antiga = new Date(AGORA.getTime() - DISPARO_ABANDONADO_MS).toISOString();
    expect(
      motivoBloqueioDisparo({ status: "running", tipo: "automatica", data_envio: recente }, AGORA),
    ).not.toBeNull();
    expect(
      motivoBloqueioDisparo({ status: "running", tipo: "automatica", data_envio: antiga }, AGORA),
    ).toBeNull();
  });
});

test.describe("mesmoSegundo", () => {
  test("ignora milissegundos e formato", () => {
    expect(mesmoSegundo("2026-10-08T12:00:00.000Z", "2026-10-08T12:00:00Z")).toBe(true);
    expect(mesmoSegundo("2026-10-08T12:00:00.000Z", "2026-10-08T12:00:01.000Z")).toBe(false);
    expect(mesmoSegundo(null, "2026-10-08T12:00:00Z")).toBe(false);
  });
});

test.describe("datas do público", () => {
  test("dataMenosAnos subtrai do dia informado", () => {
    expect(dataMenosAnos("2026-10-08", 18)).toBe("2008-10-08");
  });

  test("29/02 em ano não bissexto vira 28/02", () => {
    expect(dataMenosAnos("2028-02-29", 1)).toBe("2027-02-28");
    expect(dataMenosAnos("2028-02-29", 4)).toBe("2024-02-29");
  });

  test("mesEDia lê o dia de Brasília já calculado", () => {
    expect(mesEDia("2026-10-08")).toEqual({ mes: 10, dia: 8 });
  });
});
