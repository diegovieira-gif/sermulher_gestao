/**
 * Regras de agendamento e texto das notificações.
 *
 * Módulo puro de propósito: sem `server-only` e sem acesso ao Directus, para
 * poder ser testado sem subir nada. A lógica aqui é a que erra em silêncio —
 * um lembrete agendado para o passado dispara na varredura seguinte e avisa
 * "amanhã tem evento" de um evento que já passou.
 */

export type TipoNotificacao =
  | "escala_evento"
  | "lembrete_evento"
  | "remocao_evento"
  | "alteracao_evento";

/**
 * Data/hora do lembrete de véspera para um evento.
 *
 * 8h do dia anterior: cedo o suficiente para reorganizar o dia, tarde o
 * bastante para não chegar de madrugada. Devolve `null` quando a véspera já
 * passou — agendar para o passado só geraria disparo imediato e confuso.
 */
export function calcularLembrete(dataEvento: string | Date): Date | null {
  const inicio =
    typeof dataEvento === "string" ? new Date(dataEvento) : dataEvento;
  if (Number.isNaN(inicio.getTime())) return null;

  const vespera = new Date(inicio);
  vespera.setDate(vespera.getDate() - 1);
  vespera.setHours(8, 0, 0, 0);

  return vespera.getTime() > Date.now() ? vespera : null;
}

/**
 * Formata "16/08/2026 às 14:00" — ou só a data quando não há hora útil.
 *
 * Eventos antigos foram gravados sem horário (meia-noite); exibir "às 00:00"
 * passaria a impressão de um evento de madrugada.
 */
export function descreverQuando(valor?: string | null): string {
  if (!valor) return "data a confirmar";
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return String(valor).slice(0, 10);

  const data = d.toLocaleDateString("pt-BR");
  const temHora = d.getHours() !== 0 || d.getMinutes() !== 0;
  return temHora
    ? `${data} às ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
    : data;
}
