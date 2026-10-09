/**
 * Conversão das datas do calendário unificado para `Date` NO NAVEGADOR.
 *
 * Módulo puro (servidor, cliente e testes). O servidor devolve as datas como
 * texto de parede — "2026-08-16T14:00" ou "2026-03-20" — e quem monta o
 * `Date` é o navegador, com os componentes explícitos. Antes o servidor fazia
 * `new Date(...)`: o dateTime sem fuso era lido no fuso do processo e o
 * date-only como meia-noite UTC, e o calendário mostrava 14h como 11h/17h e
 * o dia 20 no dia 19, dependendo do fuso de cada máquina.
 */

// Caminho relativo: o módulo também é importado pelos testes unitários.
import { dataLocal, FUSO } from "../../../lib/datas";

/** Mesmo formato de `CalendarEvent`, mas com as datas como texto de parede. */
export type CalendarEventDTO = {
  id: string | number;
  title: string;
  /** "AAAA-MM-DDTHH:mm" (hora de Brasília) ou "AAAA-MM-DD" (dia inteiro). */
  start: string;
  end: string;
  allDay: boolean;
  type: "manual" | "escola" | "sala_azul";
  color: string;
  description?: string;
  status?: string;
};

export type CalendarEvent = Omit<CalendarEventDTO, "start" | "end"> & {
  start: Date;
  end: Date;
};

/**
 * Normaliza o que o Directus devolve para texto de parede.
 * - "2026-08-16T14:00:00" (dateTime) → "2026-08-16T14:00"
 * - "2026-03-20" (date) → "2026-03-20"
 * Devolve "" para valor ausente/irreconhecível.
 */
export function textoDeParede(valor: unknown): string {
  const m = String(valor ?? "").match(/^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2}))?/);
  if (!m) return "";
  return m[2] ? `${m[1]}T${m[2]}` : m[1];
}

/**
 * `Date` local com os MESMOS números do texto: 14:00 aparece 14:00 em
 * qualquer fuso. Só data → meio-dia local (não troca de dia em fuso nenhum).
 */
export function dateDeParede(texto: string): Date {
  const m = texto.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return dataLocal(texto);
  return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], 0);
}

export function paraCalendarEvent(dto: CalendarEventDTO): CalendarEvent {
  return {
    ...dto,
    start: dateDeParede(dto.start),
    end: dateDeParede(dto.end || dto.start),
  };
}

/**
 * "Agora" como hora de parede de Brasília, "AAAA-MM-DDTHH:mm:ss" — para
 * comparar com colunas `dateTime` (sem fuso). Comparar com o ISO em UTC
 * adiantava a situação dos eventos em 3 horas ("Encerrado" às 14h de um
 * evento que vai até as 17h).
 */
export function agoraDeParede(agora: Date = new Date()): string {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: FUSO,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
      .formatToParts(agora)
      .map((x) => [x.type, x.value]),
  );
  const hora = p.hour === "24" ? "00" : p.hour;
  return `${p.year}-${p.month}-${p.day}T${hora}:${p.minute}:${p.second}`;
}
