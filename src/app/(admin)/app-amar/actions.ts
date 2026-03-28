"use server";

import { directus } from "@/lib/directus";
import { readItems, updateItem, deleteItem, createItem } from "@directus/sdk";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// --- CATEGORIAS ---

export async function getCategorias() {
  try {
    const result = await directus.request(
      readItems("amar_categorias", {
        sort: ["ordem"],
      }),
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
      updateItem("amar_categorias", id, { status: newStatus }),
    );
    revalidatePath("/app-amar/categorias");
    return { 
      success: true, 
      data: result ? JSON.parse(JSON.stringify(result)) : null 
    };
  } catch (error: any) {
    if (error?.message === "NEXT_REDIRECT") throw error;
    
    const isUnauthorized = 
      error?.response?.status === 401 || 
      error?.status === 401 || 
      error?.message?.includes("Invalid user credentials");
      
    if (isUnauthorized) redirect("/login?error=unauthorized");

    console.error("❌ Erro ao alterar status da categoria:", error);
    return { success: false, error: error.message || "Erro desconhecido" };
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
      updateItem("amar_categorias", id, data),
    );
    revalidatePath("/app-amar/categorias");
    return { 
      success: true, 
      data: result ? JSON.parse(JSON.stringify(result)) : null 
    };
  } catch (error: any) {
    if (error?.message === "NEXT_REDIRECT") throw error;
    
    const isUnauthorized = error?.response?.status === 401 || error?.status === 401;
    if (isUnauthorized) redirect("/login?error=unauthorized");

    console.error("❌ Erro ao atualizar categoria:", error);
    return { success: false, error: error.message || "Erro desconhecido" };
  }
}

// --- SERVIÇOS ---

export async function getServicos() {
  try {
    const result = await directus.request(
      readItems("amar_servicos", {
        fields: ["*", "categoria_id.*"],
      }),
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
      updateItem("amar_servicos", id, { status: newStatus }),
    );
    revalidatePath("/app-amar/servicos");
    return { 
      success: true, 
      data: result ? JSON.parse(JSON.stringify(result)) : null 
    };
  } catch (error: any) {
    if (error?.message === "NEXT_REDIRECT") throw error;
    const isUnauthorized = error?.response?.status === 401 || error?.status === 401;
    if (isUnauthorized) redirect("/login?error=unauthorized");
    console.error("❌ Erro ao alterar status do serviço:", error);
    return { success: false, error: error.message || "Erro desconhecido" };
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
    return { 
      success: true, 
      data: result ? JSON.parse(JSON.stringify(result)) : null 
    };
  } catch (error: any) {
    if (error?.message === "NEXT_REDIRECT") throw error;
    
    const isUnauthorized = error?.response?.status === 401 || error?.status === 401;
    if (isUnauthorized) redirect("/login?error=unauthorized");

    console.error("❌ Erro ao criar serviço:", error);
    return { success: false, error: error.message || "Erro desconhecido" };
  }
}

export async function updateServico(id: string, data: any) {
  try {
    console.log(`[updateServico] Incompatibilidade detectada? Atualizando ${id}`, data);
    const result = await directus.request(
      updateItem("amar_servicos", id, data),
    );
    revalidatePath("/app-amar/servicos");
    return { 
      success: true, 
      data: result ? JSON.parse(JSON.stringify(result)) : null 
    };
  } catch (error: any) {
    if (error?.message === "NEXT_REDIRECT") throw error;
    
    const isUnauthorized = error?.response?.status === 401 || error?.status === 401;
    if (isUnauthorized) redirect("/login?error=unauthorized");

    console.error("❌ Erro ao atualizar serviço:", error);
    return { success: false, error: error.message || "Erro desconhecido" };
  }
}

// --- CAMPANHAS ---

export async function getCampanhas() {
  try {
    const result = await directus.request(
      readItems("amar_campanhas", {
        sort: ["-date_created"], // Assuming there is a creation date, otherwise can sort by start date
      }),
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
      updateItem("amar_campanhas", id, { status: newStatus }),
    );
    revalidatePath("/app-amar/campanhas");
    return { 
      success: true, 
      data: result ? JSON.parse(JSON.stringify(result)) : null 
    };
  } catch (error: any) {
    if (error?.message === "NEXT_REDIRECT") throw error;
    const isUnauthorized = error?.response?.status === 401 || error?.status === 401;
    if (isUnauthorized) redirect("/login?error=unauthorized");
    console.error("❌ Erro ao alterar status da campanha:", error);
    return { success: false, error: error.message || "Erro desconhecido" };
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

export async function createCampanha(data: any) {
  try {
    const result = await directus.request(createItem("amar_campanhas", data));
    revalidatePath("/app-amar/campanhas");
    return { 
      success: true, 
      data: result ? JSON.parse(JSON.stringify(result)) : null 
    };
  } catch (error: any) {
    if (error?.message === "NEXT_REDIRECT") throw error;
    const isUnauthorized = error?.response?.status === 401 || error?.status === 401;
    if (isUnauthorized) redirect("/login?error=unauthorized");
    console.error("❌ Erro ao criar campanha:", error);
    return { success: false, error: error.message || "Erro desconhecido" };
  }
}

export async function updateCampanha(id: string, data: any) {
  try {
    const result = await directus.request(
      updateItem("amar_campanhas", id, data),
    );
    revalidatePath("/app-amar/campanhas");
    return { 
      success: true, 
      data: result ? JSON.parse(JSON.stringify(result)) : null 
    };
  } catch (error: any) {
    if (error?.message === "NEXT_REDIRECT") throw error;
    const isUnauthorized = error?.response?.status === 401 || error?.status === 401;
    if (isUnauthorized) redirect("/login?error=unauthorized");
    console.error("❌ Erro ao atualizar campanha:", error);
    return { success: false, error: error.message || "Erro desconhecido" };
  }
}

// --- SONHOS ---

export async function getSonhos() {
  try {
    const result = await directus.request(
      readItems("amar_sonhos", {
        sort: ["-date_created"],
      }),
    );
    return result;
  } catch (error) {
    console.error("Erro ao buscar sonhos:", error);
    return [];
  }
}

export async function getSonhoById(id: string) {
  try {
    const result = await directus.request(
      readItems("amar_sonhos", {
        filter: {
          id: {
            _eq: id,
          },
        },
        limit: 1,
      }),
    );
    return result?.[0] ?? null;
  } catch (error) {
    console.error("Erro ao buscar sonho por ID:", error);
    return null;
  }
}

export async function createSonho(data: any) {
  try {
    const result = await directus.request(createItem("amar_sonhos", data));
    revalidatePath("/app-amar/sonhos");
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Erro ao criar sonho:", error);
    return { success: false, error: error.message };
  }
}

export async function updateSonho(id: string, data: any) {
  try {
    const result = await directus.request(updateItem("amar_sonhos", id, data));
    revalidatePath("/app-amar/sonhos");
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Erro ao atualizar sonho:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteSonho(id: string) {
  try {
    await directus.request(deleteItem("amar_sonhos", id));
    revalidatePath("/app-amar/sonhos");
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao excluir sonho:", error);
    return { success: false, error: error.message };
  }
}

// --- CURSOS ---

export async function getCursos() {
  try {
    const result = await directus.request(
      readItems("amar_cursos", {
        sort: ["-id"],
      }),
    );
    return result;
  } catch (error) {
    console.error("Erro ao buscar cursos:", error);
    return [];
  }
}

export async function getCursoById(id: string) {
  try {
    const result = await directus.request(
      readItems("amar_cursos", {
        filter: {
          id: {
            _eq: id,
          },
        },
        limit: 1,
      }),
    );
    return result?.[0] ?? null;
  } catch (error) {
    console.error("Erro ao buscar curso por ID:", error);
    return null;
  }
}

export async function createCurso(data: any) {
  try {
    const result = await directus.request(createItem("amar_cursos", data));
    revalidatePath("/app-amar/cursos");
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Erro ao criar curso:", error);
    return { success: false, error: error.message };
  }
}

export async function updateCurso(id: string, data: any) {
  try {
    const result = await directus.request(updateItem("amar_cursos", id, data));
    revalidatePath("/app-amar/cursos");
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Erro ao atualizar curso:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteCurso(id: string) {
  try {
    await directus.request(deleteItem("amar_cursos", id));
    revalidatePath("/app-amar/cursos");
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao excluir curso:", error);
    return { success: false, error: error.message };
  }
}

// --- CONTATOS ---

export async function getContatos() {
  try {
    const result = await directus.request(
      readItems("amar_contatos", {
        sort: ["-id"],
      }),
    );
    return result;
  } catch (error) {
    console.error("Erro ao buscar contatos:", error);
    return [];
  }
}

export async function getContatoById(id: string) {
  try {
    const result = await directus.request(
      readItems("amar_contatos", {
        filter: {
          id: {
            _eq: id,
          },
        },
        limit: 1,
      }),
    );
    return result?.[0] ?? null;
  } catch (error) {
    console.error("Erro ao buscar contato por ID:", error);
    return null;
  }
}

export async function deleteContato(id: string) {
  try {
    await directus.request(deleteItem("amar_contatos", id));
    revalidatePath("/app-amar/contatos");
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao excluir contato:", error);
    return { success: false, error: error.message };
  }
}

// --- PROJETOS ---

export async function getProjetos() {
  try {
    const result = await directus.request(
      readItems("amar_projetos", {
        sort: ["ordem"],
      }),
    );
    return result;
  } catch (error) {
    console.error("Erro ao buscar projetos:", error);
    return [];
  }
}

export async function getProjetoById(id: string) {
  try {
    const result = await directus.request(
      readItems("amar_projetos", {
        filter: {
          id: {
            _eq: id,
          },
        },
        limit: 1,
      }),
    );
    return result?.[0] ?? null;
  } catch (error) {
    console.error("Erro ao buscar projeto por ID:", error);
    return null;
  }
}

export async function createProjeto(data: any) {
  try {
    const result = await directus.request(createItem("amar_projetos", data));
    revalidatePath("/app-amar/projetos");
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Erro ao criar projeto:", error);
    return { success: false, error: error.message };
  }
}

export async function updateProjeto(id: string, data: any) {
  try {
    const result = await directus.request(
      updateItem("amar_projetos", id, data),
    );
    revalidatePath("/app-amar/projetos");
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Erro ao atualizar projeto:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteProjeto(id: string) {
  try {
    await directus.request(deleteItem("amar_projetos", id));
    revalidatePath("/app-amar/projetos");
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao excluir projeto:", error);
    return { success: false, error: error.message };
  }
}
