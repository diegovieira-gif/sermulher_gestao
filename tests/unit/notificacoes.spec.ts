import { test, expect } from "@playwright/test";
import {
  calcularLembrete,
  descreverQuando,
} from "../../src/lib/notificacoes-formato";

/**
 * Regras de agendamento do lembrete de escala.
 *
 * O erro caro aqui é silencioso: um lembrete agendado para o passado sai na
 * primeira varredura do cron, e a servidora recebe "amanhã tem evento" de um
 * evento que já aconteceu.
 */

test.describe("calcularLembrete", () => {
  const emDias = (dias: number, hora = 14) => {
    const d = new Date();
    d.setDate(d.getDate() + dias);
    d.setHours(hora, 0, 0, 0);
    return d;
  };

  test("agenda para as 8h da véspera", () => {
    const evento = emDias(10);
    const lembrete = calcularLembrete(evento);

    expect(lembrete).not.toBeNull();
    expect(lembrete!.getHours()).toBe(8);
    expect(lembrete!.getMinutes()).toBe(0);

    // Exatamente um dia antes.
    const esperado = new Date(evento);
    esperado.setDate(esperado.getDate() - 1);
    expect(lembrete!.getDate()).toBe(esperado.getDate());
    expect(lembrete!.getMonth()).toBe(esperado.getMonth());
  });

  test("não agenda para evento cuja véspera já passou", () => {
    // Escalar alguém para hoje não pode gerar lembrete retroativo.
    expect(calcularLembrete(emDias(0))).toBeNull();
  });

  test("não agenda para evento no passado", () => {
    expect(calcularLembrete(emDias(-5))).toBeNull();
  });

  test("evento amanhã depois das 8h já não gera lembrete", () => {
    // A véspera de amanhã é hoje às 8h — se já passou das 8h, o disparo seria
    // imediato e o texto ("amanhã") ainda estaria correto, mas o agendamento
    // no passado é rejeitado por consistência.
    const amanha = emDias(1);
    const lembrete = calcularLembrete(amanha);
    const hojeOito = new Date();
    hojeOito.setHours(8, 0, 0, 0);

    if (Date.now() > hojeOito.getTime()) {
      expect(lembrete).toBeNull();
    } else {
      expect(lembrete).not.toBeNull();
    }
  });

  test("data inválida devolve null em vez de lançar", () => {
    expect(calcularLembrete("data-que-nao-existe")).toBeNull();
    expect(calcularLembrete("")).toBeNull();
  });

  test("aceita string ISO e objeto Date igualmente", () => {
    const d = emDias(7);
    const porObjeto = calcularLembrete(d);
    const porTexto = calcularLembrete(d.toISOString());
    expect(porTexto?.getTime()).toBe(porObjeto?.getTime());
  });
});

test.describe("descreverQuando", () => {
  test("inclui o horário quando há hora definida", () => {
    const texto = descreverQuando("2026-08-20T14:30:00");
    expect(texto).toContain("20/08/2026");
    expect(texto).toContain("14:30");
    expect(texto).toContain("às");
  });

  test("omite o horário à meia-noite (hora não informada)", () => {
    // Eventos antigos foram gravados sem hora; exibir "às 00:00" passaria a
    // impressão de um evento de madrugada.
    const texto = descreverQuando("2026-08-20T00:00:00");
    expect(texto).toBe("20/08/2026");
    expect(texto).not.toContain("às");
  });

  test("valor ausente vira texto neutro, nunca 'Invalid Date'", () => {
    expect(descreverQuando(null)).toBe("data a confirmar");
    expect(descreverQuando(undefined)).toBe("data a confirmar");
    expect(descreverQuando("")).toBe("data a confirmar");
  });

  test("string irreconhecível cai para a parte da data", () => {
    expect(descreverQuando("texto-qualquer")).not.toContain("Invalid");
  });
});
