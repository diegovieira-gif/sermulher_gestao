import { test, expect } from "@playwright/test";
import {
  CHAVE_TEMA,
  CLASSE_ESCURO,
  SCRIPT_ANTI_FLASH,
  TEMA_PADRAO,
  ehTema,
  resolverTema,
} from "../../src/lib/tema";

/**
 * O tema, testado onde ele DECIDE — e onde os dois decisores podem divergir.
 *
 * O valor está no último bloco. O alternador e o script anti-flash decidem a
 * mesma coisa em dois lugares; no dia em que um mudar sem o outro, a página
 * passa a piscar antes de assentar — sintoma que só aparece no navegador de
 * alguém. Porte de `tests/tema/tema.test.ts` da Trilha, acrescido do padrão
 * provisório (`TEMA_PADRAO`) que só existe aqui.
 */

/** Roda o texto do script num DOM de mentira e devolve se ligou `.dark`. */
function rodarScript(guardado: string | null, sistemaEscuro: boolean): boolean | null {
  let classeLigada: boolean | null = null;
  const janela = {
    localStorage: { getItem: (k: string) => (k === CHAVE_TEMA ? guardado : null) },
    matchMedia: () => ({ matches: sistemaEscuro }),
    document: {
      documentElement: {
        classList: {
          toggle: (nome: string, ligar: boolean) => {
            expect(nome).toBe(CLASSE_ESCURO);
            classeLigada = ligar;
          },
        },
      },
    },
  };
  // O script usa `localStorage`, `window` e `document` nus — entregamos os três.
  new Function("window", "localStorage", "document", SCRIPT_ANTI_FLASH)(
    janela,
    janela.localStorage,
    janela.document,
  );
  return classeLigada;
}

test.describe("tema", () => {
  test("resolverTema: escolha explícita ignora o sistema", () => {
    expect(resolverTema("claro", true)).toBe("claro");
    expect(resolverTema("claro", false)).toBe("claro");
    expect(resolverTema("escuro", false)).toBe("escuro");
    expect(resolverTema("escuro", true)).toBe("escuro");
  });

  test("resolverTema: 'sistema' obedece a mídia", () => {
    expect(resolverTema("sistema", true)).toBe("escuro");
    expect(resolverTema("sistema", false)).toBe("claro");
  });

  test("ehTema recusa lixo do localStorage", () => {
    for (const bom of ["claro", "escuro", "sistema"]) expect(ehTema(bom)).toBe(true);
    for (const ruim of ["dark", "", null, undefined, 0, {}, "CLARO"]) {
      expect(ehTema(ruim), `deveria recusar ${JSON.stringify(ruim)}`).toBe(false);
    }
  });

  test("o script anti-flash decide IGUAL a resolverTema em todos os cruzamentos", () => {
    // `null` = nunca escolheu; "dark" = lixo de outra versão. Ambos caem no padrão.
    const guardados = ["claro", "escuro", "sistema", null, "dark"];
    for (const guardado of guardados) {
      for (const sistemaEscuro of [true, false]) {
        const escolha = ehTema(guardado) ? guardado : TEMA_PADRAO;
        const esperado = resolverTema(escolha, sistemaEscuro) === "escuro";
        expect(
          rodarScript(guardado, sistemaEscuro),
          `guardado=${guardado} sistemaEscuro=${sistemaEscuro}: o script e resolverTema discordaram`,
        ).toBe(esperado);
      }
    }
  });

  test("o script nunca derruba a página quando o localStorage lança", () => {
    const janela = {
      localStorage: {
        getItem: () => {
          throw new Error("SecurityError");
        },
      },
    };
    expect(() =>
      new Function("window", "localStorage", "document", SCRIPT_ANTI_FLASH)(
        janela,
        janela.localStorage,
        {},
      ),
    ).not.toThrow();
  });
});
