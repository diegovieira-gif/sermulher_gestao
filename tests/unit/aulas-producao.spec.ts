import { test, expect } from "@playwright/test";
import {
  aplicarPronuncia, blocosDeLegenda, duracaoDaCena, enquadramento, hostEhLocal,
  marca, proximaSemana, srt,
} from "../../scripts/aulas/lib.mjs";

/**
 * Peças puras da produção das vídeo-aulas (scripts/aulas/lib.mjs).
 * Nada aqui chama a ElevenLabs, abre navegador ou roda ffmpeg.
 */

test.describe("aplicarPronuncia", () => {
  const termos = { _comentario: "x", CPF: "cê pê éfe", SUS: "sus", SUAS: "Suas", PIA: "pê i á" };

  test("troca a sigla inteira e ignora as chaves de comentário", () => {
    expect(aplicarPronuncia("Informe o CPF.", termos)).toBe("Informe o cê pê éfe.");
    expect(aplicarPronuncia("_comentario", termos)).toBe("_comentario");
  });

  test("não troca dentro de outra palavra nem com maiúscula diferente", () => {
    expect(aplicarPronuncia("a pia da cozinha", termos)).toBe("a pia da cozinha");
    expect(aplicarPronuncia("PIAUÍ", termos)).toBe("PIAUÍ");
  });

  test("a sigla mais longa ganha: SUAS não vira 'susAS'", () => {
    expect(aplicarPronuncia("rede SUAS e cartão SUS", termos)).toBe("rede Suas e cartão sus");
  });
});

test.describe("marca", () => {
  test("muda quando o texto ou a voz mudam, e só então", () => {
    expect(marca("olá", "v1")).toBe(marca("olá", "v1"));
    expect(marca("olá", "v1")).not.toBe(marca("olá!", "v1"));
    expect(marca("olá", "v1")).not.toBe(marca("olá", "v2"));
  });
});

test.describe("duracaoDaCena", () => {
  test("tela dura a fala mais o respiro; cartão tem piso para ser lido", () => {
    expect(duracaoDaCena({ tipo: "tela" }, 4)).toBeCloseTo(4.6);
    expect(duracaoDaCena({ tipo: "cartao" }, 0.5)).toBe(2.5);
  });
});

test.describe("enquadramento", () => {
  const W = 2880, H = 1800; // 1440×900 com escala 2

  test("sem foco: faixa 16:9 encostada no topo (onde está o cabeçalho), sem zoom", () => {
    const e = enquadramento(null, W, H);
    expect(e.faixaAlt).toBe(1620);
    expect(e.faixaY).toBe(0);
    expect(e.zoom).toBe(1);
  });

  test("a faixa acompanha um foco no rodapé sem sair da imagem", () => {
    const e = enquadramento({ x: 0.4, y: 0.95, w: 0.1, h: 0.04 }, W, H, 2);
    expect(e.faixaY).toBe(H - 1620);
    expect(e.cy).toBeGreaterThan(0);
    expect(e.cy).toBeLessThanOrEqual(1620);
  });

  test("o zoom encolhe quando o elemento não cabe nele com folga", () => {
    const largo = enquadramento({ x: 0.1, y: 0.4, w: 0.7, h: 0.1 }, W, H, 2.5);
    expect(largo.zoom).toBeLessThan(1.3);
    const pequeno = enquadramento({ x: 0.5, y: 0.5, w: 0.05, h: 0.03 }, W, H, 2.5);
    expect(pequeno.zoom).toBe(2.5);
  });
});

test.describe("legendas", () => {
  test("blocos cobrem exatamente a fala, em ordem", () => {
    const b = blocosDeLegenda("Primeira frase. Segunda frase, um pouco mais longa.", 10, 6);
    expect(b).toHaveLength(2);
    expect(b[0].inicio).toBe(10);
    expect(b.at(-1)!.fim).toBeCloseTo(16);
    expect(b[1].inicio).toBeCloseTo(b[0].fim);
  });

  test("frase longa é quebrada em blocos curtos", () => {
    const longa = Array.from({ length: 40 }, (_, i) => `palavra${i}`).join(" ");
    for (const bloco of blocosDeLegenda(longa, 0, 10)) expect(bloco.texto.length).toBeLessThanOrEqual(84);
  });

  test("formato SRT com vírgula nos milissegundos", () => {
    const texto = srt([{ inicio: 61.5, fim: 63.25, texto: "Olá" }]);
    expect(texto).toBe("1\n00:01:01,500 --> 00:01:03,250\nOlá\n");
  });
});

test.describe("trava da captura", () => {
  test("só aceita endereço local", () => {
    expect(hostEhLocal("http://localhost:3000")).toBe(true);
    expect(hostEhLocal("http://127.0.0.1:3124")).toBe(true);
    expect(hostEhLocal("http://sigma.test")).toBe(true);
    expect(hostEhLocal("https://sigma-sermulher.aracaju.se.gov.br")).toBe(false);
    expect(hostEhLocal("http://192.168.0.118:3002")).toBe(false);
  });
});

test("proximaSemana devolve a data de daqui a sete dias", () => {
  expect(proximaSemana(new Date(2026, 9, 8, 12))).toBe("2026-10-15");
});
