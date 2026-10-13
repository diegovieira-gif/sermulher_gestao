import { test, expect } from "@playwright/test";
import {
  contagemHub,
  cpfDoHub,
  elegiveisHub,
  HUB_TAMANHO_PAGINA,
  paginaHub,
  paraCidadaoHub,
  ultimaAtualizacaoHub,
  type BeneficiariaHub,
} from "../../src/lib/hub-dados";

/**
 * Fonte do SIGMA para o Hub de Dados Municipais. Errar aqui é mandar para
 * fora o cadastro de uma mulher com medida protetiva, ou o endereço dela.
 */

const b = (id: number, extra: Partial<BeneficiariaHub> = {}): BeneficiariaHub => ({
  id,
  cpf: String(10000000000 + id),
  nome_completo: `Pessoa ${id}`,
  data_nascimento: "1990-05-10",
  date_created: "2026-01-02T12:00:00.000Z",
  date_updated: null,
  ...extra,
});

test("medida protetiva (ficha ou atendimento) e CPF inválido ficam fora", () => {
  const lista = [
    b(1),
    b(2, { possui_medida_protetiva: 1 }),
    b(3),
    b(4, { cpf: "123" }),
    b(5, { cpf: null }),
    b(6, { cpf: "100.000.000-01" }), // mesmo CPF da 1 (com máscara)
  ];
  const ids = elegiveisHub(lista, new Set([3])).map((x) => x.id);
  expect(ids).toEqual([1]);
});

test("o registro enviado não leva endereço, telefone nem e-mail", () => {
  const c = paraCidadaoHub(
    b(7, { cpf: "123.456.789-09", nome_mae: "  Maria da Silva ", date_updated: "2026-10-13T15:04:05.000Z" }) as BeneficiariaHub &
      Record<string, unknown>,
  );
  expect(Object.keys(c).sort()).toEqual(
    ["cpf", "data_nascimento", "nome", "nome_mae", "qtd_vinculos_familiares", "ultima_atualizacao", "vinculos_familiares"].sort(),
  );
  expect(c.cpf).toBe("12345678909");
  expect(c.nome_mae).toBe("Maria da Silva");
  expect(paraCidadaoHub(b(9)).nome_mae).toBe("");
  expect(c.ultima_atualizacao).toBe("2026-10-13 12:04:05");
  expect(c.vinculos_familiares).toEqual([]);
});

test("última atualização: Brasília, e nunca 'agora' quando falta", () => {
  expect(ultimaAtualizacaoHub("2026-01-01T02:00:00Z")).toBe("2025-12-31 23:00:00");
  expect(ultimaAtualizacaoHub("2026-01-01 02:00:00")).toBe("2025-12-31 23:00:00");
  expect(ultimaAtualizacaoHub(null)).toBe("");
  expect(ultimaAtualizacaoHub("lixo")).toBe("");
  // sem date_updated, vale a criação
  expect(paraCidadaoHub(b(8)).ultima_atualizacao).toBe("2026-01-02 09:00:00");
});

test("contagem e páginas batem; página fora do intervalo não quebra", () => {
  const lista = Array.from({ length: HUB_TAMANHO_PAGINA + 5 }, (_, i) => b(i + 1));
  expect(contagemHub(lista.length)).toEqual({ status: "success", qtd_pagina: 2, qtd_usuarios: 105 });
  const p1 = paginaHub(lista, 1);
  expect(p1).toMatchObject({ status: "success", pagina: 1, paginas_restantes: 1, qtd: 100 });
  expect(paginaHub(lista, 2)).toMatchObject({ pagina: 2, paginas_restantes: 0, qtd: 5 });
  for (const fora of [0, 3, 99999, NaN]) {
    expect(paginaHub(lista, fora)).toEqual({ status: "not found", message: "Página não encontrada", qtd: 0, data: [] });
  }
  expect(contagemHub(0)).toEqual({ status: "success", qtd_pagina: 0, qtd_usuarios: 0 });
});

test("cpfDoHub só aceita 11 dígitos", () => {
  expect(cpfDoHub("123.456.789-09")).toBe("12345678909");
  expect(cpfDoHub("1234567890")).toBeNull();
});
