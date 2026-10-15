import { test, expect } from "@playwright/test";
import { combinarCandidatos, consultasDaFicha, lerSugestoes, nomesConferem, telefoneParaBusca } from "../../src/lib/busca-cpf";

/**
 * Localizar CPF pelo Hub: sempre dois critérios por busca e o resultado é
 * candidato — quem confirma é a equipe. Dados inventados.
 */

test("buscas da ficha: dois critérios por vez, da mais forte para a mais fraca", () => {
  const c = consultasDaFicha({ id: 1, nome_completo: "Ana Lúcia Souza", telefone: "(79) 99999-0000", data_nascimento: "1990-05-10" });
  expect(c.map((x) => x.rotulo)).toEqual(["telefone + nascimento", "nome + telefone", "nome + nascimento"]);
  expect(c[1].filtros).toEqual({ nome: "ana lucia souza", telefone: "79999990000" });
  // só telefone: não busca (um critério sozinho não identifica ninguém)
  expect(consultasDaFicha({ id: 2, nome_completo: "Ana", telefone: "79999990000" })).toEqual([]);
  // nome curto demais não entra
  expect(consultasDaFicha({ id: 3, nome_completo: "Ana", telefone: "79999990000", data_nascimento: "1990-01-01" }).map((x) => x.rotulo)).toEqual(["telefone + nascimento"]);
});

test("telefone para a busca: 10/11 dígitos, sem o 55", () => {
  expect(telefoneParaBusca("+55 (79) 99999-0000")).toBe("79999990000");
  expect(telefoneParaBusca("7932140000")).toBe("7932140000");
  expect(telefoneParaBusca("99999-0000")).toBe("");
});

test("nomes conferem: sem acento, nome do meio opcional, primeiro nome obrigatório", () => {
  expect(nomesConferem("Ana Lúcia Souza", "ANA LUCIA SOUZA")).toBe(true);
  expect(nomesConferem("Ana Souza", "ANA LUCIA DE SOUZA")).toBe(true);
  expect(nomesConferem("Maria Souza", "ANA MARIA SOUZA")).toBe(false);
  expect(nomesConferem("Ana Souza", "ANA PEREIRA")).toBe(false);
});

test("candidatos: um por CPF, ordenados por quantas buscas acharam", () => {
  const ficha = { id: 9, nome_completo: "Ana Souza", telefone: "79999990000", data_nascimento: "1990-05-10" };
  const s = combinarCandidatos(
    ficha,
    [
      { rotulo: "telefone + nascimento", data: [{ nome: "ANA SOUZA LIMA", cpf: "111.111.111-11", data_nascimento: "1990-05-10" }] },
      { rotulo: "nome + telefone", data: [{ nome: "ANA SOUZA LIMA", cpf: "11111111111", data_nascimento: "1990-05-10" }, { nome: "JOAO SOUZA", cpf: "22222222222", data_nascimento: "1960-01-01" }], truncado: true },
    ],
    new Date("2026-10-15T12:00:00Z"),
  );
  expect(s.situacao).toBe("pendente");
  expect(s.truncado).toBe(true);
  expect(s.candidatos.map((c) => c.cpf)).toEqual(["11111111111", "22222222222"]);
  expect(s.candidatos[0]).toMatchObject({ criterios: ["telefone + nascimento", "nome + telefone"], nome_confere: true, nascimento_confere: true });
  expect(s.candidatos[1]).toMatchObject({ nome_confere: false, nascimento_confere: false });
  expect(combinarCandidatos(ficha, [{ rotulo: "x", data: [] }]).situacao).toBe("sem_resultado");
});

test("lerSugestoes aceita objeto ou texto JSON", () => {
  const s = { buscado_em: "x", buscas: [], situacao: "pendente", truncado: false, candidatos: [] };
  expect(lerSugestoes(s)).toEqual(s);
  expect(lerSugestoes(JSON.stringify(s))).toEqual(s);
  expect(lerSugestoes("lixo")).toBeNull();
  expect(lerSugestoes(null)).toBeNull();
});
