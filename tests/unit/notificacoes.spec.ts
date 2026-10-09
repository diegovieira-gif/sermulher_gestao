import { test, expect } from "@playwright/test";
import {
  calcularLembrete,
  canalResolvido,
  decidirEmail,
  decidirWhatsapp,
  descreverQuando,
  estadoFalha,
  estadoPulado,
  ESPERA_RETENTATIVA_MS,
  MAX_TENTATIVAS,
  mudouDataHora,
  mudouTexto,
  notificacaoCancelavel,
  notificacaoPrecisaEnvio,
  notificacaoResolvida,
} from "../../src/lib/notificacoes-formato";

/**
 * Regras de agendamento do lembrete de escala.
 *
 * O erro caro aqui é silencioso: um lembrete agendado para o passado sai na
 * primeira varredura do cron, e a servidora recebe "amanhã tem evento" de um
 * evento que já aconteceu. Os testes fixam "agora" e usam instantes absolutos,
 * para valerem em qualquer fuso da máquina que os roda.
 */

// 08/10/2026 10:00 em Brasília.
const AGORA = new Date("2026-10-08T10:00:00-03:00");

test.describe("calcularLembrete", () => {
  test("agenda para as 8h da véspera EM BRASÍLIA (11:00 UTC)", () => {
    // dateTime do Directus: hora de parede, sem fuso.
    const lembrete = calcularLembrete("2026-10-20T14:00:00", AGORA);
    expect(lembrete?.toISOString()).toBe("2026-10-19T11:00:00.000Z");
  });

  test("evento logo após a meia-noite usa a véspera do calendário de Brasília", () => {
    // 00:30 do dia 21 → lembrete 08h do dia 20 (e não do dia 19, como daria
    // se o valor fosse lido em UTC).
    const lembrete = calcularLembrete("2026-10-21T00:30:00", AGORA);
    expect(lembrete?.toISOString()).toBe("2026-10-20T11:00:00.000Z");
  });

  test("evento no dia 1º volta para o último dia do mês anterior", () => {
    const lembrete = calcularLembrete("2026-11-01T09:00", AGORA);
    expect(lembrete?.toISOString()).toBe("2026-10-31T11:00:00.000Z");
  });

  test("instante com fuso é convertido para o dia de Brasília", () => {
    // 02:00 UTC do dia 21 = 23:00 do dia 20 em Brasília → véspera é o dia 19.
    const lembrete = calcularLembrete("2026-10-21T02:00:00.000Z", AGORA);
    expect(lembrete?.toISOString()).toBe("2026-10-19T11:00:00.000Z");
  });

  test("Date e string do mesmo instante dão o mesmo resultado", () => {
    const d = new Date("2026-10-20T17:00:00.000Z");
    expect(calcularLembrete(d, AGORA)?.getTime()).toBe(
      calcularLembrete(d.toISOString(), AGORA)?.getTime(),
    );
  });

  test("não agenda para evento cuja véspera já passou", () => {
    // Evento hoje: a véspera foi ontem.
    expect(calcularLembrete("2026-10-08T18:00:00", AGORA)).toBeNull();
    // Evento amanhã: a véspera é hoje às 8h, e já são 10h.
    expect(calcularLembrete("2026-10-09T14:00:00", AGORA)).toBeNull();
  });

  test("evento amanhã, consultado antes das 8h, ainda gera lembrete", () => {
    const cedo = new Date("2026-10-08T07:00:00-03:00");
    expect(calcularLembrete("2026-10-09T14:00:00", cedo)?.toISOString()).toBe(
      "2026-10-08T11:00:00.000Z",
    );
  });

  test("não agenda para evento no passado", () => {
    expect(calcularLembrete("2026-10-01T14:00:00", AGORA)).toBeNull();
  });

  test("data inválida devolve null em vez de lançar", () => {
    expect(calcularLembrete("data-que-nao-existe", AGORA)).toBeNull();
    expect(calcularLembrete("", AGORA)).toBeNull();
    expect(calcularLembrete("2026-02-31T10:00", AGORA)).toBeNull();
  });
});

test.describe("descreverQuando", () => {
  test("inclui o horário quando há hora definida", () => {
    expect(descreverQuando("2026-08-20T14:30:00")).toBe("20/08/2026 às 14:30");
  });

  test("omite o horário à meia-noite (hora não informada)", () => {
    // Eventos antigos foram gravados sem hora; exibir "às 00:00" passaria a
    // impressão de um evento de madrugada.
    expect(descreverQuando("2026-08-20T00:00:00")).toBe("20/08/2026");
  });

  test("instante em UTC é mostrado na hora de Brasília", () => {
    expect(descreverQuando("2026-08-20T17:30:00.000Z")).toBe("20/08/2026 às 14:30");
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

test.describe("detecção de alteração do evento", () => {
  test("segundos do Directus vs. minutos do form não contam como mudança", () => {
    expect(mudouDataHora("2026-08-16T14:00:00", "2026-08-16T14:00")).toBe(false);
    expect(mudouDataHora("2026-08-16 14:00:00", "2026-08-16T14:00")).toBe(false);
  });

  test("mudança real de hora ou dia é detectada", () => {
    expect(mudouDataHora("2026-08-16T14:00:00", "2026-08-16T15:00")).toBe(true);
    expect(mudouDataHora("2026-08-16T14:00:00", "2026-08-17T14:00")).toBe(true);
    expect(mudouDataHora(null, "2026-08-17T14:00")).toBe(true);
  });

  test("local: nulo, vazio e espaços nas pontas são equivalentes", () => {
    expect(mudouTexto(null, "")).toBe(false);
    expect(mudouTexto("Auditório ", "Auditório")).toBe(false);
    expect(mudouTexto("Auditório", "Praça")).toBe(true);
  });
});

test.describe("estado dos canais", () => {
  test("só entregue, pulado ou desistido resolve o canal", () => {
    expect(canalResolvido(undefined)).toBe(false);
    expect(canalResolvido({ enviado_em: "2026-10-08T10:00:00Z" })).toBe(true);
    expect(canalResolvido({ pulado: "sem e-mail" })).toBe(true);
    // O bug antigo: qualquer objeto contava como resolvido.
    expect(canalResolvido({ erro: "timeout", tentado_em: "x" })).toBe(false);
  });

  test("falha acumula tentativas e desiste na última", () => {
    let e = estadoFalha(undefined, "timeout", AGORA);
    expect(e.tentativas).toBe(1);
    expect(canalResolvido(e)).toBe(false);
    for (let i = 1; i < MAX_TENTATIVAS; i++) e = estadoFalha(e, "timeout", AGORA);
    expect(e.tentativas).toBe(MAX_TENTATIVAS);
    expect(e.desistido_em).toBeTruthy();
    expect(canalResolvido(e)).toBe(true);
  });

  test("registro antigo sem contador conta como uma tentativa", () => {
    expect(estadoFalha({ erro: "x", tentado_em: "y" }, "z", AGORA).tentativas).toBe(2);
  });

  test("retentativa respeita o intervalo mínimo", () => {
    const falha = estadoFalha(undefined, "timeout", AGORA);
    const canais = { email: falha, whatsapp: estadoPulado("sem consentimento", AGORA) };
    expect(notificacaoPrecisaEnvio(canais, AGORA)).toBe(false);
    const depois = new Date(AGORA.getTime() + ESPERA_RETENTATIVA_MS);
    expect(notificacaoPrecisaEnvio(canais, depois)).toBe(true);
  });

  test("aviso recém-criado (só o canal app) precisa de envio", () => {
    const canais = { app: { enviado_em: "2026-10-08T10:00:00Z" } };
    expect(notificacaoPrecisaEnvio(canais, AGORA)).toBe(true);
    expect(notificacaoResolvida(canais)).toBe(false);
  });

  test("canais em string JSON também são lidos", () => {
    const canais = JSON.stringify({
      email: { pulado: "sem e-mail" },
      whatsapp: { enviado_em: "x" },
    });
    expect(notificacaoResolvida(canais)).toBe(true);
  });

  test("cancelável enquanto nenhum canal externo entregou", () => {
    expect(notificacaoCancelavel(null)).toBe(true);
    expect(
      notificacaoCancelavel({ email: { erro: "x", tentativas: 1 }, whatsapp: { pulado: "y" } }),
    ).toBe(true);
    expect(notificacaoCancelavel({ whatsapp: { enviado_em: "x" } })).toBe(false);
  });
});

test.describe("decisão por canal", () => {
  test("e-mail: sem endereço ou sem SMTP é pulado (não trava a fila)", () => {
    expect(decidirEmail(undefined, { email: "", smtp: true }, AGORA)).toEqual({
      acao: "pular",
      motivo: "sem e-mail",
    });
    expect(decidirEmail(undefined, { email: "a@b.c", smtp: false }, AGORA)).toEqual({
      acao: "pular",
      motivo: "smtp ausente",
    });
    expect(decidirEmail(undefined, { email: "a@b.c", smtp: true }, AGORA)).toEqual({
      acao: "enviar",
    });
  });

  test("e-mail já entregue não é reenviado", () => {
    expect(
      decidirEmail({ enviado_em: "x" }, { email: "a@b.c", smtp: true }, AGORA).acao,
    ).toBe("aguardar");
  });

  test("WhatsApp: consentimento, telefone e GoWA", () => {
    const base = { consentimento: true, telefone: "(79) 99999-8888", gowa: true };
    expect(decidirWhatsapp(undefined, base, AGORA)).toEqual({ acao: "enviar" });
    expect(decidirWhatsapp(undefined, { ...base, consentimento: false }, AGORA)).toEqual({
      acao: "pular",
      motivo: "sem consentimento",
    });
    expect(decidirWhatsapp(undefined, { ...base, telefone: null }, AGORA)).toEqual({
      acao: "pular",
      motivo: "sem telefone",
    });
    expect(decidirWhatsapp(undefined, { ...base, telefone: "123" }, AGORA)).toEqual({
      acao: "pular",
      motivo: "número inválido",
    });
    expect(decidirWhatsapp(undefined, { ...base, gowa: false }, AGORA)).toEqual({
      acao: "pular",
      motivo: "gowa ausente",
    });
  });
});
