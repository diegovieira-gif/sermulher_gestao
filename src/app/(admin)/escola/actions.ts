"use server";

import { directus } from "@/lib/directus";
import { createItem, deleteItem, readItems, updateItem } from "@directus/sdk";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CURSO_FIELDS = ["id", "nome", "area_atuacao", "carga_horaria", "ementa"] as const;

const cursoSchema = z.object({
  id: z.number().optional(),
  nome: z.string().min(2, "Informe o nome do curso"),
  area_atuacao: z.enum([
    "beleza",
    "gastronomia",
    "artesanato",
    "tecnologia",
    "gestao",
    "outros",
  ]),
  carga_horaria: z.coerce
    .number()
    .int()
    .positive("A carga horária deve ser maior que zero"),
  ementa: z.string().max(4000, "Ementa muito longa").optional(),
});

export type CursoPayload = z.infer<typeof cursoSchema>;

/**
 * Busca todos os cursos
 */
export async function getCursos() {
  try {
    const cursos = await directus.request(
      readItems("escola_cursos", {
        limit: -1,
        sort: ["nome"],
        // @ts-ignore
        fields: CURSO_FIELDS,
      })
    );

    return { success: true, data: cursos as CursoPayload[] };
  } catch (error) {
    console.error("Erro ao buscar cursos:", error);
    return { success: false, error: "Erro ao buscar cursos." };
  }
}

/**
 * Salva um curso (cria ou atualiza)
 */
export async function saveCurso(data: CursoPayload) {
  const parsed = cursoSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos. Verifique os campos." };
  }

  const { id, ...payload } = parsed.data;

  try {
    if (id) {
      await directus.request(updateItem("escola_cursos", id, payload));
    } else {
      await directus.request(createItem("escola_cursos", payload));
    }

    revalidatePath("/escola/cursos");

    return { success: true };
  } catch (error) {
    console.error("Erro ao salvar curso:", error);
    return { success: false, error: "Erro ao salvar curso." };
  }
}

/**
 * Deleta um curso
 */
export async function deleteCurso(id: number) {
  try {
    await directus.request(deleteItem("escola_cursos", id));

    revalidatePath("/escola/cursos");

    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar curso:", error);
    return { success: false, error: "Erro ao deletar curso." };
  }
}

/**
 * Opções de Cursos para selects
 */
export async function getCursosOptions() {
  try {
    const cursos = await directus.request(
      readItems("escola_cursos", {
        limit: -1,
        sort: ["nome"],
        // @ts-ignore
        fields: ["id", "nome"],
      })
    );

    const options = (cursos || []).map((c: any) => ({
      label: c.nome,
      value: c.id,
    }));

    return { success: true, data: options as Array<{ label: string; value: number | string }> };
  } catch (error) {
    console.error("Erro ao buscar opções de cursos:", error);
    return { success: false, error: "Erro ao buscar cursos." };
  }
}

// =========================
// Gestão de Turmas (escola_turmas)
// =========================

const turmaSchema = z.object({
  id: z.number().optional(),
  nome: z.string().min(2, "Informe o nome da turma"),
  curso: z.coerce.number(),
  instrutor: z.string().min(2, "Informe o instrutor"),
  vagas: z.coerce.number().int().positive("Vagas deve ser maior que zero"),
  data_inicio: z.string().optional(),
  data_fim: z.string().optional(),
  status: z.enum(["aberta", "em_andamento", "concluida", "cancelada"]),
});

export type TurmaPayload = z.infer<typeof turmaSchema>;

/**
 * Busca todas as turmas com o nome do curso relacionado.
 */
export async function getTurmas() {
  try {
    const turmas = await directus.request(
      readItems("escola_turmas", {
        limit: -1,
        sort: ["nome"],
        // Importante: trazer o nome do curso relacionado
        // @ts-ignore
        fields: ["*", "curso.nome"],
      })
    );

    return { success: true, data: turmas as any[] };
  } catch (error) {
    console.error("Erro ao buscar turmas:", error);
    return { success: false, error: "Erro ao buscar turmas." };
  }
}

/**
 * Cria ou atualiza uma turma
 */
export async function saveTurma(data: TurmaPayload) {
  const parsed = turmaSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos. Verifique os campos." };
  }

  const { id, ...payload } = parsed.data;

  try {
    if (id) {
      await directus.request(updateItem("escola_turmas", id, payload));
    } else {
      await directus.request(createItem("escola_turmas", payload));
    }

    revalidatePath("/escola/turmas");

    return { success: true };
  } catch (error) {
    console.error("Erro ao salvar turma:", error);
    return { success: false, error: "Erro ao salvar turma." };
  }
}

/**
 * Deleta uma turma
 */
export async function deleteTurma(id: number) {
  try {
    await directus.request(deleteItem("escola_turmas", id));

    revalidatePath("/escola/turmas");

    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar turma:", error);
    return { success: false, error: "Erro ao deletar turma." };
  }
}
