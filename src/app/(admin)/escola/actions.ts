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
