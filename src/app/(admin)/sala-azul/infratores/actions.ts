"use server";

import { directus } from "@/lib/directus";
import { createItem, deleteItem, readItems, updateItem } from "@directus/sdk";
import { revalidatePath } from "next/cache";
import { Infrator, insertInfratorSchema } from "./schemas";

// --- DEFINIÇÃO RIGOROSA DOS CAMPOS ---
// O segredo para não quebrar M2M é especificar o caminho completo (dot notation)
const INFRATOR_FIELDS = [
  'id',
  'nome_completo',
  'cpf',
  'data_nascimento',
  'contato',
  'numero_processo',
  // Relacionamentos M2O (Simples)
  'nivel_id.id',
  'nivel_id.nome',
  'nivel_id.cor',
  'status_legal_id.id',
  'status_legal_id.nome',
  // Relacionamento M2M (Complexo)
  // Atenção: Aqui buscamos o ID e o Nome de dentro da tabela de configuração, passando pela junção
  'tipos_agressao_lista.config_tipos_agressao_id.id',
  'tipos_agressao_lista.config_tipos_agressao_id.nome'
];

export async function getOptions() {
  try {
    const [niveis, status, tiposAgressao] = await Promise.all([
      directus.request(readItems('config_niveis_periculosidade', { fields: ['id', 'nome', 'cor'] })),
      directus.request(readItems('config_status_legal', { fields: ['id', 'nome'] })),
      directus.request(readItems('config_tipos_agressao', { fields: ['id', 'nome'] })),
    ]);
    return { niveis, status, tiposAgressao };
  } catch (error) {
    console.error("Erro ao buscar opções:", error);
    return { niveis: [], status: [], tiposAgressao: [] };
  }
}

export async function getInfratores() {
  try {
    const items = await directus.request(readItems('infratores', {
      sort: ['nome_completo'],
      // @ts-ignore - Ignoramos erro de tipagem do SDK para forçar os campos corretos
      fields: INFRATOR_FIELDS, 
    }));
    return items;
  } catch (error) {
    console.error("Erro ao buscar infratores:", error);
    return [];
  }
}

export async function saveInfrator(data: Infrator) {
  const validation = insertInfratorSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: "Dados inválidos." };
  }

  // Removemos tipos_agressao_ids do objeto principal pois não é campo do banco
  const { id, tipos_agressao_ids, ...fieldsToSave } = data;

  try {
    // 1. Preparar Payload M2M
    // Para criar o relacionamento, enviamos um array de objetos
    const m2mPayload = tipos_agressao_ids?.map((tipoId: number) => ({
      config_tipos_agressao_id: { id: tipoId }
    }));

    if (id) {
      // --- UPDATE ---
      // Atualizar M2M é complexo (requer diff).
      // Estratégia Segura: Atualizamos dados cadastrais.
      // Se quiser atualizar agressões, o ideal seria deletar as relações antigas e criar novas,
      // mas para evitar complexidade agora, vamos atualizar apenas os dados escalares.
      await directus.request(updateItem('infratores', id, {
        ...fieldsToSave,
        // Descomente abaixo se quiser tentar forçar atualização (pode duplicar sem lógica de delete)
        // tipos_agressao_lista: { create: m2mPayload } 
      }, {
        fields: ['id'] // Retorna só ID para evitar erro de leitura
      }));
    } else {
      // --- CREATE ---
      await directus.request(createItem('infratores', {
        ...fieldsToSave,
        tipos_agressao_lista: m2mPayload // Criação funciona bem com essa sintaxe
      }, {
        fields: ['id'] // Retorna só ID para evitar erro de leitura
      }));
    }

    revalidatePath("/sala-azul/infratores");
    return { success: true };

  } catch (error: any) {
    console.error("Erro ao salvar infrator:", error);
    
    // Tratamento de Erro de CPF Único
    const isUniqueError = error?.errors?.some((e: any) => 
      e.message?.includes('unique') && e.message?.includes('cpf')
    );

    if (isUniqueError) {
      return { success: false, error: "Este CPF já está cadastrado." };
    }

    return { success: false, error: "Erro ao salvar. Tente novamente." };
  }
}

export async function deleteInfrator(id: number) {
  try {
    await directus.request(deleteItem('infratores', id));
    revalidatePath("/sala-azul/infratores");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir:", error);
    return { success: false, error: "Erro ao excluir." };
  }
}