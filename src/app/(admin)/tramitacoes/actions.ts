"use server";

import { revalidatePath } from "next/cache";
import { directus } from "@/lib/directus";
import { readItem, readItems, updateItem, deleteItem } from "@directus/sdk";
import { StatusEtapa } from "@/app/(admin)/mulheres/atendimentos/[id]/schemas";
import { getCurrentDemandAccess, tipoDemandaPermitido } from "@/lib/demanda-permissions";
import { assertAccess } from "@/lib/permissions";

export type KanbanCard = {
  id: number;
  status_etapa: StatusEtapa;
  tipo_demanda: string;
  data_recebimento: string;
  setor_nome: string;
  prioridade: string;
  beneficiaria: {
    nome: string;
    cpf: string;
  };
  atendimento_id: number;
};

export async function getKanbanData(search?: string, setorId?: string) {
  await assertAccess("tramitacoes");
  try {
    // Construção dinâmica do filtro
    const filter: any = {
      status_etapa: { _neq: "Arquivado" }, // Exemplo: Não trazer lixo antigo
    };

    // Restrição por perfil: tipos de demanda permitidos (admin/sem config = todos).
    const demandAccess = await getCurrentDemandAccess();
    if (demandAccess.allowedTipos !== null) {
      // Lista vazia → _in [""] garante zero resultados (perfil sem tipos liberados).
      filter.tipo_demanda = {
        _in: demandAccess.allowedTipos.length > 0 ? demandAccess.allowedTipos : ["__none__"],
      };
    }

    // Filtro por Setor
    if (setorId && setorId !== "all") {
      filter.setor_responsavel = { _eq: Number(setorId) };
    }

    // Filtro por Busca (Nome ou CPF)
    if (search) {
      filter.atendimento_pai = {
        beneficiaria: {
          _or: [
            { nome_completo: { _icontains: search } },
            { cpf: { _contains: search } },
          ],
        },
      };
    }

    const tramitacoes = await directus.request(
      readItems("tramitacoes", {
        fields: [
          "id",
          "status_etapa",
          "tipo_demanda",
          "data_recebimento",
          "setor_responsavel.nome",
          "atendimento_pai.id",
          "atendimento_pai.prioridade_id.nome",
          "atendimento_pai.beneficiaria.nome_completo",
          "atendimento_pai.beneficiaria.cpf",
        ],
        filter,
        sort: ["-data_recebimento"],
        limit: 100, // Traz os 100 mais relevantes do filtro atual
      }),
    );

    const cards: KanbanCard[] = tramitacoes.map((t: any) => ({
      id: t.id,
      status_etapa: t.status_etapa || StatusEtapa.AGUARDANDO,
      tipo_demanda: t.tipo_demanda || "Geral",
      data_recebimento: t.data_recebimento,
      setor_nome: t.setor_responsavel?.nome || "Geral",
      prioridade: t.atendimento_pai?.prioridade_id?.nome || "Normal",
      beneficiaria: {
        nome: t.atendimento_pai?.beneficiaria?.nome_completo || "Desconhecida",
        cpf: t.atendimento_pai?.beneficiaria?.cpf || "",
      },
      atendimento_id: t.atendimento_pai?.id,
    }));

    return { success: true, data: cards };
  } catch (error) {
    console.error("Erro ao buscar kanban:", error);
    return { success: false, error: "Falha ao carregar quadro." };
  }
}

/**
 * O id vem do cliente: sem conferir o tipo, um perfil restrito movia ou
 * excluía demandas de tipos que nem consegue ver no quadro.
 */
async function demandaAcessivel(id: number): Promise<boolean> {
  const access = await getCurrentDemandAccess();
  if (access.allowedTipos === null) return true;
  try {
    const t = (await directus.request(readItem("tramitacoes", id, { fields: ["tipo_demanda"] }))) as {
      tipo_demanda?: string | null;
    };
    return tipoDemandaPermitido(access, t?.tipo_demanda);
  } catch {
    return false;
  }
}

export async function updateTramitacaoStatus(id: number, novoStatus: string) {
  await assertAccess("tramitacoes");
  if (!(await demandaAcessivel(id))) {
    return { success: false, error: "Seu perfil não tem acesso a este tipo de demanda." };
  }
  try {
    await directus.request(
      updateItem("tramitacoes", id, { status_etapa: novoStatus }),
    );
    revalidatePath("/tramitacoes");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Erro ao mover card." };
  }
}

export async function getSetoresOptions() {
  await assertAccess("tramitacoes");
  try {
    const setores = await directus.request(
      readItems("setores", { fields: ["id", "nome"], limit: -1 }),
    );
    return setores;
  } catch (e) {
    return [];
  }
}

// Status de etapa configuráveis (config_status_etapa) → colunas do Kanban.
export async function getStatusEtapasOptions() {
  await assertAccess("tramitacoes");
  try {
    const status = await directus.request(
      readItems("config_status_etapa", { fields: ["id", "nome"], sort: ["id"], limit: -1 }),
    );
    return status;
  } catch (e) {
    return [];
  }
}

export async function deleteTramitacao(id: number) {
  await assertAccess("tramitacoes");
  if (!(await demandaAcessivel(id))) {
    return { success: false, error: "Seu perfil não tem acesso a este tipo de demanda." };
  }
  try {
    await directus.request(deleteItem("tramitacoes", id));
    revalidatePath("/tramitacoes");
    return { success: true, message: "Demanda excluída com sucesso!" };
  } catch (error) {
    console.error("Erro ao excluir tramitação:", error);
    return { success: false, error: "Erro ao excluir demanda." };
  }
}
