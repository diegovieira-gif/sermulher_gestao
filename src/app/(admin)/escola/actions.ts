"use server";

import { directus } from "@/lib/directus";
import { EscolaAlunoDB, EscolaCursoDB, EscolaTurmaDB } from "@/types/database";
import { createItem, deleteItem, readItems, updateItem } from "@directus/sdk";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CURSO_FIELDS = [
  "id",
  "nome",
  "area_atuacao",
  "carga_horaria",
  "ementa",
] as const;

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
    const cursos = await directus.request<
      Array<Partial<EscolaCursoDB> & { area_atuacao?: string; ementa?: string }>
    >(
      readItems("escola_cursos", {
        limit: -1,
        sort: ["nome"],
        // @ts-ignore
        fields: CURSO_FIELDS,
      }),
    );

    const data: EscolaCursoDB[] = (cursos ?? []).map((item) => ({
      id: Number(item.id),
      nome: item.nome ?? "",
      descricao: item.descricao,
      carga_horaria: item.carga_horaria ?? 0,
      status: item.status || "ativo",
      // Campos opcionais não presentes na interface original, mas consumidos pelo front
      area_atuacao: item.area_atuacao ?? "outros",
      ementa: item.ementa ?? "",
    }));

    return { success: true, data };
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
    const cursos = await directus.request<
      Array<Pick<EscolaCursoDB, "id" | "nome">>
    >(
      readItems("escola_cursos", {
        limit: -1,
        sort: ["nome"],
        // @ts-ignore
        fields: ["id", "nome"],
      }),
    );

    const options: Array<{ label: string; value: number | string }> = (
      cursos || []
    ).map((curso) => ({
      label: curso.nome,
      value: curso.id,
    }));

    return { success: true, data: options };
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

type TurmaWithCurso = Omit<EscolaTurmaDB, "curso_id" | "capacidade_maxima"> & {
  curso: EscolaTurmaDB["curso_id"];
  instrutor?: string;
  vagas?: number;
  capacidade_maxima?: number;
};

type BeneficiariaOption = Pick<
  EscolaAlunoDB,
  "id" | "nome_completo" | "cpf"
> & {
  contato: string | null;
};

/**
 * Busca todas as turmas com o nome do curso relacionado.
 */
export async function getTurmas() {
  try {
    const turmas = await directus.request<TurmaWithCurso[]>(
      readItems("escola_turmas", {
        limit: -1,
        sort: ["nome"],
        // Importante: trazer o nome do curso relacionado
        // @ts-ignore
        fields: ["*", "curso.nome"],
      }),
    );

    return { success: true, data: turmas };
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
// =========================
// Gestão de Matrículas (escola_matriculas)
// =========================

/**
 * Busca turma por ID com dados do curso relacionado
 */
export async function getTurmaById(id: number) {
  try {
    const turma = await directus.request<TurmaWithCurso[]>(
      readItems("escola_turmas", {
        filter: {
          id: {
            _eq: id,
          },
        },
        // @ts-ignore
        fields: ["*", "curso.*"],
        limit: 1,
      }),
    );

    // Filtra pela ID (defensivo caso o filtro não seja aplicado pelo Directus)
    const turmaEspecifica = turma.find((t) => t.id === id);

    if (!turmaEspecifica) {
      return { success: false, error: "Turma não encontrada." };
    }

    return { success: true, data: turmaEspecifica };
  } catch (error) {
    console.error("Erro ao buscar turma:", error);
    return { success: false, error: "Erro ao buscar turma." };
  }
}

export type Matricula = {
  id: number;
  turma: number;
  beneficiaria: {
    id: number;
    nome_completo: string;
    cpf: string;
    contato: string | { telefone?: string; email?: string } | null;
  };
  data_matricula: string;
  status: string;
};

/**
 * Busca matrículas de uma turma com dados da beneficiária
 */
export async function getMatriculasByTurma(turmaId: number) {
  try {
    const matriculas = await directus.request(
      readItems("escola_matriculas", {
        filter: {
          turma: {
            _eq: turmaId,
          },
        },
        // @ts-ignore
        fields: [
          "id",
          "turma",
          "data_matricula",
          "status",
          "beneficiaria.id",
          "beneficiaria.nome_completo",
          "beneficiaria.cpf",
          "beneficiaria.contato",
        ],
        sort: ["beneficiaria.nome_completo"],
        limit: -1,
      }),
    );

    return { success: true, data: matriculas as Matricula[] };
  } catch (error) {
    console.error("Erro ao buscar matrículas:", error);
    return { success: false, error: "Erro ao buscar matrículas." };
  }
}

/**
 * Busca todas as beneficiárias para o combobox de matrícula
 */
export async function getBeneficiariasOptions() {
  try {
    const beneficiarias = await directus.request<BeneficiariaOption[]>(
      readItems("beneficiarias", {
        // @ts-ignore
        fields: ["id", "nome_completo", "cpf", "contato"],
        sort: ["nome_completo"],
        limit: -1,
      }),
    );

    return {
      success: true,
      data: beneficiarias,
    };
  } catch (error) {
    console.error("Erro ao buscar beneficiárias:", error);
    return { success: false, error: "Erro ao buscar beneficiárias." };
  }
}

/**
 * Cria uma nova matrícula
 * Verifica se já existe matrícula ativa para evitar duplicação
 */
export async function saveMatricula(turmaId: number, beneficiariaId: number) {
  try {
    // Verifica se já existe matrícula ativa para essa beneficiaria nessa turma
    const existing = await directus.request(
      readItems("escola_matriculas", {
        filter: {
          _and: [
            {
              turma: {
                _eq: turmaId,
              },
            },
            {
              beneficiaria: {
                _eq: beneficiariaId,
              },
            },
            {
              status: {
                _eq: "ativa",
              },
            },
          ],
        },
        limit: 1,
      }),
    );

    if (existing && existing.length > 0) {
      return {
        success: false,
        error: "Esta beneficiária já possui uma matrícula ativa nesta turma.",
      };
    }

    // Cria a matrícula
    await directus.request(
      createItem("escola_matriculas", {
        turma: turmaId,
        beneficiaria: beneficiariaId,
        data_matricula: new Date().toISOString(),
        status: "ativa",
      }),
    );

    revalidatePath(`/escola/turmas/${turmaId}`);

    return { success: true };
  } catch (error) {
    console.error("Erro ao salvar matrícula:", error);
    return { success: false, error: "Erro ao salvar matrícula." };
  }
}

/**
 * Deleta uma matrícula
 */
export async function deleteMatricula(id: number) {
  try {
    // Primeiro, busca a matrícula para pegar o turmaId para revalidação
    const matriculas = await directus.request<
      Array<{ id: number; turma?: number | null }>
    >(
      readItems("escola_matriculas", {
        filter: {
          id: {
            _eq: id,
          },
        },
        limit: 1,
      }),
    );
    const matricula = matriculas.find((m) => m.id === id);

    await directus.request(deleteItem("escola_matriculas", id));

    if (matricula?.turma) {
      revalidatePath(`/escola/turmas/${matricula.turma}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar matrícula:", error);
    return { success: false, error: "Erro ao deletar matrícula." };
  }
}

// =========================
// Gestão de Frequência (escola_frequencia)
// =========================

export type RegistroFrequencia = {
  id: number;
  turma: number;
  beneficiaria: number;
  data: string;
  presente: boolean;
};

export type PresencaPayload = {
  beneficiariaId: number;
  presente: boolean;
};

/**
 * Busca registros de frequência de uma turma em uma data específica
 */
export async function getFrequenciaByData(turmaId: number, data: string) {
  try {
    const frequencias = await directus.request(
      readItems("escola_frequencia", {
        filter: {
          _and: [
            {
              turma: {
                _eq: turmaId,
              },
            },
            {
              data: {
                _eq: data,
              },
            },
          ],
        },
        // @ts-ignore
        fields: ["id", "turma", "beneficiaria", "data", "presente"],
        limit: -1,
      }),
    );

    return { success: true, data: frequencias as RegistroFrequencia[] };
  } catch (error) {
    console.error("Erro ao buscar frequência:", error);
    return { success: false, error: "Erro ao buscar frequência." };
  }
}

/**
 * Salva registros de frequência (chamada) de uma turma em uma data
 * Usa estratégia de upsert: deleta todos os registros da data e recria
 */
export async function saveFrequencia(
  turmaId: number,
  data: string,
  presencas: PresencaPayload[],
) {
  try {
    // 1. Busca registros existentes nesta data/turma
    const existingResult = await getFrequenciaByData(turmaId, data);
    const existing = existingResult.success ? existingResult.data || [] : [];

    // 2. Deleta os registros existentes
    for (const registro of existing) {
      await directus.request(deleteItem("escola_frequencia", registro.id));
    }

    // 3. Cria novos registros
    for (const presenca of presencas) {
      await directus.request(
        createItem("escola_frequencia", {
          turma: turmaId,
          beneficiaria: presenca.beneficiariaId,
          data: data,
          presente: presenca.presente,
        }),
      );
    }

    revalidatePath(`/escola/turmas/${turmaId}`);

    return { success: true };
  } catch (error) {
    console.error("Erro ao salvar frequência:", error);
    return { success: false, error: "Erro ao salvar frequência." };
  }
}

// =========================
// Gestão de Resultados e Certificação
// =========================

export type MatriculaComPerformance = Matricula & {
  aulas_totais: number;
  presencas: number;
  frequencia_percentual: number;
  aprovada: boolean;
};

/**
 * Busca performance de todas as alunas de uma turma
 * Retorna: matrículas com aulas_totais, presencas, frequencia_percentual e aprovada
 */
export async function getTurmaPerformance(turmaId: number) {
  try {
    // 1. Busca todas as matrículas da turma
    const matriculasResult = await getMatriculasByTurma(turmaId);
    if (!matriculasResult.success || !matriculasResult.data) {
      return { success: false, error: "Erro ao buscar matrículas." };
    }

    const matriculas = matriculasResult.data;

    // 2. Busca TODOS os registros de frequência da turma (não filtrado por data)
    const frequenciasResult = await directus.request(
      readItems("escola_frequencia", {
        filter: {
          turma: {
            _eq: turmaId,
          },
        },
        // @ts-ignore
        fields: ["id", "turma", "beneficiaria", "data", "presente"],
        limit: -1,
      }),
    );

    const frequencias = (frequenciasResult || []) as RegistroFrequencia[];

    // 3. Calcula total de aulas (datas únicas com registros de frequência)
    const aulasSet = new Set(frequencias.map((f) => f.data));
    const aulas_totais = aulasSet.size;

    // 4. Monta array de performance para cada matrícula
    const performance: MatriculaComPerformance[] = matriculas.map(
      (matricula) => {
        // Conta presenças da aluna (presente = true)
        const presencas = frequencias.filter(
          (f) =>
            f.beneficiaria === matricula.beneficiaria.id && f.presente === true,
        ).length;

        // Calcula frequência percentual
        const frequencia_percentual =
          aulas_totais > 0 ? (presencas / aulas_totais) * 100 : 0;

        // Determina se aprovada (>= 75%)
        const aprovada = frequencia_percentual >= 75;

        return {
          ...matricula,
          aulas_totais,
          presencas,
          frequencia_percentual: Math.round(frequencia_percentual * 100) / 100,
          aprovada,
        };
      },
    );

    return { success: true, data: performance };
  } catch (error) {
    console.error("Erro ao buscar performance da turma:", error);
    return { success: false, error: "Erro ao buscar performance." };
  }
}
