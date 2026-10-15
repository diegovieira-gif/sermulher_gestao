"use server";

import { readItem, readItems, updateItem } from "@directus/sdk";
import { revalidatePath } from "next/cache";
import { getDirectusClient } from "@/lib/directus";
import { assertAdmin } from "@/lib/permissions";
import { buscarCidadaosHub } from "@/lib/consulta-cpf";
import {
  combinarCandidatos,
  consultasDaFicha,
  lerSugestoes,
  type FichaSemCpf,
  type SugestoesCpf,
} from "@/lib/busca-cpf";

/**
 * Tela "Localizar CPF": fichas sem CPF, busca no Hub de Dados e confirmação
 * por uma pessoa da equipe. Só administradoras — cada busca fica registrada
 * na auditoria do Hub em nome da SERMULHER, com nome e telefone da pesquisada.
 * As escritas usam a sessão de quem confirma (fica em user_updated).
 */

export type FichaLocalizar = FichaSemCpf & { sugestoes: SugestoesCpf | null };

const CAMPOS = ["id", "nome_completo", "telefone", "data_nascimento", "cpf_sugestoes"];
const SEM_CPF = { _or: [{ cpf: { _null: true } }, { cpf: { _empty: true } }] };

function paraFicha(r: Record<string, unknown>): FichaLocalizar {
  return {
    id: Number(r.id),
    nome_completo: (r.nome_completo as string) ?? "",
    telefone: (r.telefone as string) ?? "",
    data_nascimento: (r.data_nascimento as string) ?? "",
    sugestoes: lerSugestoes(r.cpf_sugestoes),
  };
}

/** Fichas sem CPF que têm por onde buscar (telefone ou nascimento). */
export async function listarFichasSemCpf(): Promise<
  { success: true; data: FichaLocalizar[] } | { success: false; error: string }
> {
  await assertAdmin();
  try {
    const client = await getDirectusClient({ requireAuth: true });
    const linhas = (await client.request(
      readItems("beneficiarias", {
        fields: CAMPOS,
        filter: {
          _and: [
            SEM_CPF,
            {
              _or: [
                { telefone: { _nnull: true, _nempty: true } },
                { data_nascimento: { _nnull: true } },
              ],
            },
          ],
        },
        sort: ["nome_completo"],
        limit: -1,
      }),
    )) as Record<string, unknown>[];
    return { success: true, data: linhas.map(paraFicha) };
  } catch (error) {
    console.error("listarFichasSemCpf:", error);
    return { success: false, error: "Não foi possível carregar as fichas." };
  }
}

/** Busca no Hub os candidatos de CPF de uma ficha e guarda na própria ficha. */
export async function buscarCpfDaFicha(
  id: number,
): Promise<{ success: true; data: FichaLocalizar } | { success: false; error: string }> {
  await assertAdmin();
  try {
    const client = await getDirectusClient({ requireAuth: true });
    const r = (await client.request(readItem("beneficiarias", id, { fields: [...CAMPOS, "cpf"] }))) as Record<string, unknown>;
    if (String(r.cpf ?? "").replace(/\D/g, "").length === 11) {
      return { success: false, error: "Esta ficha já tem CPF." };
    }
    const ficha = paraFicha(r);
    const consultas = consultasDaFicha(ficha);
    if (!consultas.length) {
      return { success: false, error: "A ficha precisa de pelo menos dois destes: nome, telefone, nascimento." };
    }
    const resultados = [];
    for (const c of consultas) {
      const res = await buscarCidadaosHub(c.filtros);
      if (!res.ok) return { success: false, error: res.erro };
      resultados.push({ rotulo: c.rotulo, data: res.data, truncado: res.truncado });
    }
    const sugestoes = combinarCandidatos(ficha, resultados);
    await client.request(updateItem("beneficiarias", id, { cpf_sugestoes: sugestoes }));
    revalidatePath("/mulheres/beneficiarias/localizar-cpf");
    return { success: true, data: { ...ficha, sugestoes } };
  } catch (error) {
    console.error("buscarCpfDaFicha:", error);
    return { success: false, error: "Não foi possível buscar o CPF." };
  }
}

/** Grava o CPF confirmado (tem de ser um dos candidatos achados). */
export async function confirmarCpf(
  id: number,
  cpf: string,
): Promise<{ success: true } | { success: false; error: string }> {
  await assertAdmin();
  const digitos = String(cpf ?? "").replace(/\D/g, "");
  if (digitos.length !== 11) return { success: false, error: "CPF inválido." };
  try {
    const client = await getDirectusClient({ requireAuth: true });
    const r = (await client.request(readItem("beneficiarias", id, { fields: ["id", "cpf", "cpf_sugestoes"] }))) as Record<string, unknown>;
    if (String(r.cpf ?? "").replace(/\D/g, "").length === 11) {
      return { success: false, error: "Esta ficha já tem CPF." };
    }
    const sug = lerSugestoes(r.cpf_sugestoes);
    if (!sug?.candidatos.some((c) => c.cpf === digitos)) {
      return { success: false, error: "Este CPF não está entre os candidatos achados para a ficha." };
    }
    // Mesmo CPF em outra ficha = a mesma mulher cadastrada duas vezes.
    const outra = (await client.request(
      readItems("beneficiarias", {
        fields: ["id", "nome_completo"],
        filter: { _and: [{ cpf: { _eq: digitos } }, { id: { _neq: id } }] },
        limit: 1,
      }),
    )) as { id: number; nome_completo: string }[];
    if (outra[0]) {
      return {
        success: false,
        error: `Este CPF já está na ficha de ${outra[0].nome_completo} (nº ${outra[0].id}). Pode ser cadastro duplicado.`,
      };
    }
    await client.request(updateItem("beneficiarias", id, { cpf: digitos, cpf_sugestoes: null }));
    revalidatePath("/mulheres/beneficiarias/localizar-cpf");
    revalidatePath("/mulheres/beneficiarias");
    return { success: true };
  } catch (error) {
    console.error("confirmarCpf:", error);
    return { success: false, error: "Não foi possível gravar o CPF." };
  }
}

/** Nenhum candidato é a mulher da ficha: marca para não oferecer de novo. */
export async function descartarSugestoes(
  id: number,
): Promise<{ success: true } | { success: false; error: string }> {
  await assertAdmin();
  try {
    const client = await getDirectusClient({ requireAuth: true });
    const r = (await client.request(readItem("beneficiarias", id, { fields: ["cpf_sugestoes"] }))) as Record<string, unknown>;
    const sug = lerSugestoes(r.cpf_sugestoes);
    if (!sug) return { success: true };
    await client.request(updateItem("beneficiarias", id, { cpf_sugestoes: { ...sug, situacao: "descartada" } }));
    revalidatePath("/mulheres/beneficiarias/localizar-cpf");
    return { success: true };
  } catch (error) {
    console.error("descartarSugestoes:", error);
    return { success: false, error: "Não foi possível descartar." };
  }
}
