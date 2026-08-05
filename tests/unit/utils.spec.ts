import { test, expect } from "@playwright/test";
import {
  formatDateDisplay,
  mascararCpf,
  mascararTelefone,
  nomeDeQuemRegistrou,
  somenteDigitos,
  todayLocalISO,
} from "../../src/lib/utils";

/**
 * Formatação de dados de cadastro.
 *
 * As máscaras são só de exibição: o banco guarda dígitos. Se a máscara vazar
 * para o valor gravado, a coluna passa a ter dois formatos e a busca por
 * `_contains` deixa de encontrar a beneficiária.
 */

test.describe("somenteDigitos", () => {
  test("remove máscara, espaços e letras", () => {
    expect(somenteDigitos("123.456.789-01")).toBe("12345678901");
    expect(somenteDigitos("(79) 99999-8888")).toBe("79999998888");
  });

  test("tolera nulo, indefinido e vazio", () => {
    expect(somenteDigitos(null)).toBe("");
    expect(somenteDigitos(undefined)).toBe("");
    expect(somenteDigitos("")).toBe("");
  });
});

test.describe("mascararCpf", () => {
  test("formata o CPF completo", () => {
    expect(mascararCpf("12345678901")).toBe("123.456.789-01");
  });

  test("aplica progressivamente enquanto a pessoa digita", () => {
    expect(mascararCpf("123")).toBe("123");
    expect(mascararCpf("1234")).toBe("123.4");
    expect(mascararCpf("1234567")).toBe("123.456.7");
    expect(mascararCpf("1234567890")).toBe("123.456.789-0");
  });

  test("descarta dígitos além do 11º", () => {
    expect(mascararCpf("123456789019999")).toBe("123.456.789-01");
  });

  test("reformata valor que já vem mascarado (idempotente)", () => {
    expect(mascararCpf("123.456.789-01")).toBe("123.456.789-01");
  });

  test("valor vazio não vira máscara solta", () => {
    expect(mascararCpf("")).toBe("");
    expect(mascararCpf(null)).toBe("");
  });
});

test.describe("mascararTelefone", () => {
  test("formata celular de 9 dígitos", () => {
    expect(mascararTelefone("79999998888")).toBe("(79) 99999-8888");
  });

  test("formata fixo de 8 dígitos", () => {
    expect(mascararTelefone("7933334444")).toBe("(79) 3333-4444");
  });

  test("descarta o DDI 55 dos números importados", () => {
    expect(mascararTelefone("5579999998888")).toBe("(79) 99999-8888");
    expect(mascararTelefone("557933334444")).toBe("(79) 3333-4444");
  });

  test("não confunde DDD 55 (MS) com DDI", () => {
    // 11 dígitos começando em 55 é um celular do Mato Grosso do Sul,
    // não um número com código de país.
    expect(mascararTelefone("55999998888")).toBe("(55) 99999-8888");
  });

  test("aplica progressivamente enquanto a pessoa digita", () => {
    expect(mascararTelefone("7")).toBe("7");
    expect(mascararTelefone("79")).toBe("79");
    expect(mascararTelefone("799")).toBe("(79) 9");
  });

  test("valor vazio permanece vazio", () => {
    expect(mascararTelefone("")).toBe("");
    expect(mascararTelefone(null)).toBe("");
  });
});

test.describe("todayLocalISO", () => {
  test("usa a data local, não a UTC", () => {
    // Regressão: às 21h de Aracaju (UTC-3) já é o dia seguinte em UTC, e o
    // campo "hoje" aparecia preenchido com a data de amanhã.
    const noiteDeAracaju = new Date(2026, 7, 5, 21, 30, 0); // 5/ago local
    expect(todayLocalISO(noiteDeAracaju)).toBe("2026-08-05");
  });

  test("zera à esquerda mês e dia", () => {
    expect(todayLocalISO(new Date(2026, 0, 9))).toBe("2026-01-09");
  });

  test("sem argumento devolve o formato AAAA-MM-DD", () => {
    expect(todayLocalISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

test.describe("formatDateDisplay", () => {
  test("converte ISO para dd/mm/aaaa sem deslocar o dia", () => {
    expect(formatDateDisplay("2026-08-05")).toBe("05/08/2026");
    expect(formatDateDisplay("2026-08-05T23:30:00.000Z")).toBe("05/08/2026");
  });

  test("ausência de data vira traço", () => {
    expect(formatDateDisplay(null)).toBe("-");
    expect(formatDateDisplay("")).toBe("-");
  });
});

test.describe("nomeDeQuemRegistrou", () => {
  test("monta o nome a partir do usuário expandido", () => {
    expect(
      nomeDeQuemRegistrou({ first_name: "Dayane", last_name: "Melo" }),
    ).toBe("Dayane Melo");
  });

  test("cai para o e-mail quando não há nome", () => {
    expect(nomeDeQuemRegistrou({ email: "tecnica@exemplo.gov.br" })).toBe(
      "tecnica@exemplo.gov.br",
    );
  });

  test("distingue registro sem autor de autor não expandido", () => {
    // Regressão: UUID cru NÃO significa importação — significa que a relação
    // com directus_users não veio expandida na consulta.
    expect(nomeDeQuemRegistrou(null)).toBe("Sistema / Importação");
    expect(nomeDeQuemRegistrou("8a7b6c5d-0000-0000-0000-000000000000")).toBe(
      "Usuário não identificado",
    );
  });
});
