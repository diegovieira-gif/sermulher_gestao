"use server";

import { directus } from "@/lib/directus";
import { createItem, deleteItem, readItems, updateItem } from "@directus/sdk";
import { revalidatePath } from "next/cache";
import { InsertInfrator, insertInfratorSchema } from "./schemas";
import { assertAccess } from "@/lib/permissions";

const INFRATOR_FIELDS = [
  'id',
  'nome_completo',
  'cpf',
  'data_nascimento',
  'contato',
  'numero_processo',
  // Relacionamentos M2O (ainda precisamos dos nomes aqui)
  'nivel_id.id',
  'nivel_id.nome',
  'nivel_id.cor',
  'status_legal_id.id',
  'status_legal_id.nome',
  // M2M em dois níveis (ver sincronizarTiposAgressao): o id do tipo está em
  // junção → infratores_tipos_agressao → tipo_agressao_id.
  'tipos_agressao_lista.infratores_tipos_agressao_id.tipo_agressao_id'
];

/**
 * O M2M `tipos_agressao_lista` no Directus é:
 *   infratores → infratores_infratores_tipos_agressao_1 (junção)
 *     → infratores_tipos_agressao (infrator_id, tipo_agressao_id)
 *       → config_tipos_agressao.
 * O payload antigo (`{ tipo_agressao_id }` direto na junção) gravava linhas
 * sem tipo, e a edição nem tocava no M2M. Aqui a lista é reescrita de forma
 * explícita: remove o que saiu (inclusive linhas antigas sem tipo) e cria só
 * o que falta.
 */
const JUNCAO_TIPOS = 'infratores_infratores_tipos_agressao_1';
const TIPOS_DO_INFRATOR = 'infratores_tipos_agressao';

async function sincronizarTiposAgressao(infratorId: number, tipoIds: number[]) {
  const desejados = new Set(tipoIds.map(Number));
  const atuais = (await directus.request(readItems(JUNCAO_TIPOS, {
    fields: ['id', 'infratores_tipos_agressao_id.id', 'infratores_tipos_agressao_id.tipo_agressao_id'],
    filter: { infratores_id: { _eq: infratorId } },
    limit: -1,
  }))) as Array<{ id: number; infratores_tipos_agressao_id?: { id: number; tipo_agressao_id: number | null } | null }>;

  const mantidos = new Set<number>();
  for (const linha of atuais) {
    const tipo = Number(linha.infratores_tipos_agressao_id?.tipo_agressao_id);
    if (desejados.has(tipo) && !mantidos.has(tipo)) {
      mantidos.add(tipo);
      continue;
    }
    await directus.request(deleteItem(JUNCAO_TIPOS, linha.id));
    if (linha.infratores_tipos_agressao_id?.id) {
      await directus.request(deleteItem(TIPOS_DO_INFRATOR, linha.infratores_tipos_agressao_id.id));
    }
  }

  for (const tipo of desejados) {
    if (mantidos.has(tipo)) continue;
    await directus.request(createItem(JUNCAO_TIPOS, {
      infratores_id: infratorId,
      infratores_tipos_agressao_id: { infrator_id: infratorId, tipo_agressao_id: tipo },
    }));
  }
}

/** Achata `tipos_agressao_lista` para os ids dos tipos — o que os formulários esperam. */
function idsDosTipos(lista: unknown): number[] {
  if (!Array.isArray(lista)) return [];
  return lista
    .map((item: any) => Number(item?.infratores_tipos_agressao_id?.tipo_agressao_id))
    .filter((n) => Number.isFinite(n) && n > 0);
}

// Tipos exportados para uso nos componentes
export type NivelOption = {
  id: number;
  nome: string;
  cor: string;
};

export type StatusLegalOption = {
  id: number;
  nome: string;
};

export type TipoAgressaoOption = {
  id: number;
  nome: string;
};

export async function getOptions() {
  await assertAccess("sala-azul");
  try {
    const [niveis, status, tiposAgressao] = await Promise.all([
      directus.request(readItems('config_niveis_periculosidade', { fields: ['id', 'nome', 'cor'], limit: -1 })),
      directus.request(readItems('config_status_legal', { fields: ['id', 'nome'], limit: -1 })),
      directus.request(readItems('config_tipos_agressao', { fields: ['id', 'nome'], limit: -1 })),
    ]);
    return { 
      success: true, 
      data: { 
        niveis, 
        statusLegal: status, 
        tiposAgressao 
      } 
    };
  } catch (error) {
    console.error("Erro ao buscar opções:", error);
    return { 
      success: false, 
      error: "Erro opções" 
    };
  }
}

export async function getInfratores() {
  await assertAccess("sala-azul");
  try {
    const items = await directus.request(readItems('infratores', {
      sort: ['nome_completo'],
      // @ts-ignore
      fields: INFRATOR_FIELDS, 
      // Sem limite explícito o Directus corta em 100 infratores.
      limit: -1,
    }));

    return { 
      success: true, 
      data: items.map((item: any) => ({
        ...item,
        tipos_agressao_lista: idsDosTipos(item.tipos_agressao_lista),
      })),
    };
  } catch (error) {
    console.error("Erro busca:", error);
    return { 
      success: false, 
      error: "Erro ao buscar autores." 
    };
  }
}

export async function saveInfrator(data: InsertInfrator & { id?: number }) {
  await assertAccess("sala-azul");
  // Validação Zod
  const validation = insertInfratorSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: "Dados inválidos" };
  }

  // Separa campos virtuais. O payload sai do dado VALIDADO — o objeto cru do
  // cliente podia levar campos extras (ex.: tipos_agressao_lista) ao Directus.
  const { id, tipos_agressao_ids, telefone, ...rest } = validation.data;

  // Monta payload para o Directus
  const payload = {
    ...rest,
    // O Directus recusa "" em campo date.
    data_nascimento: rest.data_nascimento || null,
    contato: telefone ? { telefone } : null, // Salva no JSON
  };

  try {
    let infratorId: number;
    if (id) {
      await directus.request(updateItem('infratores', id, payload));
      infratorId = id;
    } else {
      const criado = (await directus.request(createItem('infratores', payload))) as { id: number };
      infratorId = criado.id;
    }
    await sincronizarTiposAgressao(infratorId, tipos_agressao_ids);
    revalidatePath("/sala-azul/infratores");
    return { success: true, message: id ? "Autor atualizado com sucesso." : "Autor cadastrado com sucesso." };

  } catch (error: any) {
    console.error("Erro ao salvar:", error);
    return { success: false, error: "Erro ao salvar autor." };
  }
}

export async function deleteInfrator(id: number) {
  await assertAccess("sala-azul");
  try {
    await directus.request(deleteItem('infratores', id));
    revalidatePath("/sala-azul/infratores");
    return { success: true, message: "Autor excluído com sucesso." };
  } catch (error) {
    return { success: false, error: "Erro ao excluir." };
  }
}