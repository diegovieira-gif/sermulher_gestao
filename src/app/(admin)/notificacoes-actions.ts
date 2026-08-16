"use server";

import { readItems, readMe, updateItem } from "@directus/sdk";
import { getDirectusAdmin, getDirectusClient } from "@/lib/directus";
import { assertAuthenticated } from "@/lib/permissions";
import type { NotificacaoRegistro } from "@/lib/notificacoes";

/**
 * Notificações do usuário logado (o sino do cabeçalho).
 *
 * A leitura resolve o destinatário a partir da SESSÃO, nunca de um parâmetro:
 * aceitar um id vindo do cliente permitiria ler a caixa de outra pessoa. A
 * policy do Directus também filtra por `$CURRENT_USER`, então há duas camadas.
 */

const COLLECTION = "notificacoes";
const LIMITE = 30;

async function usuarioAtual(): Promise<string | null> {
  try {
    const client = await getDirectusClient({ requireAuth: true });
    const me = (await client.request(readMe({ fields: ["id"] }))) as { id?: string };
    return me?.id ?? null;
  } catch {
    return null;
  }
}

export async function getMinhasNotificacoes(): Promise<{
  itens: NotificacaoRegistro[];
  naoLidas: number;
}> {
  await assertAuthenticated();
  const meuId = await usuarioAtual();
  if (!meuId) return { itens: [], naoLidas: 0 };

  try {
    // Token admin com filtro explícito pelo id da sessão: a coleção não é
    // legível para o token do usuário fora do Studio, e assim o sino funciona
    // igual para todos os perfis.
    const client = getDirectusAdmin();
    const itens = (await client.request(
      readItems(COLLECTION, {
        filter: {
          destinatario: { _eq: meuId },
          cancelada_em: { _null: true },
          // Avisos agendados para o futuro ainda não devem aparecer.
          _or: [
            { agendada_para: { _null: true } },
            { agendada_para: { _lte: new Date().toISOString() } },
          ],
        },
        fields: ["id", "tipo", "titulo", "mensagem", "link", "lida_em", "date_created"],
        sort: ["-date_created"],
        limit: LIMITE,
      }),
    )) as unknown as NotificacaoRegistro[];

    return {
      itens,
      naoLidas: itens.filter((n) => !n.lida_em).length,
    };
  } catch (error) {
    console.error("[notificacoes] falha ao listar:", error);
    return { itens: [], naoLidas: 0 };
  }
}

export async function marcarComoLida(id: number): Promise<{ success: boolean }> {
  await assertAuthenticated();
  const meuId = await usuarioAtual();
  if (!meuId) return { success: false };

  try {
    const client = getDirectusAdmin();

    // Confere a titularidade antes de escrever: sem isto, um id arbitrário
    // marcaria como lida a notificação de outra pessoa.
    const alvo = (await client.request(
      readItems(COLLECTION, {
        filter: { id: { _eq: id }, destinatario: { _eq: meuId } },
        fields: ["id"],
        limit: 1,
      }),
    )) as Array<{ id: number }>;

    if (alvo.length === 0) return { success: false };

    await client.request(
      updateItem(COLLECTION, id, { lida_em: new Date().toISOString() }),
    );
    return { success: true };
  } catch (error) {
    console.error("[notificacoes] falha ao marcar como lida:", error);
    return { success: false };
  }
}

export async function marcarTodasComoLidas(): Promise<{ success: boolean }> {
  await assertAuthenticated();
  const meuId = await usuarioAtual();
  if (!meuId) return { success: false };

  try {
    const client = getDirectusAdmin();
    const pendentes = (await client.request(
      readItems(COLLECTION, {
        filter: { destinatario: { _eq: meuId }, lida_em: { _null: true } },
        fields: ["id"],
        limit: -1,
      }),
    )) as Array<{ id: number }>;

    const agora = new Date().toISOString();
    await Promise.all(
      pendentes.map((n) =>
        client.request(updateItem(COLLECTION, n.id, { lida_em: agora })),
      ),
    );
    return { success: true };
  } catch (error) {
    console.error("[notificacoes] falha ao marcar todas:", error);
    return { success: false };
  }
}
