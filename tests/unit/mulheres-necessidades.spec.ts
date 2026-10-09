import { test, expect } from "@playwright/test";
import {
  lerNecessidades,
  necessidadesParaTexto,
} from "../../src/app/(admin)/mulheres/atendimentos/necessidades";

/**
 * Necessidades sociais/jurídicas: texto livre (formato atual) e objeto/array
 * (legado) precisam aparecer legíveis no prontuário, no relatório e no
 * formulário de edição.
 */

test.describe("lerNecessidades", () => {
  test("texto livre é mantido como texto (antes: 'Dados inválidos')", () => {
    expect(lerNecessidades("Cesta básica\nCRAS")).toEqual({
      tipo: "texto",
      texto: "Cesta básica\nCRAS",
    });
  });

  test("objeto legado vira lista, ignorando itens desmarcados", () => {
    expect(
      lerNecessidades({ cesta_basica: true, cras: "sim", moradia: false, obs: "" }),
    ).toEqual({ tipo: "lista", itens: ["Cesta Basica", "Cras: sim"] });
  });

  test("objeto serializado como string também é lido", () => {
    expect(lerNecessidades('{"divorcio": true}')).toEqual({
      tipo: "lista",
      itens: ["Divorcio"],
    });
  });

  test("array legado vira lista", () => {
    expect(lerNecessidades(["Guarda", "Pensão"])).toEqual({
      tipo: "lista",
      itens: ["Guarda", "Pensão"],
    });
  });

  test("vazio, nulo e objeto sem itens não mostram nada", () => {
    expect(lerNecessidades(null)).toBeNull();
    expect(lerNecessidades("   ")).toBeNull();
    expect(lerNecessidades({})).toBeNull();
    expect(lerNecessidades({ a: false })).toBeNull();
  });

  test("texto que começa com chave mas não é JSON segue como texto", () => {
    expect(lerNecessidades("{rascunho")).toEqual({ tipo: "texto", texto: "{rascunho" });
  });
});

test.describe("necessidadesParaTexto", () => {
  test("legado vira uma linha por item, nunca [object Object]", () => {
    expect(necessidadesParaTexto({ cesta_basica: true, cras: "sim" })).toBe(
      "Cesta Basica\nCras: sim",
    );
  });

  test("texto passa intacto e vazio vira string vazia", () => {
    expect(necessidadesParaTexto("Divórcio")).toBe("Divórcio");
    expect(necessidadesParaTexto(undefined)).toBe("");
  });
});
