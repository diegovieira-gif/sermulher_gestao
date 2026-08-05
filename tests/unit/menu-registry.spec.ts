import { test, expect } from "@playwright/test";
import {
  ALL_MENU_KEYS,
  ALWAYS_ON_KEYS,
  getAllowedMenuKeys,
  resolveMenuKey,
} from "../../src/lib/menu-registry";

/**
 * Regras de permissão de menu.
 *
 * Este é o cálculo que decide o que cada perfil enxerga e — desde que as
 * server actions passaram a chamar `assertAccess` — o que cada perfil PODE
 * fazer. Um erro aqui não deixa a tela feia: expõe prontuário de mulher em
 * situação de violência a quem não deveria vê-lo.
 */

test.describe("getAllowedMenuKeys", () => {
  test("administrador vê tudo, mesmo com configuração restritiva", () => {
    const permitido = getAllowedMenuKeys(true, {
      permitir_tudo: false,
      menus: ["dashboard"],
    });
    expect(permitido.sort()).toEqual([...ALL_MENU_KEYS].sort());
  });

  test("perfil sem configuração recebe acesso total (default documentado)", () => {
    expect(getAllowedMenuKeys(false, null).sort()).toEqual(
      [...ALL_MENU_KEYS].sort(),
    );
  });

  test('"permitir tudo" ignora a lista de menus', () => {
    const permitido = getAllowedMenuKeys(false, {
      permitir_tudo: true,
      menus: [],
    });
    expect(permitido.sort()).toEqual([...ALL_MENU_KEYS].sort());
  });

  test("perfil restrito recebe só o que foi marcado, mais os itens fixos", () => {
    const permitido = getAllowedMenuKeys(false, {
      permitir_tudo: false,
      menus: ["cram"],
    });

    expect(permitido).toContain("cram");
    for (const fixo of ALWAYS_ON_KEYS) {
      expect(permitido, "itens alwaysOn evitam lockout").toContain(fixo);
    }
    // O que não foi marcado fica de fora — é o ponto do teste.
    expect(permitido).not.toContain("mulheres");
    expect(permitido).not.toContain("auditoria");
  });

  test("lista vazia não libera nada além dos itens fixos", () => {
    const permitido = getAllowedMenuKeys(false, {
      permitir_tudo: false,
      menus: [],
    });
    expect(permitido.sort()).toEqual([...ALWAYS_ON_KEYS].sort());
  });

  test("chaves desconhecidas ou lixo na configuração são descartados", () => {
    const permitido = getAllowedMenuKeys(false, {
      permitir_tudo: false,
      // Simula dado corrompido/legado vindo do Directus.
      menus: ["cram", "modulo-que-nao-existe", 42, null, { x: 1 }] as unknown,
    });

    expect(permitido).toContain("cram");
    expect(permitido).not.toContain("modulo-que-nao-existe");
    for (const chave of permitido) {
      expect(ALL_MENU_KEYS).toContain(chave);
    }
  });

  test("não devolve chaves repetidas", () => {
    const permitido = getAllowedMenuKeys(false, {
      permitir_tudo: false,
      menus: ["dashboard", "dashboard", "cram", "cram"],
    });
    expect(new Set(permitido).size).toBe(permitido.length);
  });
});

test.describe("resolveMenuKey", () => {
  test("casa a rota exata e as subrotas", () => {
    expect(resolveMenuKey("/cram")).toBe("cram");
    expect(resolveMenuKey("/cram/novo")).toBe("cram");
    expect(resolveMenuKey("/mulheres/beneficiarias/12")).toBe("mulheres");
  });

  test("usa o prefixo mais longo quando há sobreposição", () => {
    // "/mulheres" e "/mulheres/beneficiarias" ambos casariam por prefixo;
    // vence o item mais específico registrado.
    const chave = resolveMenuKey("/relatorios/rma");
    expect(chave).toBe("relatorios");
  });

  test("não casa por prefixo parcial de nome (evita falso positivo)", () => {
    // "/cramulher" NÃO pode resolver para "cram".
    expect(resolveMenuKey("/cramulher")).toBeNull();
  });

  test("rota neutra devolve null (não bloqueia)", () => {
    expect(resolveMenuKey("/acesso-negado")).toBeNull();
    expect(resolveMenuKey("/")).toBeNull();
  });
});
