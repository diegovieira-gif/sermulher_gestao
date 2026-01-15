"use server";

import { directus } from "@/lib/directus";
import { createItem, deleteItem, readItems, updateItem } from "@directus/sdk";
import { revalidatePath } from "next/cache";
import { InsertInfrator, insertInfratorSchema } from "./schemas";

// --- DEFINIÇÃO DE CAMPOS (CORRIGIDA COM O SNAPSHOT) ---
const INFRATOR_FIELDS = [
  'id',
  'nome_completo',
  'cpf',
  'data_nascimento',
  'contato',
  'numero_processo',
  'nivel_id.id',
  'nivel_id.nome',
  'nivel_id.cor',
  'status_legal_id.id',
  'status_legal_id.nome',
  // AQUI O PULO DO GATO: O nome da coluna na junção é 'tipo_agressao_id'
  'tipos_agressao_lista.tipo_agressao_id.id',
  'tipos_agressao_lista.tipo_agressao_id.nome'
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
    // CORREÇÃO: Retornar objeto padronizado
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
      error: "Erro ao carregar opções." 
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
    // CORREÇÃO: Retornar objeto padronizado
    return { 
      success: true, 
      data: items 
    };
  } catch (error) {
    console.error("Erro ao buscar infratores:", error);
    return { 
      success: false, 
      error: "Erro ao carregar lista de infratores." 
    };
  }
}

export async function saveInfrator(data: InsertInfrator & { id?: number }) {
  const validation = insertInfratorSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: "Dados inválidos." };
  }

  const { id, tipos_agressao_ids, ...fieldsToSave } = data;

  try {
    // CORREÇÃO CRÍTICA DO PAYLOAD
    // O banco espera 'tipo_agressao_id' e não 'config_tipos_agressao_id'
    const m2mPayload = tipos_agressao_ids?.map((tipoId: number) => ({
      tipo_agressao_id: { id: tipoId } 
    }));

    if (id) {
      // UPDATE
      await directus.request(updateItem('infratores', id, {
        ...fieldsToSave,
        // Se quiser atualizar agressões na edição:
        // tipos_agressao_lista: { create: m2mPayload, delete: [ids_antigos] }
        // Por segurança na edição simples, mantemos dados cadastrais:
      }, {
        fields: ['id']
      }));
      revalidatePath("/sala-azul/infratores");
      return { success: true, message: "Infrator atualizado com sucesso." };
    } else {
      // CREATE
      await directus.request(createItem('infratores', {
        ...fieldsToSave,
        // Aqui usamos o alias 'tipos_agressao_lista' definido no Infrator
        tipos_agressao_lista: m2mPayload 
      }, {
        fields: ['id']
      }));
      revalidatePath("/sala-azul/infratores");
      return { success: true, message: "Infrator cadastrado com sucesso." };
    }

  } catch (error: any) {
    console.error("Erro ao salvar infrator:", error);
    
    const isUniqueError = error?.errors?.some((e: any) => 
      e.message?.includes('unique') && e.message?.includes('cpf')
    );

    if (isUniqueError) {
      return { success: false, error: "Este CPF já está cadastrado." };
    }

    return { success: false, error: "Erro ao salvar. Verifique o console do servidor." };
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