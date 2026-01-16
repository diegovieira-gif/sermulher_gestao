"use server";

import { directus } from "@/lib/directus";
import { createItem, deleteItem, readItems, updateItem } from "@directus/sdk";
import { revalidatePath } from "next/cache";
import { InsertInfrator, insertInfratorSchema } from "./schemas";

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
  // Relacionamento M2M - Busca apenas o campo (que virá como array de IDs)
  'tipos_agressao_lista'
];

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
  try {
    const [niveis, status, tiposAgressao] = await Promise.all([
      directus.request(readItems('config_niveis_periculosidade', { fields: ['id', 'nome', 'cor'] })),
      directus.request(readItems('config_status_legal', { fields: ['id', 'nome'] })),
      directus.request(readItems('config_tipos_agressao', { fields: ['id', 'nome'] })),
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
  try {
    const items = await directus.request(readItems('infratores', {
      sort: ['nome_completo'],
      // @ts-ignore
      fields: INFRATOR_FIELDS, 
    }));

    return { 
      success: true, 
      data: items 
    };
  } catch (error) {
    console.error("Erro busca:", error);
    return { 
      success: false, 
      error: "Erro ao buscar infratores." 
    };
  }
}

export async function saveInfrator(data: InsertInfrator & { id?: number }) {
  // Validação Zod
  const validation = insertInfratorSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: "Dados inválidos" };
  }

  // Separa campos virtuais
  const { id, tipos_agressao_ids, telefone, ...rest } = data;

  // Monta payload para o Directus
  const payload = {
    ...rest,
    contato: telefone ? { telefone } : null, // Salva no JSON
    // Lógica M2M para criação (simplificada)
    tipos_agressao_lista: !id && tipos_agressao_ids ? tipos_agressao_ids.map(tid => ({
      tipo_agressao_id: { id: tid }
    })) : undefined,
  };

  try {
    if (id) {
      // Update (sem mexer no M2M por segurança nesta etapa)
      await directus.request(updateItem('infratores', id, payload));
    } else {
      // Create
      await directus.request(createItem('infratores', payload));
    }
    revalidatePath("/sala-azul/infratores");
    return { success: true, message: id ? "Infrator atualizado com sucesso." : "Infrator cadastrado com sucesso." };

  } catch (error: any) {
    console.error("Erro ao salvar:", error);
    return { success: false, error: "Erro ao salvar infrator." };
  }
}

export async function deleteInfrator(id: number) {
  try {
    await directus.request(deleteItem('infratores', id));
    revalidatePath("/sala-azul/infratores");
    return { success: true, message: "Infrator excluído com sucesso." };
  } catch (error) {
    return { success: false, error: "Erro ao excluir." };
  }
}