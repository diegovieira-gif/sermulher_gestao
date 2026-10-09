/**
 * Regras de agendamento e texto das notificações.
 *
 * Módulo puro de propósito: sem `server-only` e sem acesso ao Directus, para
 * poder ser testado sem subir nada. A lógica aqui é a que erra em silêncio —
 * um lembrete agendado para o passado dispara na varredura seguinte e avisa
 * "amanhã tem evento" de um evento que já passou.
 */

import { dataEmBrasilia, formatarDataHora } from "./datas";

export type TipoNotificacao =
  | "escala_evento"
  | "lembrete_evento"
  | "remocao_evento"
  | "alteracao_evento";

/** Valor com fuso explícito ("Z" ou "+hh:mm") = instante; sem fuso = hora de parede. */
const TEM_FUSO = /[zZ]$|[+-]\d{2}:?\d{2}$/;

/**
 * Data do evento no calendário de Brasília, "AAAA-MM-DD".
 *
 * `data_inicio` é dateTime do Directus: hora de parede, sem fuso — já É a hora
 * de Brasília. Passar isso por `new Date()` interpretaria no fuso do processo,
 * e num servidor em UTC o evento "andaria" 3 horas.
 */
function diaDoEvento(dataEvento: string | Date): string | null {
  if (dataEvento instanceof Date) {
    return Number.isNaN(dataEvento.getTime()) ? null : dataEmBrasilia(dataEvento);
  }
  const s = String(dataEvento ?? "").trim();
  if (!s) return null;
  if (TEM_FUSO.test(s)) {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : dataEmBrasilia(d);
  }
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|[T ])/);
  if (!m) return null;
  // Rejeita "2026-02-31" e afins em vez de deixar o Date rolar para março.
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCDate() === +m[3] ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

/**
 * Data/hora do lembrete de véspera para um evento.
 *
 * 8h do dia anterior EM BRASÍLIA: cedo o suficiente para reorganizar o dia,
 * tarde o bastante para não chegar de madrugada. Montado com o fuso explícito
 * (-03:00) porque `setHours(8)` usa o fuso do processo — num container em UTC
 * o lembrete saía às 5h. Devolve `null` quando a véspera já passou — agendar
 * para o passado só geraria disparo imediato e confuso.
 */
export function calcularLembrete(
  dataEvento: string | Date,
  agora: Date = new Date(),
): Date | null {
  const dia = diaDoEvento(dataEvento);
  if (!dia) return null;

  const [a, m, d] = dia.split("-").map(Number);
  const vespera = new Date(Date.UTC(a, m - 1, d - 1)).toISOString().slice(0, 10);
  const lembrete = new Date(`${vespera}T08:00:00-03:00`);

  return lembrete.getTime() > agora.getTime() ? lembrete : null;
}

/**
 * Formata "16/08/2026 às 14:00" — ou só a data quando não há hora útil.
 *
 * Eventos antigos foram gravados sem horário (meia-noite); exibir "às 00:00"
 * passaria a impressão de um evento de madrugada. A hora é a de Brasília
 * (via `formatarDataHora`), qualquer que seja o fuso do processo.
 */
export function descreverQuando(valor?: string | null): string {
  if (!valor) return "data a confirmar";
  const texto = formatarDataHora(valor, "");
  if (!texto) return String(valor).slice(0, 10);

  const [data, hora] = texto.split(" ");
  return hora && hora !== "00:00" ? `${data} às ${hora}` : data;
}

/**
 * Houve mudança de data/hora entre o que está gravado e o que veio do form?
 *
 * O Directus devolve "2026-08-16T14:00:00" e o `<input type="datetime-local">`
 * envia "2026-08-16T14:00": comparar as strings cruas acusava mudança em TODA
 * edição e a equipe inteira recebia "a data mudou". Compara até os minutos.
 */
export function mudouDataHora(
  antes?: string | null,
  depois?: string | null,
): boolean {
  const norm = (v?: string | null) =>
    String(v ?? "").trim().replace(" ", "T").slice(0, 16);
  return norm(antes) !== norm(depois);
}

/** Local mudou? Ignora espaços nas pontas e nulo vs. vazio. */
export function mudouTexto(antes?: string | null, depois?: string | null): boolean {
  return (antes ?? "").trim() !== (depois ?? "").trim();
}

// --- Estado dos canais externos (campo JSON `canais`) ---------------------------
//
// Cada canal externo (email, whatsapp) é registrado em `canais` com um destes
// formatos:
//   { enviado_em }                         → entregue
//   { pulado, em }                         → não se aplica (sem e-mail, sem
//                                            consentimento, SMTP ausente...)
//   { erro, tentado_em, tentativas }       → falhou; será tentado de novo
//   { erro, tentado_em, tentativas, desistido_em } → falhou MAX_TENTATIVAS vezes
//
// Só os três primeiros estados "resolvidos" tiram o aviso da fila. Antes,
// qualquer objeto contava como resolvido — um erro passageiro do SMTP virava
// "entregue" para sempre, e o cancelamento achava que o aviso já tinha saído.

export const CANAIS_EXTERNOS = ["email", "whatsapp"] as const;
export type CanalExterno = (typeof CANAIS_EXTERNOS)[number];

export interface EstadoCanal {
  enviado_em?: string;
  pulado?: string;
  em?: string;
  erro?: string;
  tentado_em?: string;
  tentativas?: number;
  desistido_em?: string;
}

/** Tentativas antes de desistir de um canal que só falha. */
export const MAX_TENTATIVAS = 3;
/** Intervalo mínimo entre tentativas — um SMTP fora do ar por 5 min não esgota as 3. */
export const ESPERA_RETENTATIVA_MS = 10 * 60 * 1000;

function comoEstado(v: unknown): EstadoCanal | null {
  return v && typeof v === "object" ? (v as EstadoCanal) : null;
}

/** `canais` pode chegar como string JSON dependendo do driver; normaliza. */
export function lerCanais(v: unknown): Record<string, unknown> {
  if (!v) return {};
  if (typeof v === "string") {
    try {
      const p = JSON.parse(v);
      return p && typeof p === "object" ? p : {};
    } catch {
      return {};
    }
  }
  return typeof v === "object" ? (v as Record<string, unknown>) : {};
}

/** Saiu de fato por este canal. */
export function canalEntregue(v: unknown): boolean {
  return Boolean(comoEstado(v)?.enviado_em);
}

/** Nada mais a fazer neste canal: entregue, não se aplica ou desistimos. */
export function canalResolvido(v: unknown): boolean {
  const e = comoEstado(v);
  if (!e) return false;
  if (e.enviado_em || e.pulado || e.desistido_em) return true;
  return (e.tentativas ?? 0) >= MAX_TENTATIVAS;
}

/** Ainda não resolvido e já pode ser (re)tentado agora. */
export function canalPendenteAgora(v: unknown, agora: Date = new Date()): boolean {
  if (canalResolvido(v)) return false;
  const e = comoEstado(v);
  if (!e?.tentado_em) return true;
  const ultima = new Date(e.tentado_em).getTime();
  if (Number.isNaN(ultima)) return true;
  return agora.getTime() - ultima >= ESPERA_RETENTATIVA_MS;
}

/** O aviso inteiro já não tem nada a fazer nos canais externos. */
export function notificacaoResolvida(canais: unknown): boolean {
  const c = lerCanais(canais);
  return CANAIS_EXTERNOS.every((k) => canalResolvido(c[k]));
}

/** Há algum canal externo a processar nesta varredura? */
export function notificacaoPrecisaEnvio(canais: unknown, agora: Date = new Date()): boolean {
  const c = lerCanais(canais);
  return CANAIS_EXTERNOS.some((k) => canalPendenteAgora(c[k], agora));
}

/**
 * Pode cancelar? Só enquanto nenhum canal externo ENTREGOU — erro ou "pulado"
 * não contam como entrega, então o lembrete ainda deve morrer.
 */
export function notificacaoCancelavel(canais: unknown): boolean {
  const c = lerCanais(canais);
  return !CANAIS_EXTERNOS.some((k) => canalEntregue(c[k]));
}

export function estadoEnviado(agora: Date = new Date()): EstadoCanal {
  return { enviado_em: agora.toISOString() };
}

export function estadoPulado(motivo: string, agora: Date = new Date()): EstadoCanal {
  return { pulado: motivo, em: agora.toISOString() };
}

/** Registra mais uma falha; na MAX_TENTATIVAS-ésima, marca a desistência. */
export function estadoFalha(
  anterior: unknown,
  erro: string | undefined,
  agora: Date = new Date(),
): EstadoCanal {
  const e = comoEstado(anterior);
  // Registros antigos ({ erro, tentado_em } sem contador) contam como 1 tentativa.
  const ja = e?.tentativas ?? (e?.erro ? 1 : 0);
  const tentativas = ja + 1;
  const iso = agora.toISOString();
  return {
    erro: (erro || "falha desconhecida").slice(0, 200),
    tentado_em: iso,
    tentativas,
    ...(tentativas >= MAX_TENTATIVAS ? { desistido_em: iso } : {}),
  };
}

// --- Decisão por canal ----------------------------------------------------------

export type DecisaoCanal =
  | { acao: "enviar" }
  | { acao: "pular"; motivo: string }
  | { acao: "aguardar" };

/**
 * E-mail: sem endereço → pulado. Sem SMTP configurado → também pulado
 * ("smtp ausente"). Escolha consciente: SMTP ausente é condição do ambiente,
 * não do aviso, mas deixar o aviso pendente o mantinha na frente da fila para
 * sempre e travava os demais. O aviso continua no sino; quando o SMTP for
 * configurado, só os avisos NOVOS saem por e-mail — avisos velhos chegando
 * dias depois confundiriam mais do que ajudariam.
 */
export function decidirEmail(
  estado: unknown,
  ctx: { email?: string | null; smtp: boolean },
  agora: Date = new Date(),
): DecisaoCanal {
  if (!canalPendenteAgora(estado, agora)) return { acao: "aguardar" };
  if (!ctx.email || !ctx.email.trim()) return { acao: "pular", motivo: "sem e-mail" };
  if (!ctx.smtp) return { acao: "pular", motivo: "smtp ausente" };
  return { acao: "enviar" };
}

/**
 * WhatsApp: exige consentimento explícito, telefone válido e o GoWA
 * configurado. Mesma lógica do e-mail: o que não se aplica é pulado para não
 * represar a fila.
 */
export function decidirWhatsapp(
  estado: unknown,
  ctx: { consentimento: boolean; telefone?: string | null; gowa: boolean },
  agora: Date = new Date(),
): DecisaoCanal {
  if (!canalPendenteAgora(estado, agora)) return { acao: "aguardar" };
  if (!ctx.consentimento) return { acao: "pular", motivo: "sem consentimento" };
  if (!ctx.telefone || !ctx.telefone.trim()) return { acao: "pular", motivo: "sem telefone" };
  if (!numeroWhatsappValido(formatarNumeroWhatsapp(ctx.telefone))) {
    return { acao: "pular", motivo: "número inválido" };
  }
  if (!ctx.gowa) return { acao: "pular", motivo: "gowa ausente" };
  return { acao: "enviar" };
}

/**
 * Normaliza o número no mesmo padrão do disparo de campanhas.
 *
 * A regra do nono dígito não é capricho: contas de WhatsApp em DDDs >= 31
 * (Sergipe é 79) costumam estar registradas SEM o 9 extra, e o GoWA envia
 * para o JID exato que recebe — com o 9 sobrando, a mensagem não chega.
 */
export function formatarNumeroWhatsapp(telefone: string): string {
  let n = telefone.replace(/\D/g, "");
  if (n.length === 10 || n.length === 11) n = "55" + n;
  if (n.startsWith("55") && n.length === 13) {
    const ddd = parseInt(n.substring(2, 4), 10);
    if (n.charAt(4) === "9" && ddd >= 31) n = n.substring(0, 4) + n.substring(5);
  }
  return n;
}

export function numeroWhatsappValido(digitos: string): boolean {
  if (!/^55\d{10,11}$/.test(digitos)) return false;
  const ddd = parseInt(digitos.substring(2, 4), 10);
  return ddd >= 11 && ddd <= 99;
}
