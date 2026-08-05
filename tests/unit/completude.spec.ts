import { test, expect } from "@playwright/test";
import {
  CAMPOS_COMPLETUDE,
  TOTAL_PONTOS,
  calcularCompletude,
  estaPreenchido,
} from "../../src/app/(admin)/mulheres/beneficiarias/completude";

/**
 * Índice de completude da ficha.
 *
 * O número aparece para a técnica logo depois de salvar, então precisa ser
 * justo: contar como vazio um campo que ela preencheu corretamente
 * desestimula justamente quem faz o trabalho direito.
 */

test.describe("estaPreenchido", () => {
  test("zero conta como preenchido", () => {
    // "Nenhum filho" é resposta legítima — tratá-la como vazio puniria quem
    // perguntou e registrou.
    expect(estaPreenchido(0)).toBe(true);
  });

  test("string vazia ou só espaços não conta", () => {
    expect(estaPreenchido("")).toBe(false);
    expect(estaPreenchido("   ")).toBe(false);
  });

  test("nulo e indefinido não contam", () => {
    expect(estaPreenchido(null)).toBe(false);
    expect(estaPreenchido(undefined)).toBe(false);
  });

  test("lista vazia não conta; lista com item conta", () => {
    expect(estaPreenchido([])).toBe(false);
    expect(estaPreenchido(["algo"])).toBe(true);
  });

  test("NaN não conta como número preenchido", () => {
    expect(estaPreenchido(Number.NaN)).toBe(false);
  });
});

test.describe("calcularCompletude", () => {
  test("ficha vazia → 0% e todos os campos pendentes", () => {
    const resumo = calcularCompletude({ nome_completo: "Maria" });

    expect(resumo.percentual).toBe(0);
    expect(resumo.pontos).toBe(0);
    expect(resumo.pendentes).toHaveLength(CAMPOS_COMPLETUDE.length);
  });

  test("ficha completa → 100% e nada pendente", () => {
    const completa: Record<string, unknown> = { nome_completo: "Maria" };
    for (const campo of CAMPOS_COMPLETUDE) {
      // Monta o objeto respeitando os caminhos aninhados (endereco.bairro).
      const partes = campo.caminho.split(".");
      let alvo = completa;
      for (let i = 0; i < partes.length - 1; i++) {
        alvo[partes[i]] = alvo[partes[i]] ?? {};
        alvo = alvo[partes[i]] as Record<string, unknown>;
      }
      alvo[partes[partes.length - 1]] = "preenchido";
    }

    const resumo = calcularCompletude(completa);
    expect(resumo.percentual).toBe(100);
    expect(resumo.pontos).toBe(TOTAL_PONTOS);
    expect(resumo.pendentes).toEqual([]);
  });

  test("pendentes vêm ordenados pelo que mais rende", () => {
    const resumo = calcularCompletude({ nome_completo: "Maria" });
    const pontos = resumo.pendentes.map((p) => p.pontos);
    const ordenado = [...pontos].sort((a, b) => b - a);
    expect(pontos).toEqual(ordenado);
  });

  test("lê colunas JSON que o Directus devolve serializadas", () => {
    // `endereco` e `contato` às vezes voltam como string do Directus; o campo
    // preenchido não pode ser contado como vazio por causa disso.
    const comStringJson = calcularCompletude({
      nome_completo: "Maria",
      endereco: JSON.stringify({ bairro: "Centro" }),
    });
    const comObjeto = calcularCompletude({
      nome_completo: "Maria",
      endereco: { bairro: "Centro" },
    });

    expect(comStringJson.pontos).toBe(comObjeto.pontos);
    expect(comStringJson.pontos).toBeGreaterThan(0);
  });

  test("JSON corrompido não derruba o cálculo", () => {
    const resumo = calcularCompletude({
      nome_completo: "Maria",
      endereco: "{ isso não é json",
    });
    expect(resumo.percentual).toBe(0);
  });

  test("telefone sem validação é sinalizado à parte do percentual", () => {
    const resumo = calcularCompletude({
      nome_completo: "Maria",
      telefone: "79999998888",
      telefone_validado: false,
    });

    expect(resumo.telefonePendenteValidacao).toBe(true);
    expect(resumo.telefoneValidado).toBe(false);
    // O telefone continua contando como preenchido — validar é outra coisa.
    expect(resumo.pontos).toBeGreaterThan(0);
  });

  test("sem telefone, não há validação pendente a cobrar", () => {
    const resumo = calcularCompletude({ nome_completo: "Maria" });
    expect(resumo.telefonePendenteValidacao).toBe(false);
  });

  test("o percentual nunca sai do intervalo 0–100", () => {
    const resumo = calcularCompletude({
      nome_completo: "Maria",
      telefone: "79999998888",
      cpf: "12345678901",
      quantidade_filhos: 0,
    });
    expect(resumo.percentual).toBeGreaterThanOrEqual(0);
    expect(resumo.percentual).toBeLessThanOrEqual(100);
  });

  test("registro nulo não quebra (defesa contra dado ausente)", () => {
    expect(() => calcularCompletude(null)).not.toThrow();
    expect(calcularCompletude(null).percentual).toBe(0);
  });
});
