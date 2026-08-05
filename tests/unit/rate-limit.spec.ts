import { test, expect } from "@playwright/test";
import {
  MAX_FALHAS_EMAIL,
  MAX_FALHAS_IP,
  ipDaRequisicao,
  limparFalhas,
  registrarFalha,
  segundosParaLiberar,
} from "../../src/lib/rate-limit";

/**
 * Limitador de tentativas de login.
 *
 * O estado vive num Map de módulo, compartilhado entre os testes deste
 * arquivo — por isso cada teste usa uma chave própria e limpa o que criou.
 */

test.describe("rate-limit — limite por conta", () => {
  test("libera até o limite e bloqueia a partir dele", () => {
    const chave = "email:conta-limite@exemplo.invalid";
    limparFalhas(chave);

    for (let i = 0; i < MAX_FALHAS_EMAIL - 1; i++) {
      registrarFalha(chave);
      expect(
        segundosParaLiberar(chave, MAX_FALHAS_EMAIL),
        `ainda deve liberar após ${i + 1} falha(s)`,
      ).toBe(0);
    }

    // A falha que atinge o limite fecha a porta.
    registrarFalha(chave);
    const espera = segundosParaLiberar(chave, MAX_FALHAS_EMAIL);
    expect(espera).toBeGreaterThan(0);
    // Janela de 15 min: nunca deve pedir mais do que isso.
    expect(espera).toBeLessThanOrEqual(15 * 60);

    limparFalhas(chave);
  });

  test("login bem-sucedido zera o contador", () => {
    const chave = "email:conta-zera@exemplo.invalid";
    limparFalhas(chave);

    for (let i = 0; i < MAX_FALHAS_EMAIL; i++) registrarFalha(chave);
    expect(segundosParaLiberar(chave, MAX_FALHAS_EMAIL)).toBeGreaterThan(0);

    limparFalhas(chave); // é o que a rota faz ao autenticar
    expect(segundosParaLiberar(chave, MAX_FALHAS_EMAIL)).toBe(0);
  });
});

test.describe("rate-limit — isolamento entre chaves", () => {
  test("bloquear uma conta não bloqueia outra", () => {
    const alvo = "email:vitima@exemplo.invalid";
    const vizinha = "email:colega@exemplo.invalid";
    limparFalhas(alvo);
    limparFalhas(vizinha);

    for (let i = 0; i < MAX_FALHAS_EMAIL; i++) registrarFalha(alvo);

    expect(segundosParaLiberar(alvo, MAX_FALHAS_EMAIL)).toBeGreaterThan(0);
    expect(segundosParaLiberar(vizinha, MAX_FALHAS_EMAIL)).toBe(0);

    limparFalhas(alvo);
  });

  test("o IP compartilhado da secretaria aguenta várias contas errando", () => {
    // Regressão do risco real: todas as servidoras saem pelo mesmo IP público.
    // Com o limite de conta (5), cinco pessoas errando uma vez cada NÃO podem
    // derrubar o acesso de quem ainda nem tentou.
    const ip = "ip:200.0.0.1";
    limparFalhas(ip);

    for (let i = 0; i < MAX_FALHAS_EMAIL * 5; i++) registrarFalha(ip);

    expect(
      segundosParaLiberar(ip, MAX_FALHAS_IP),
      "25 falhas ainda estão abaixo do limite de origem",
    ).toBe(0);

    limparFalhas(ip);
  });

  test("o limite de origem existe e é maior que o de conta", () => {
    const ip = "ip:203.0.113.7";
    limparFalhas(ip);

    expect(MAX_FALHAS_IP).toBeGreaterThan(MAX_FALHAS_EMAIL);

    for (let i = 0; i < MAX_FALHAS_IP; i++) registrarFalha(ip);
    expect(segundosParaLiberar(ip, MAX_FALHAS_IP)).toBeGreaterThan(0);

    limparFalhas(ip);
  });
});

test.describe("rate-limit — identificação da origem", () => {
  test("usa o primeiro IP do X-Forwarded-For (cliente real atrás do proxy)", () => {
    const req = new Request("http://localhost/api/auth/login", {
      headers: { "x-forwarded-for": "198.51.100.9, 10.0.0.1, 10.0.0.2" },
    });
    expect(ipDaRequisicao(req)).toBe("198.51.100.9");
  });

  test("cai para X-Real-IP quando não há X-Forwarded-For", () => {
    const req = new Request("http://localhost/api/auth/login", {
      headers: { "x-real-ip": "198.51.100.10" },
    });
    expect(ipDaRequisicao(req)).toBe("198.51.100.10");
  });

  test("sem cabeçalho de origem, devolve rótulo estável (não quebra)", () => {
    const req = new Request("http://localhost/api/auth/login");
    expect(ipDaRequisicao(req)).toBe("desconhecido");
  });
});
