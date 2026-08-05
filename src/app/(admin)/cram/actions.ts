"use server";

import { revalidatePath } from "next/cache";
import {
  aggregate,
  createItem,
  deleteItem,
  readItem,
  readItems,
  updateItem,
} from "@directus/sdk";
import { getDirectusAdmin } from "@/lib/directus";
import { assertAccess } from "@/lib/permissions";
import { evolucaoSchema, instrumentalSchema, piaSchema } from "./schemas";

/**
 * Autoriza o usuário no módulo "cram" e devolve o cliente admin (lazy).
 * Toda action deste arquivo DEVE obter o cliente por aqui — nunca importar
 * `getDirectusAdmin` diretamente, sob pena de burlar a checagem de perfil.
 */
async function getCramDirectus() {
  await assertAccess("cram");
  return getDirectusAdmin();
}

const COLLECTION = "cram_atendimentos";
const COMPOSICAO = "cram_composicao_domiciliar";
const PIA = "cram_pia";
const PACTUACOES = "cram_pia_pactuacoes";
const EVOLUCOES = "cram_pia_evolucoes";

const LISTA_FIELDS = [
  "id",
  "data_atendimento",
  "turno",
  "status",
  "responsavel_atendimento",
  "tipos_violencia",
  "risco",
  "possui_medida_protetiva",
  "beneficiaria.id",
  "beneficiaria.nome_completo",
  "beneficiaria.cpf",
];

const DETALHE_FIELDS = ["*", "beneficiaria.*", "ubs_id.id", "ubs_id.nome"];

export type InstrumentalListItem = {
  id: number;
  data_atendimento: string;
  turno: string | null;
  status: string;
  responsavel_atendimento: string | null;
  tipos_violencia: string[] | null;
  risco: Record<string, string> | null;
  possui_medida_protetiva: boolean | null;
  beneficiaria: { id: number; nome_completo: string; cpf?: string } | null;
};

export type BeneficiariaOption = {
  id: number;
  nome_completo: string;
  cpf?: string;
};

export type UbsOption = { id: number; nome: string };

/** Datas vazias precisam virar null — o Directus rejeita string vazia em `date`. */
const normalizeDate = (value?: string | null) => {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed === "" ? null : trimmed;
};

// --- Leitura ----------------------------------------------------------------

export type InstrumentaisMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const INSTRUMENTAIS_POR_PAGINA = 20;

/**
 * Lista paginada com busca no Directus — o teto fixo de 200 registros fazia
 * atendimentos antigos sumirem da listagem (e da busca) sem nenhum aviso.
 */
export async function getInstrumentais(search?: string, page = 1) {
  const directus = await getCramDirectus();
  try {
    const filter: Record<string, unknown> = {};
    if (search && search.trim()) {
      const termo = search.trim();
      const digitos = termo.replace(/\D/g, "");
      filter.beneficiaria = {
        _or: [
          { nome_completo: { _icontains: termo } },
          // O CPF é gravado só com dígitos — comparar com a máscara nunca casa.
          ...(digitos ? [{ cpf: { _contains: digitos } }] : []),
        ],
      };
    }

    const paginaAtual = Math.max(1, page);
    const [data, contagem] = await Promise.all([
      directus.request(
        readItems(COLLECTION, {
          fields: LISTA_FIELDS,
          filter,
          sort: ["-data_atendimento", "-id"],
          limit: INSTRUMENTAIS_POR_PAGINA,
          offset: (paginaAtual - 1) * INSTRUMENTAIS_POR_PAGINA,
        }),
      ),
      directus.request(
        aggregate(COLLECTION, { aggregate: { count: "*" }, query: { filter } }),
      ),
    ]);

    const total = Number((contagem as any)?.[0]?.count ?? 0);
    const meta: InstrumentaisMeta = {
      page: paginaAtual,
      limit: INSTRUMENTAIS_POR_PAGINA,
      total,
      totalPages: Math.max(1, Math.ceil(total / INSTRUMENTAIS_POR_PAGINA)),
    };

    return { success: true, data: data as unknown as InstrumentalListItem[], meta };
  } catch (error) {
    console.error("Erro ao buscar instrumentais do CRAM:", error);
    return { success: false, error: "Falha ao carregar os atendimentos." };
  }
}

export async function getInstrumental(id: number) {
  const directus = await getCramDirectus();
  try {
    const [registro, composicao] = await Promise.all([
      directus.request(readItem(COLLECTION, id, { fields: DETALHE_FIELDS })),
      directus.request(
        readItems(COMPOSICAO, {
          fields: ["*"],
          filter: { cram_atendimento: { _eq: id } },
          sort: ["sort", "id"],
          limit: -1,
        }),
      ),
    ]);

    return {
      success: true,
      data: { ...(registro as Record<string, unknown>), composicao_domiciliar: composicao },
    };
  } catch (error) {
    console.error("Erro ao buscar instrumental:", error);
    return { success: false, error: "Atendimento não encontrado." };
  }
}

export async function getFormOptions(): Promise<{
  beneficiarias: BeneficiariaOption[];
  ubs: UbsOption[];
}> {
  const directus = await getCramDirectus();
  try {
    const [beneficiarias, ubs] = await Promise.all([
      directus.request(
        readItems("beneficiarias", {
          fields: ["id", "nome_completo", "cpf"],
          sort: ["nome_completo"],
          limit: -1,
        }),
      ),
      directus
        .request(
          readItems("config_ubs", {
            fields: ["id", "nome"],
            sort: ["nome"],
            limit: -1,
          }),
        )
        .catch(() => []),
    ]);

    return {
      beneficiarias: beneficiarias as unknown as BeneficiariaOption[],
      ubs: ubs as unknown as UbsOption[],
    };
  } catch (error) {
    console.error("Erro ao carregar opções do CRAM:", error);
    return { beneficiarias: [], ubs: [] };
  }
}

// --- Gravação do instrumental ----------------------------------------------

/**
 * Separa a composição domiciliar (coleção filha) do corpo do instrumental e
 * normaliza datas vazias.
 */
function prepararPayload(dados: Record<string, unknown>) {
  const resto = { ...dados };
  delete resto.id;
  delete resto.composicao_domiciliar;
  return {
    ...resto,
    data_atendimento: normalizeDate(resto.data_atendimento as string),
  };
}

/** Reescreve as linhas da composição domiciliar de um atendimento. */
async function sincronizarComposicao(
  directus: Awaited<ReturnType<typeof getCramDirectus>>,
  atendimentoId: number,
  membros: Array<Record<string, unknown>>,
) {
  const atuais = (await directus.request(
    readItems(COMPOSICAO, {
      fields: ["id"],
      filter: { cram_atendimento: { _eq: atendimentoId } },
      limit: -1,
    }),
  )) as Array<{ id: number }>;

  const mantidos = new Set(
    membros.map((m) => Number(m.id)).filter((n) => Number.isFinite(n) && n > 0),
  );

  // Remove o que saiu da tabela na UI.
  for (const linha of atuais) {
    if (!mantidos.has(linha.id)) {
      await directus.request(deleteItem(COMPOSICAO, linha.id));
    }
  }

  // Cria/atualiza mantendo a ordem exibida.
  for (const [indice, membro] of membros.entries()) {
    const { id, ...campos } = membro;
    const payload = { ...campos, cram_atendimento: atendimentoId, sort: indice };
    if (id && Number(id) > 0) {
      await directus.request(updateItem(COMPOSICAO, Number(id), payload));
    } else {
      await directus.request(createItem(COMPOSICAO, payload));
    }
  }
}

/**
 * `input` chega como `unknown` de propósito: quem valida é o schema do servidor
 * (`instrumentalSchema`), não a tipagem do cliente. Assim o formulário não
 * precisa de casts para chamar a action.
 */
export async function saveInstrumental(input: unknown) {
  const directus = await getCramDirectus();

  const validacao = instrumentalSchema.safeParse(input);
  if (!validacao.success) {
    const primeiro = validacao.error.issues[0];
    return {
      success: false,
      error: primeiro ? `${primeiro.path.join(".")}: ${primeiro.message}` : "Dados inválidos.",
    };
  }

  const dados = validacao.data;
  const membros = dados.composicao_domiciliar ?? [];
  const payload = prepararPayload(dados as unknown as Record<string, unknown>);

  try {
    let atendimentoId: number;

    if (dados.id) {
      await directus.request(updateItem(COLLECTION, dados.id, payload));
      atendimentoId = dados.id;
    } else {
      const criado = (await directus.request(createItem(COLLECTION, payload))) as {
        id: number;
      };
      atendimentoId = criado.id;
    }

    await sincronizarComposicao(
      directus,
      atendimentoId,
      membros as unknown as Array<Record<string, unknown>>,
    );

    revalidatePath("/cram");
    revalidatePath(`/cram/${atendimentoId}`);
    return { success: true, id: atendimentoId };
  } catch (error) {
    console.error("Erro ao salvar instrumental do CRAM:", error);
    return { success: false, error: "Erro ao salvar o atendimento." };
  }
}

export async function deleteInstrumental(id: number) {
  const directus = await getCramDirectus();
  try {
    await directus.request(deleteItem(COLLECTION, id));
    revalidatePath("/cram");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir instrumental:", error);
    return { success: false, error: "Erro ao excluir o atendimento." };
  }
}

// --- Plano Individual de Atendimento ---------------------------------------

export async function getPiaPorAtendimento(atendimentoId: number) {
  const directus = await getCramDirectus();
  try {
    const encontrados = (await directus.request(
      readItems(PIA, {
        fields: ["*"],
        filter: { cram_atendimento: { _eq: atendimentoId } },
        limit: 1,
      }),
    )) as Array<Record<string, unknown>>;

    const pia = encontrados[0];
    if (!pia) return { success: true, data: null };

    const [pactuacoes, evolucoes] = await Promise.all([
      directus.request(
        readItems(PACTUACOES, {
          fields: ["*"],
          filter: { pia: { _eq: pia.id } },
          sort: ["sort", "id"],
          limit: -1,
        }),
      ),
      directus.request(
        readItems(EVOLUCOES, {
          fields: ["*"],
          filter: { pia: { _eq: pia.id } },
          sort: ["-data", "-id"],
          limit: -1,
        }),
      ),
    ]);

    return { success: true, data: { ...pia, pactuacoes, evolucoes } };
  } catch (error) {
    console.error("Erro ao buscar PIA:", error);
    return { success: false, error: "Falha ao carregar o plano individual." };
  }
}

/** Reescreve as pactuações de um PIA (mesma estratégia da composição). */
async function sincronizarPactuacoes(
  directus: Awaited<ReturnType<typeof getCramDirectus>>,
  piaId: number,
  linhas: Array<Record<string, unknown>>,
) {
  const atuais = (await directus.request(
    readItems(PACTUACOES, {
      fields: ["id"],
      filter: { pia: { _eq: piaId } },
      limit: -1,
    }),
  )) as Array<{ id: number }>;

  const mantidos = new Set(
    linhas.map((l) => Number(l.id)).filter((n) => Number.isFinite(n) && n > 0),
  );

  for (const linha of atuais) {
    if (!mantidos.has(linha.id)) {
      await directus.request(deleteItem(PACTUACOES, linha.id));
    }
  }

  for (const [indice, linha] of linhas.entries()) {
    const { id, ...campos } = linha;
    const payload = { ...campos, pia: piaId, sort: indice };
    if (id && Number(id) > 0) {
      await directus.request(updateItem(PACTUACOES, Number(id), payload));
    } else {
      await directus.request(createItem(PACTUACOES, payload));
    }
  }
}

export async function savePia(input: unknown) {
  const directus = await getCramDirectus();

  const validacao = piaSchema.safeParse(input);
  if (!validacao.success) {
    const primeiro = validacao.error.issues[0];
    return {
      success: false,
      error: primeiro ? `${primeiro.path.join(".")}: ${primeiro.message}` : "Dados inválidos.",
    };
  }

  const dados = validacao.data;
  const { id, pactuacoes = [], ...resto } = dados;
  const payload = { ...resto, data_abertura: normalizeDate(resto.data_abertura) };

  try {
    let piaId: number;
    if (id) {
      await directus.request(updateItem(PIA, id, payload));
      piaId = id;
    } else {
      const criado = (await directus.request(createItem(PIA, payload))) as { id: number };
      piaId = criado.id;
    }

    await sincronizarPactuacoes(
      directus,
      piaId,
      pactuacoes as unknown as Array<Record<string, unknown>>,
    );

    if (dados.cram_atendimento) revalidatePath(`/cram/${dados.cram_atendimento}`);
    return { success: true, id: piaId };
  } catch (error) {
    console.error("Erro ao salvar PIA:", error);
    return { success: false, error: "Erro ao salvar o plano individual." };
  }
}

export async function addEvolucao(piaId: number, input: unknown) {
  const directus = await getCramDirectus();

  const validacao = evolucaoSchema.safeParse(input);
  if (!validacao.success) {
    const primeiro = validacao.error.issues[0];
    return {
      success: false,
      error: primeiro ? primeiro.message : "Dados inválidos.",
    };
  }

  try {
    await directus.request(
      createItem(EVOLUCOES, {
        ...validacao.data,
        data: normalizeDate(validacao.data.data),
        pia: piaId,
      }),
    );
    return { success: true };
  } catch (error) {
    console.error("Erro ao registrar evolução:", error);
    return { success: false, error: "Erro ao registrar a evolução." };
  }
}

export async function deleteEvolucao(id: number) {
  const directus = await getCramDirectus();
  try {
    await directus.request(deleteItem(EVOLUCOES, id));
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir evolução:", error);
    return { success: false, error: "Erro ao excluir a evolução." };
  }
}
