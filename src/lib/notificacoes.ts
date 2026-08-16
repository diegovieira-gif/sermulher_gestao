import "server-only";
import { createItem, readItems, updateItem } from "@directus/sdk";
import { getDirectusAdmin } from "@/lib/directus";
import type { TipoNotificacao } from "@/lib/notificacoes-formato";

// Regras de agendamento e texto vivem num módulo puro, testável sem servidor.
export {
  calcularLembrete,
  descreverQuando,
  type TipoNotificacao,
} from "@/lib/notificacoes-formato";

/**
 * Fila de notificações.
 *
 * Escrever aqui é o que significa "notificar". Os canais — sino, e-mail,
 * WhatsApp — são consumidores desta fila, não o contrário. A separação existe
 * porque os avisos precisam poder ser CANCELADOS: escalar alguém agenda um
 * lembrete para a véspera, e se a pessoa sair da equipe antes disso, o
 * lembrete tem de morrer. Com envio direto isso seria impossível.
 *
 * A escrita usa o token administrativo de propósito: notificar é uma ação do
 * sistema em nome de terceiros (uma usuária cria aviso PARA OUTRA), e a policy
 * de aplicação não concede `create` nesta coleção. Quem chama estas funções já
 * passou pela sua própria checagem de acesso.
 */

export interface NovaNotificacao {
  /** UUID do usuário do Directus que receberá o aviso. */
  destinatario: string;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  /** Rota interna para onde o aviso leva (ex.: "/eventos"). */
  link?: string;
  /** Registro de origem — permite cancelar os avisos dele depois. */
  referencia?: { colecao: string; id: string | number };
  /**
   * Quando enviar. Ausente/null = imediatamente. Data futura = aguarda o
   * vencimento (é assim que o lembrete de véspera funciona sem agendador
   * próprio).
   */
  agendadaPara?: Date | null;
}

export interface NotificacaoRegistro {
  id: number;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  link: string | null;
  lida_em: string | null;
  date_created: string;
}

const COLLECTION = "notificacoes";

/**
 * Enfileira avisos. Falha de notificação NUNCA derruba a operação que a
 * originou — escalar alguém precisa funcionar mesmo que o aviso não saia.
 * Por isso o erro é registrado e engolido.
 */
export async function enfileirar(itens: NovaNotificacao[]): Promise<void> {
  if (itens.length === 0) return;

  const client = getDirectusAdmin();

  await Promise.all(
    itens.map(async (item) => {
      try {
        await client.request(
          createItem(COLLECTION, {
            destinatario: item.destinatario,
            tipo: item.tipo,
            titulo: item.titulo,
            mensagem: item.mensagem,
            link: item.link ?? null,
            referencia_colecao: item.referencia?.colecao ?? null,
            referencia_id:
              item.referencia?.id !== undefined ? String(item.referencia.id) : null,
            agendada_para: item.agendadaPara
              ? item.agendadaPara.toISOString()
              : null,
            // O sino lê da própria fila, então o canal "app" já nasce entregue.
            canais: { app: { enviado_em: new Date().toISOString() } },
          }),
        );
      } catch (error) {
        console.error("[notificacoes] falha ao enfileirar:", error);
      }
    }),
  );
}

/**
 * Cancela avisos ainda não enviados de um registro de origem.
 *
 * É o que impede a notificação de virar mentira: retirar alguém da equipe
 * precisa matar o lembrete de véspera que estava agendado. Só afeta o que
 * ainda não saiu — aviso já entregue não se desfaz.
 */
export async function cancelarPendentes(
  colecao: string,
  id: string | number,
): Promise<void> {
  try {
    const client = getDirectusAdmin();
    const pendentes = (await client.request(
      readItems(COLLECTION, {
        filter: {
          referencia_colecao: { _eq: colecao },
          referencia_id: { _eq: String(id) },
          cancelada_em: { _null: true },
          agendada_para: { _nnull: true },
        },
        fields: ["id", "canais"],
        limit: -1,
      }),
    )) as Array<{ id: number; canais: Record<string, unknown> | null }>;

    const agora = new Date().toISOString();
    await Promise.all(
      pendentes
        // Já enviado por algum canal externo não é mais cancelável.
        .filter((n) => {
          const c = n.canais || {};
          return !c.email && !c.whatsapp;
        })
        .map((n) =>
          client.request(updateItem(COLLECTION, n.id, { cancelada_em: agora })),
        ),
    );
  } catch (error) {
    console.error("[notificacoes] falha ao cancelar pendentes:", error);
  }
}

