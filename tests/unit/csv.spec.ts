import { test, expect } from "@playwright/test";
import { montarCsv } from "../../src/lib/csv";

/**
 * Montagem do CSV usado nos relatórios RMA e Indicadores.
 *
 * O arquivo é aberto no Excel em português: separador `;` e escape de aspas no
 * padrão RFC 4180. Um erro de escape aqui não gera exceção — gera uma planilha
 * com as colunas deslocadas, que só é percebida depois de entregue.
 */

test.describe("montarCsv", () => {
  test("junta colunas com ponto e vírgula e linhas com CRLF", () => {
    const csv = montarCsv([
      ["Descrição", "Quantidade"],
      ["Novos casos", 12],
    ]);
    expect(csv).toBe("Descrição;Quantidade\r\nNovos casos;12");
  });

  test("protege células que contêm o separador", () => {
    const csv = montarCsv([["Jurídico; Psicossocial", 3]]);
    expect(csv).toBe('"Jurídico; Psicossocial";3');
  });

  test("dobra as aspas dentro de células citadas", () => {
    const csv = montarCsv([['Setor "Especial"; Norte', 1]]);
    expect(csv).toBe('"Setor ""Especial""; Norte";1');
  });

  test("cita células com quebra de linha", () => {
    const csv = montarCsv([["Linha 1\nLinha 2", 5]]);
    expect(csv).toBe('"Linha 1\nLinha 2";5');
  });

  test("nulo e indefinido viram célula vazia, e o zero é preservado", () => {
    // Zero é um dado legítimo do relatório ("nenhum atendimento") e não pode
    // sair como vazio.
    expect(montarCsv([[null, undefined, 0]])).toBe(";;0");
  });

  test("linha vazia produz separador de seção", () => {
    const csv = montarCsv([["Seção 1"], [], ["Seção 2"]]);
    expect(csv).toBe("Seção 1\r\n\r\nSeção 2");
  });

  test("não cita células comuns (arquivo legível)", () => {
    expect(montarCsv([["Aracaju", "Centro"]])).toBe("Aracaju;Centro");
  });

  test("neutraliza texto que o Excel leria como fórmula", () => {
    expect(montarCsv([['=HYPERLINK("x")']])).toBe(`"'=HYPERLINK(""x"")"`);
    expect(montarCsv([["+55 79"], ["-teste"], ["@soma"]])).toBe("'+55 79\r\n'-teste\r\n'@soma");
    expect(montarCsv([["\tabc"]])).toBe("'\tabc");
    // CR no início também força as aspas (é quebra de linha)
    expect(montarCsv([["\rabc"]])).toBe("\"'\rabc\"");
  });

  test("números negativos não recebem apóstrofo", () => {
    expect(montarCsv([[-5, 0, 3.5]])).toBe("-5;0;3.5");
  });

  test("texto comum com hífen no meio não é alterado", () => {
    expect(montarCsv([["Maria-José"]])).toBe("Maria-José");
  });
});
