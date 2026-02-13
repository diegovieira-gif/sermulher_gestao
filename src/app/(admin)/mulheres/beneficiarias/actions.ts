"use server";

import { revalidatePath } from "next/cache";
import { directus } from "@/lib/directus";
import { readItems, createItem, updateItem, deleteItem, readItem } from "@directus/sdk";
import { beneficiariaSchema } from "./schemas";

// Array exato com os campos que existem no banco (garantindo que o Form novo funcione)
const BENEFICIARIA_FIELDS = [
  'id',
  'nome_completo',
  'nome_social',
  'cpf',
  'data_nascimento',
  'raca_cor_id',
  'estado_civil_id',
  'escolaridade_id',
  'situacao_trabalho_id',
  'quantidade_filhos',
  'telefone',
  'email',
  'contato',
  'endereco',
  'numero_cad_unico',
  'perfil_socioeconomico',
  'recebe_bolsa_familia',
  'recebe_bpc',
  'possui_medida_protetiva'
];

export async function getBeneficiarias() {
  try {
    const beneficiarias = await directus.request(
      readItems("beneficiarias", {
        fields: BENEFICIARIA_FIELDS,
        sort: ["nome_completo"],
      })
    );
    return { success: true, data: beneficiarias };
  } catch (error) {
    console.error("Erro ao buscar beneficiárias:", error);
    return { success: false, error: "Erro ao buscar beneficiárias. Tente novamente." };
  }
}

export async function getBeneficiaria(id: number) {
  try {
    const beneficiaria = await directus.request(
      readItem("beneficiarias", id, {
        fields: BENEFICIARIA_FIELDS,
      })
    );
    return { success: true, data: beneficiaria };
  } catch (error) {
    console.error("Erro ao buscar beneficiária:", error);
    return { success: false, error: "Erro ao buscar beneficiária. Tente novamente." };
  }
}

export async function getBeneficiariaFormOptions() {
  try {
    const [racas, estadosCivis, escolaridades, situacoesTrabalho, bairros] = await Promise.all([
      directus.request(readItems("config_raca_cor", { fields: ["id", "nome"], sort: ["nome"] })),
      directus.request(readItems("config_estado_civil", { fields: ["id", "nome"], sort: ["nome"] })),
      directus.request(readItems("config_escolaridade", { fields: ["id", "nome"], sort: ["nome"] })),
      directus.request(readItems("config_situacao_trabalho", { fields: ["id", "nome"], sort: ["nome"] })),
      directus.request(readItems("config_bairros", { fields: ["id", "nome"], sort: ["nome"] })),
    ]);

    return {
      success: true,
      data: { racas, estadosCivis, escolaridades, situacoesTrabalho, bairros }
    };
  } catch (error) {
    console.error("Erro ao buscar opções do formulário:", error);
    return { success: false, data: null };
  }
}

export async function saveBeneficiaria(data: unknown) {
  try {
    const validatedData = beneficiariaSchema.parse(data);

    const payload: any = { ...validatedData };
    if (payload.cpf) {
      payload.cpf = payload.cpf.replace(/\D/g, "");
    }

    if (validatedData.id) {
      await directus.request(updateItem("beneficiarias", validatedData.id, payload));
      revalidatePath("/mulheres/beneficiarias");
      return { success: true, message: "Beneficiária atualizada com sucesso!" };
    } else {
      await directus.request(createItem("beneficiarias", payload));
      revalidatePath("/mulheres/beneficiarias");
      return { success: true, message: "Beneficiária cadastrada com sucesso!" };
    }
  } catch (error: any) {
    console.error("Erro ao salvar beneficiária:", error);
    if (error.name === "ZodError") {
      return { success: false, error: "Dados inválidos no formulário." };
    }
    return { success: false, error: "Erro ao salvar beneficiária." };
  }
}

export async function deleteBeneficiaria(id: number) {
  try {
    await directus.request(deleteItem("beneficiarias", id));
    revalidatePath("/mulheres/beneficiarias");
    return { success: true, message: "Beneficiária excluída com sucesso!" };
  } catch (error) {
    console.error("Erro ao excluir beneficiária:", error);
    return { success: false, error: "Erro ao excluir beneficiária. Tente novamente." };
  }
}

// === NOVAS ACTIONS DE ENTREGAS DE BENEFÍCIOS (QUE O AGENTE ESQUECEU) ===

export async function registrarEntrega(data: any) {
  try {
    const payload = {
      beneficiaria: data.beneficiaria,
      beneficio: data.beneficio,
      data_entrega: data.data_entrega,
      quantidade: data.quantidade,
      observacao: data.observacao || null,
    };

    const novaEntrega = await directus.request(
      createItem("entregas_beneficios", payload, {
        fields: [
          "id",
          "data_entrega",
          "quantidade",
          "observacao",
          "beneficio.id",
          "beneficio.nome",
          "user_created.first_name",
          "user_created.last_name",
          "user_created.email"
        ],
      })
    );

    revalidatePath(`/mulheres/beneficiarias/${data.beneficiaria}`);
    return { success: true, data: novaEntrega, message: "Entrega registrada com sucesso!" };
  } catch (error) {
    console.error("Erro ao registrar entrega:", error);
    return { success: false, error: "Erro ao registrar entrega. Tente novamente." };
  }
}

export async function deletarEntrega(id: number, beneficiariaId: number) {
  try {
    await directus.request(deleteItem("entregas_beneficios", id));
    revalidatePath(`/mulheres/beneficiarias/${beneficiariaId}`);
    return { success: true, message: "Entrega removida com sucesso!" };
  } catch (error) {
    console.error("Erro ao remover entrega:", error);
    return { success: false, error: "Erro ao remover entrega. Tente novamente." };
  }
}