/**
 * Fonte do SIGMA para o Hub de Dados Municipais (Comitê de Transformação
 * Digital). Contrato: "Documentação de padronização de webservice para
 * centralização de dados referente a munícipes" — dois GETs com Bearer:
 *
 *   GET {url}           → { status, qtd_pagina, qtd_usuarios }
 *   GET {url}/{pagina}  → { status, pagina, paginas_restantes, qtd, data[] }
 *
 * ┌─ MINIMIZAÇÃO (LGPD) ──────────────────────────────────────────────────────┐
 * │ Estar nesta lista já revela que a mulher foi atendida pela Secretaria da  │
 * │ Mulher — dado sensível, e endereço é o que um agressor procura. Por isso: │
 * │ • só CPF, nome, nascimento, nome da mãe e data da última alteração —      │
 * │   SEM endereço, bairro, telefone ou e-mail;                               │
 * │ • fora quem tem medida protetiva (na ficha ou em qualquer atendimento);   │
 * │ • fora quem não tem CPF válido (o Hub descartaria de qualquer forma);     │
 * │ • autores da Sala Azul NUNCA entram.                                      │
 * │ Mudar isso é decisão da gestão + encarregado de dados, não do código.     │
 * └───────────────────────────────────────────────────────────────────────────┘
 *
 * Módulo puro (sem Directus): as rotas em app/api/hub/cidadaos buscam os
 * registros e usam estas funções para filtrar, paginar e formatar.
 */

import { booleano } from "./datas";

export const HUB_TAMANHO_PAGINA = 100;
export const HUB_FUSO = "America/Maceio";

export type BeneficiariaHub = {
  id: number;
  cpf?: string | null;
  nome_completo?: string | null;
  nome_mae?: string | null;
  data_nascimento?: string | null;
  possui_medida_protetiva?: unknown;
  date_created?: string | null;
  date_updated?: string | null;
};

export type CidadaoHub = {
  cpf: string;
  nome: string;
  data_nascimento: string;
  nome_mae: string;
  ultima_atualizacao: string;
  qtd_vinculos_familiares: number;
  vinculos_familiares: never[];
};

/** CPF só com dígitos, se tiver exatamente 11; senão null. */
export function cpfDoHub(valor: string | null | undefined): string | null {
  const d = String(valor ?? "").replace(/\D/g, "");
  return d.length === 11 ? d : null;
}

/**
 * Instante (ISO do Directus) → "AAAA-MM-DD HH:MM:SS" no horário de Brasília.
 * Sem data válida → "" (nunca "agora": isso faria o Hub regravar tudo).
 */
export function ultimaAtualizacaoHub(valor: string | null | undefined): string {
  if (!valor) return "";
  const s = String(valor);
  // Timestamp sem fuso, vindo do Directus/SQLite, está em UTC.
  const d = new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(s) ? s : s.replace(" ", "T") + "Z");
  if (Number.isNaN(d.getTime())) return "";
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: HUB_FUSO,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(d)
      .map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`;
}

/**
 * Quem pode ir ao Hub, em ordem estável (por id) — a mesma lista gera a
 * contagem e as páginas, então `qtd_pagina` sempre bate com o que existe.
 * CPF repetido em duas fichas vai uma vez só (a mais antiga).
 */
export function elegiveisHub(
  beneficiarias: BeneficiariaHub[],
  comMedidaProtetiva: Set<number>,
): BeneficiariaHub[] {
  const vistos = new Set<string>();
  return [...beneficiarias]
    .sort((a, b) => a.id - b.id)
    .filter((b) => {
      const cpf = cpfDoHub(b.cpf);
      if (!cpf || vistos.has(cpf)) return false;
      if (booleano(b.possui_medida_protetiva) || comMedidaProtetiva.has(b.id)) return false;
      vistos.add(cpf);
      return true;
    });
}

export function paraCidadaoHub(b: BeneficiariaHub): CidadaoHub {
  return {
    cpf: cpfDoHub(b.cpf) ?? "",
    nome: (b.nome_completo ?? "").trim(),
    data_nascimento: /^\d{4}-\d{2}-\d{2}/.test(b.data_nascimento ?? "")
      ? String(b.data_nascimento).slice(0, 10)
      : "",
    nome_mae: (b.nome_mae ?? "").trim(),
    ultima_atualizacao: ultimaAtualizacaoHub(b.date_updated || b.date_created),
    qtd_vinculos_familiares: 0, // o SIGMA não registra vínculos com CPF
    vinculos_familiares: [],
  };
}

export function contagemHub(total: number) {
  return {
    status: "success" as const,
    qtd_pagina: Math.ceil(total / HUB_TAMANHO_PAGINA),
    qtd_usuarios: total,
  };
}

/** Resposta de uma página; fora do intervalo → "not found" com lista vazia. */
export function paginaHub(elegiveis: BeneficiariaHub[], pagina: number) {
  const qtdPagina = Math.ceil(elegiveis.length / HUB_TAMANHO_PAGINA);
  if (!Number.isInteger(pagina) || pagina < 1 || pagina > qtdPagina) {
    return { status: "not found" as const, message: "Página não encontrada", qtd: 0, data: [] as CidadaoHub[] };
  }
  const inicio = (pagina - 1) * HUB_TAMANHO_PAGINA;
  const data = elegiveis.slice(inicio, inicio + HUB_TAMANHO_PAGINA).map(paraCidadaoHub);
  return {
    status: "success" as const,
    pagina,
    paginas_restantes: qtdPagina - pagina,
    qtd: data.length,
    data,
  };
}
