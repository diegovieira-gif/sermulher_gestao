import { test, expect } from "@playwright/test";
import { bairroDaLista, combinarDados, dadosDoHub, dadosDoSiged, nomeProprio } from "../../src/lib/dados-pessoa";

/**
 * Busca por CPF nos cadastros: o Hub de Dados manda em nome, nascimento,
 * nome da mãe e endereço; o SIGED completa telefone, e-mail e nome social.
 * Dados de exemplo inventados.
 */

const respostaHub = {
  status: "success",
  resumo: { nome: "ANA MARIA DOS SANTOS", data_nascimento: "1990-05-10", nome_mae: "JOSEFA DOS SANTOS", bairro: "SANTA MARIA" },
  fontes: [
    { ultima_atualizacao_na_fonte: "2022-01-01 00:00:00", dados: { endereco: { cep: "49000-000", logradouro: "RUA VELHA", numero: "1", bairro: "CENTRO", cidade: "ARACAJU" } } },
    { ultima_atualizacao_na_fonte: "2025-03-01 00:00:00", dados: { endereco: { cep: "49044000", logradouro: "RUA NOVA", numero: "22", complemento: "", bairro: "SANTA MARIA", cidade: "ARACAJU" } } },
    { ultima_atualizacao_na_fonte: "2026-01-01 00:00:00", dados: { endereco: { cep: "", logradouro: "" } } },
  ],
};

test("nomes em maiúsculas viram caixa normal; preposições minúsculas", () => {
  expect(nomeProprio("MARIA DA CONCEICAO DOS SANTOS")).toBe("Maria da Conceicao dos Santos");
  expect(nomeProprio("JOSÉ D'ÁVILA")).toBe("José D'Ávila");
  expect(nomeProprio("Já Em Caixa Mista")).toBe("Já Em Caixa Mista");
});

test("bairro da base vira a grafia da lista do SIGMA", () => {
  expect(bairroDaLista("SANTA MARIA")).toBe("Santa Maria");
  expect(bairroDaLista("17 DE MARCO")).toBe("17 de Março");
  expect(bairroDaLista("")).toBe("");
});

test("Hub: resumo + endereço da fonte mais recente que tem endereço", () => {
  const d = dadosDoHub(respostaHub)!;
  expect(d.nome_completo).toBe("Ana Maria dos Santos");
  expect(d.nome_mae).toBe("Josefa dos Santos");
  expect(d.data_nascimento).toBe("1990-05-10");
  expect(d.endereco).toMatchObject({ cep: "49044000", logradouro: "Rua Nova", numero: "22", bairro: "Santa Maria", cidade: "Aracaju" });
  expect(dadosDoHub({ status: "not found" })).toBeNull();
  expect(dadosDoHub(null)).toBeNull();
});

test("combinação: Hub manda, SIGED completa; endereço de uma origem só", () => {
  const hub = dadosDoHub(respostaHub);
  const siged = dadosDoSiged({ userName: "ANA M SANTOS", userPhone1: "+55 79 99999-0000", userMail: "Ana@Exemplo.com", userSocialName: "", userAddressStreet: "OUTRA RUA", userAddressNumber: "9" });
  const { dados, origens } = combinarDados(hub, siged);
  expect(origens).toEqual(["Hub de Dados", "SIGED"]);
  expect(dados!.nome_completo).toBe("Ana Maria dos Santos");
  expect(dados!.telefone).toBe("79999990000");
  expect(dados!.email).toBe("ana@exemplo.com");
  expect(dados!.endereco.logradouro).toBe("Rua Nova");
  // Hub não conhece o CPF: tudo do SIGED
  const so = combinarDados(null, siged);
  expect(so.origens).toEqual(["SIGED"]);
  expect(so.dados!.endereco.logradouro).toBe("OUTRA RUA");
  expect(combinarDados(null, null)).toEqual({ dados: null, origens: [] });
});

test("ficha do Hub: CPF no caminho da URL", async () => {
  const { urlFichaHub } = await import("../../src/lib/consulta-cpf");
  expect(urlFichaHub("12345678901")).toBe("https://portal.educacao.aju.br/webservice/hub/cidadao/12345678901");
  expect(urlFichaHub("12345678901", "https://x.test/hub/cidadao/")).toBe("https://x.test/hub/cidadao/12345678901");
});
