"use server";

import { createItem, readItems, readMe, readUsers, updateItem } from "@directus/sdk";
import { getDirectusAdmin, getDirectusClient } from "@/lib/directus";
import { assertAdmin, assertAuthenticated } from "@/lib/permissions";
import {
  LIMIAR_CONCLUSAO,
  mesclarTrechos,
  percentualAssistido,
  progressoDoCurso,
  type Trecho,
} from "@/lib/curso-sigma";

/**
 * Curso Sigma: as vídeo-aulas do SIGMA e o progresso de cada usuária.
 *
 * As coleções não são liberadas para nenhum perfil no Directus: tudo passa
 * pelo token administrativo, e a usuária vem SEMPRE da sessão (readMe), nunca
 * de um parâmetro — senão daria para gravar ou ler o progresso de outra.
 */

const AULAS = "curso_sigma_aulas";
const PROGRESSO = "curso_sigma_progresso";

export type AulaCurso = {
  id: number;
  codigo: string;
  modulo: string;
  titulo: string;
  descricao: string | null;
  duracao_segundos: number;
  temCapa: boolean;
};

export type ProgressoAula = {
  percentual: number;
  posicao_segundos: number;
  concluida: boolean;
  trechos: Trecho[];
};

type ProgressoRow = {
  id: number;
  aula: number;
  usuario?: string;
  trechos: Trecho[] | null;
  posicao_segundos: number | null;
  percentual: number | null;
  concluida: boolean | number | null;
  date_updated?: string | null;
};

async function usuarioAtual(): Promise<string | null> {
  try {
    const client = await getDirectusClient({ requireAuth: true });
    const me = (await client.request(readMe({ fields: ["id"] }))) as { id?: string };
    return me?.id ?? null;
  } catch {
    return null;
  }
}

async function aulasPublicadas() {
  const admin = getDirectusAdmin();
  const linhas = (await admin.request(
    readItems(AULAS, {
      filter: { publicada: { _eq: true } },
      fields: ["id", "codigo", "modulo", "titulo", "descricao", "duracao_segundos", "capa", "ordem"],
      sort: ["ordem", "codigo"],
      limit: -1,
    }),
  )) as Array<Omit<AulaCurso, "temCapa"> & { capa: string | null }>;
  return linhas.map(({ capa, ...a }) => ({ ...a, duracao_segundos: Number(a.duracao_segundos) || 0, temCapa: !!capa }));
}

/** Aulas publicadas e o progresso da usuária logada em cada uma. */
export async function getCurso(): Promise<
  | { success: true; aulas: AulaCurso[]; progresso: Record<string, ProgressoAula> }
  | { success: false; error: string }
> {
  await assertAuthenticated();
  const eu = await usuarioAtual();
  if (!eu) return { success: false, error: "Não foi possível identificar a sua sessão. Entre de novo." };

  try {
    const aulas = await aulasPublicadas();
    const linhas = (await getDirectusAdmin().request(
      readItems(PROGRESSO, {
        filter: { usuario: { _eq: eu } },
        fields: ["id", "aula", "trechos", "posicao_segundos", "percentual", "concluida"],
        limit: -1,
      }),
    )) as ProgressoRow[];

    const progresso: Record<string, ProgressoAula> = {};
    for (const l of linhas) {
      const chave = String(l.aula);
      const anterior = progresso[chave];
      // linhas repetidas (gravação simultânea) somam os trechos
      const trechos = mesclarTrechos(anterior?.trechos, l.trechos ?? []);
      const duracao = aulas.find((a) => a.id === l.aula)?.duracao_segundos ?? 0;
      const percentual = Math.max(percentualAssistido(trechos, duracao), Number(l.percentual) || 0, anterior?.percentual ?? 0);
      progresso[chave] = {
        trechos,
        percentual,
        posicao_segundos: Number(l.posicao_segundos) || 0,
        concluida: percentual >= LIMIAR_CONCLUSAO || l.concluida === true || l.concluida === 1,
      };
    }
    return { success: true, aulas, progresso };
  } catch (error) {
    console.error("Erro ao carregar o Curso Sigma:", error);
    return { success: false, error: "Não foi possível carregar o curso agora." };
  }
}

/**
 * Registra o que a usuária assistiu de uma aula. Os trechos são SOMADOS aos já
 * gravados (nunca substituem), então um envio atrasado ou repetido não apaga
 * progresso.
 */
export async function registrarProgresso(
  aulaId: number,
  trechosNovos: Trecho[],
  posicao: number,
): Promise<{ success: true; percentual: number; concluida: boolean } | { success: false; error: string }> {
  await assertAuthenticated();
  const eu = await usuarioAtual();
  if (!eu) return { success: false, error: "Sessão expirada." };
  if (!Number.isInteger(aulaId) || !Array.isArray(trechosNovos) || trechosNovos.length > 500) {
    return { success: false, error: "Dados de progresso inválidos." };
  }

  const admin = getDirectusAdmin();
  try {
    const [aula] = (await admin.request(
      readItems(AULAS, {
        filter: { _and: [{ id: { _eq: aulaId } }, { publicada: { _eq: true } }] },
        fields: ["id", "duracao_segundos"],
        limit: 1,
      }),
    )) as Array<{ id: number; duracao_segundos: number }>;
    if (!aula) return { success: false, error: "Aula não encontrada." };
    const duracao = Number(aula.duracao_segundos) || 0;

    // trecho além da duração vem de relógio errado: corta
    const recebidos = mesclarTrechos(trechosNovos).map(
      ([a, b]) => [Math.min(a, duracao), Math.min(b, duracao)] as Trecho,
    );

    const existentes = (await admin.request(
      readItems(PROGRESSO, {
        filter: { _and: [{ usuario: { _eq: eu } }, { aula: { _eq: aulaId } }] },
        fields: ["id", "trechos", "concluida", "percentual"],
        sort: ["id"],
        limit: -1,
      }),
    )) as ProgressoRow[];

    const trechos = mesclarTrechos(recebidos, ...existentes.map((e) => e.trechos ?? []));
    const percentual = Math.max(
      percentualAssistido(trechos, duracao),
      ...existentes.map((e) => Number(e.percentual) || 0),
    );
    const jaConcluida = existentes.some((e) => e.concluida === true || e.concluida === 1);
    const concluida = jaConcluida || percentual >= LIMIAR_CONCLUSAO;
    const dados = {
      trechos,
      percentual,
      concluida,
      posicao_segundos: Math.max(0, Math.min(Number(posicao) || 0, duracao)),
      ...(concluida && !jaConcluida ? { concluida_em: new Date().toISOString() } : {}),
    };

    if (existentes[0]) await admin.request(updateItem(PROGRESSO, existentes[0].id, dados));
    else await admin.request(createItem(PROGRESSO, { usuario: eu, aula: aulaId, ...dados }));

    return { success: true, percentual, concluida };
  } catch (error) {
    console.error("Erro ao registrar progresso do Curso Sigma:", error);
    return { success: false, error: "Não foi possível salvar o progresso." };
  }
}

export type ProgressoEquipe = {
  id: string;
  nome: string;
  email: string;
  perfil: string;
  percentual: number;
  concluidas: number;
  total: number;
  ultimaAtividade: string | null;
};

/** Progresso de cada usuária ativa no curso (só administradoras). */
export async function getProgressoEquipe(): Promise<
  { success: true; data: ProgressoEquipe[] } | { success: false; error: string }
> {
  await assertAdmin();
  const admin = getDirectusAdmin();
  try {
    const [aulas, usuarios, linhas] = await Promise.all([
      aulasPublicadas(),
      admin.request(
        readUsers({
          filter: { status: { _eq: "active" } },
          fields: ["id", "first_name", "last_name", "email", "role.name"],
          sort: ["first_name"],
          limit: -1,
        }),
      ) as Promise<Array<{ id: string; first_name: string | null; last_name: string | null; email: string | null; role: { name?: string } | null }>>,
      admin.request(
        readItems(PROGRESSO, {
          fields: ["usuario", "aula", "percentual", "date_updated"],
          limit: -1,
        }),
      ) as Promise<ProgressoRow[]>,
    ]);

    const ids = aulas.map((a) => a.id);
    const porUsuario = new Map<string, { percentuais: Map<string, number>; ultima: string | null }>();
    for (const l of linhas) {
      if (!l.usuario) continue;
      const u = porUsuario.get(l.usuario) ?? { percentuais: new Map(), ultima: null };
      const chave = String(l.aula);
      u.percentuais.set(chave, Math.max(u.percentuais.get(chave) ?? 0, Number(l.percentual) || 0));
      if (l.date_updated && (!u.ultima || l.date_updated > u.ultima)) u.ultima = l.date_updated;
      porUsuario.set(l.usuario, u);
    }

    const data = usuarios.map((u) => {
      const p = porUsuario.get(u.id);
      const curso = progressoDoCurso(ids, p?.percentuais ?? new Map());
      return {
        id: u.id,
        nome: [u.first_name, u.last_name].filter(Boolean).join(" ") || u.email || "—",
        email: u.email ?? "",
        perfil: u.role?.name ?? "—",
        ...curso,
        ultimaAtividade: p?.ultima ?? null,
      };
    });
    data.sort((a, b) => b.percentual - a.percentual || a.nome.localeCompare(b.nome));
    return { success: true, data };
  } catch (error) {
    console.error("Erro ao carregar progresso da equipe:", error);
    return { success: false, error: "Não foi possível carregar o progresso da equipe." };
  }
}
