import { test, expect } from "@playwright/test";
import {
  insertEventoSchema,
  membroEquipeEventoSchema,
} from "../../src/app/(admin)/eventos/schemas";

/**
 * Schemas do módulo de Eventos.
 *
 * O de equipe merece atenção porque o usuário vem de `directus_users`, cuja
 * chave primária é **UUID** — diferente de todos os outros relacionamentos do
 * projeto, que usam inteiro. Passar um número aqui grava um vínculo quebrado
 * que só aparece quando alguém abre a lista e vê "Usuário removido".
 */

test.describe("membroEquipeEventoSchema", () => {
  const UUID = "3f2504e0-4f89-11d3-9a0c-0305e82c3301";

  test("aceita evento numérico e usuário UUID", () => {
    const r = membroEquipeEventoSchema.safeParse({ evento: 12, usuario: UUID });
    expect(r.success).toBe(true);
  });

  test("converte evento vindo como string do formulário", () => {
    // Campos de formulário chegam como string; o coerce evita exigir conversão
    // manual em cada chamada.
    const r = membroEquipeEventoSchema.safeParse({ evento: "12", usuario: UUID });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.evento).toBe(12);
  });

  test("recusa usuário que não é UUID", () => {
    for (const invalido of ["", "42", "usuario-qualquer", UUID.slice(0, -1)]) {
      const r = membroEquipeEventoSchema.safeParse({
        evento: 1,
        usuario: invalido,
      });
      expect(r.success, `deveria recusar "${invalido}"`).toBe(false);
    }
  });

  test("recusa evento ausente, zero ou negativo", () => {
    for (const invalido of [0, -1, undefined]) {
      const r = membroEquipeEventoSchema.safeParse({
        evento: invalido,
        usuario: UUID,
      });
      expect(r.success).toBe(false);
    }
  });

  test("a mensagem de erro é escrita para quem usa o sistema", () => {
    const r = membroEquipeEventoSchema.safeParse({ evento: 1, usuario: "" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].message).toBe("Selecione uma pessoa da equipe.");
    }
  });
});

test.describe("insertEventoSchema — regra de período", () => {
  const base = {
    nome: "Roda de conversa",
    tipo_id: 1,
    data_inicio: "2026-08-10T09:00",
    data_fim: "2026-08-10T12:00",
  };

  test("aceita período válido", () => {
    expect(insertEventoSchema.safeParse(base).success).toBe(true);
  });

  test("aceita início e fim iguais (evento pontual)", () => {
    const r = insertEventoSchema.safeParse({
      ...base,
      data_fim: base.data_inicio,
    });
    expect(r.success).toBe(true);
  });

  test("recusa fim anterior ao início, apontando o campo certo", () => {
    const r = insertEventoSchema.safeParse({
      ...base,
      data_fim: "2026-08-09T12:00",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      // O erro precisa cair em `data_fim` para o formulário destacar o campo.
      expect(r.error.issues[0].path).toEqual(["data_fim"]);
    }
  });

  test("recusa nome curto demais", () => {
    expect(insertEventoSchema.safeParse({ ...base, nome: "ab" }).success).toBe(
      false,
    );
  });
});
