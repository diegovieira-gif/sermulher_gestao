"use server";

import { directus } from "@/lib/directus";
import { readItems, updateItem, deleteItem, createItem } from "@directus/sdk";
import { revalidatePath } from "next/cache";

// --- CATEGORIAS ---

export async function getCategorias() {
  try {
    const result = await directus.request(
      readItems("amar_categorias", {
        sort: ["ordem"],
      })
    );
    return result;
  } catch (error) {
    console.error("Erro ao buscar categorias:", error);
    return [];
  }
}

export async function toggleCategoriaStatus(id: string, newStatus: string) {
  try {
    const result = await directus.request(
      updateItem("amar_categorias", id, { status: newStatus })
    );
    revalidatePath("/app-amar/categorias");
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Erro ao alterar status da categoria:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteCategoria(id: string) {
  try {
    await directus.request(deleteItem("amar_categorias", id));
    revalidatePath("/app-amar/categorias");
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao excluir categoria:", error);
    return { success: false, error: error.message };
  }
}

export async function createCategoria(data: any) {
  try {
    const result = await directus.request(createItem("amar_categorias", data));
    revalidatePath("/app-amar/categorias");
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Erro ao criar categoria:", error);
    return { success: false, error: error.message };
  }
}

export async function updateCategoria(id: string, data: any) {
  try {
    const result = await directus.request(
      updateItem("amar_categorias", id, data)
    );
    revalidatePath("/app-amar/categorias");
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Erro ao atualizar categoria:", error);
    return { success: false, error: error.message };
  }
}

// --- SERVIÇOS ---

export async function getServicos() {
  try {
    const result = await directus.request(
      readItems("amar_servicos", {
        fields: ["*", "categoria_id.*"],
      })
    );
    return result;
  } catch (error) {
    console.error("Erro ao buscar serviços:", error);
    return [];
  }
}

export async function toggleServicoStatus(id: string, newStatus: string) {
  try {
    const result = await directus.request(
      updateItem("amar_servicos", id, { status: newStatus })
    );
    revalidatePath("/app-amar/servicos");
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Erro ao alterar status do serviço:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteServico(id: string) {
  try {
    await directus.request(deleteItem("amar_servicos", id));
    revalidatePath("/app-amar/servicos");
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao excluir serviço:", error);
    return { success: false, error: error.message };
  }
}

export async function createServico(data: any) {
  try {
    const result = await directus.request(createItem("amar_servicos", data));
    revalidatePath("/app-amar/servicos");
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Erro ao criar serviço:", error);
    return { success: false, error: error.message };
  }
}

export async function updateServico(id: string, data: any) {
  try {
    const result = await directus.request(
      updateItem("amar_servicos", id, data)
    );
    revalidatePath("/app-amar/servicos");
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Erro ao atualizar serviço:", error);
    return { success: false, error: error.message };
  }
}

// --- CAMPANHAS ---

export async function getCampanhas() {
  try {
    const result = await directus.request(
      readItems("amar_campanhas", {
        sort: ["-date_created"], // Assuming there is a creation date, otherwise can sort by start date
      })
    );
    return result;
  } catch (error) {
    console.error("Erro ao buscar campanhas:", error);
    return [];
  }
}

export async function toggleCampanhaStatus(id: string, newStatus: string) {
  try {
    const result = await directus.request(
      updateItem("amar_campanhas", id, { status: newStatus })
    );
    revalidatePath("/app-amar/campanhas");
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Erro ao alterar status da campanha:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteCampanha(id: string) {
  try {
    await directus.request(deleteItem("amar_campanhas", id));
    revalidatePath("/app-amar/campanhas");
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao excluir campanha:", error);
    return { success: false, error: error.message };
  }
}
