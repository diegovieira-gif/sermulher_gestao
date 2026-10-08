import { test, expect } from "@playwright/test";
import { configSiged, SIGED_URL_PADRAO } from "../../src/lib/siged";

/**
 * Configuração da consulta de CPF no SIGED.
 *
 * O que importa garantir: segredo nunca tem valor padrão. Se um dia alguém
 * "facilitar" voltando a pôr o token no código, o primeiro teste quebra.
 */

test.describe("configSiged", () => {
  test("sem token, a consulta fica desligada — não há token padrão", () => {
    expect(configSiged({})).toBeNull();
    expect(configSiged({ SIGED_API_URL: "https://exemplo.test/x" })).toBeNull();
  });

  test("token só com espaços conta como ausente", () => {
    expect(configSiged({ SIGED_API_TOKEN: "   " })).toBeNull();
  });

  test("com token e sem URL, usa o endpoint de sempre (homologação)", () => {
    expect(configSiged({ SIGED_API_TOKEN: "abc" })).toEqual({
      url: SIGED_URL_PADRAO,
      token: "abc",
    });
    expect(SIGED_URL_PADRAO).toContain("homolog.siged");
  });

  test("a URL do ambiente substitui a padrão, sem espaços sobrando", () => {
    expect(
      configSiged({ SIGED_API_TOKEN: " abc ", SIGED_API_URL: " https://prod.test/findByCPF " }),
    ).toEqual({ url: "https://prod.test/findByCPF", token: "abc" });
  });
});
