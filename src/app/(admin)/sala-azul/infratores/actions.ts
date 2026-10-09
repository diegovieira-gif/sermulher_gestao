"use server";

import { directus } from "@/lib/directus";
import { createItem, deleteItem, readItems, updateItem } from "@directus/sdk";
import { revalidatePath } from "next/cache";
import { InsertInfrator, insertInfratorSchema } from "./schemas";
import { assertAccess } from "@/lib/permissions";
import { somenteDigitos } from "@/lib/utils";
import {
  consultarCpfSiged,
  nascimentoDoSiged,
  telefoneDoSiged,
} from "@/lib/siged";

/** Autor já cadastrado com este CPF (ignorando o próprio, na edição). */
async function autorComCpf(cpf: string, ignorarId?: number) {
  const filtro: Record<string, unknown> = { cpf: { _eq: cpf } };
  if (ignorarId) filtro.id = { _neq: ignorarId };
  const achados = (await directus.request(
    readItems("infratores", { filter: filtro, fields: ["id", "nome_completo"], limit: 1 }),
  )) as { id: number; nome_completo: string }[];
  return achados[0] ?? null;
}

/**
 * CPF digitado no cadastro de autor, como no de beneficiária: primeiro
 * confere se o autor já está na Sala Azul (evita ficha dupla), depois busca
 * nome, nascimento e telefone na rede municipal (SIGED).
 */
export async function consultarCpfAutor(cpf: string, ignorarId?: number): Promise<
  | { success: true; existente: { id: number; nome_completo: string } | null; dados: { nome_completo: string; data_nascimento: string; telefone: string } | null }
  | { success: false; error: string }
> {
  await assertAccess("sala-azul");
  const limpo = somenteDigitos(cpf);
  if (limpo.length !== 11) return { success: false, error: "CPF deve ter 11 dígitos." };
  try {
    const existente = await autorComCpf(limpo, ignorarId);
    if (existente) return { success: true, existente, dados: null };
    const r = await consultarCpfSiged(limpo);
    if (!r.success) return { success: false, error: r.error };
    const d = r.data;
    return {
      success: true,
      existente: null,
      dados: d
        ? {
            nome_completo: (d.userName || "").trim(),
            data_nascimento: nascimentoDoSiged(d.userBorn),
            telefone: telefoneDoSiged(d.userPhone1),
          }
        : null,
    };
  } catch (error) {
    console.error("Erro ao consultar CPF do autor:", error);
    return { success: false, error: "Não foi possível consultar o CPF." };
  }
}

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
    return { success: false, error: validation.error.issues[0]?.message || "Dados inválidos" };
  }

  // Separa campos virtuais. O payload sai do dado VALIDADO — o objeto cru do
  // cliente podia levar campos extras (ex.: tipos_agressao_lista) ao Directus.
  const { id, tipos_agressao_ids, telefone, ...rest } = validation.data;

  // Monta payload para o Directus
  try {
    // Mesmo CPF não vira duas fichas de autor.
    const duplicado = await autorComCpf(rest.cpf, id);
    if (duplicado) {
      return {
        success: false,
        error: `Este CPF já está cadastrado para ${duplicado.nome_completo} (nº ${duplicado.id}).`,
      };
    }

    // Telefone só em dígitos (a máscara é da tela), dentro do JSON `contato`
    // — preservando outras chaves que a ficha já tenha.
    let contatoAtual: Record<string, unknown> = {};
    if (id) {
      const [atual] = (await directus.request(
        readItems("infratores", { filter: { id: { _eq: id } }, fields: ["contato"], limit: 1 }),
      )) as { contato?: unknown }[];
      if (atual?.contato && typeof atual.contato === "object") contatoAtual = { ...(atual.contato as Record<string, unknown>) };
    }
    const fone = somenteDigitos(telefone);
    if (fone) contatoAtual.telefone = fone;
    else delete contatoAtual.telefone;

    const payload = {
      ...rest,
      // O Directus recusa "" em campo date.
      data_nascimento: rest.data_nascimento || null,
      contato: Object.keys(contatoAtual).length ? contatoAtual : null,
    };

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