/**
 * Cálculos puros dos relatórios (Indicadores, RMA) e do Dashboard.
 *
 * Ficam fora dos arquivos "use server" porque esses só podem exportar funções
 * assíncronas — e porque assim são testados sem Directus (tests/unit).
 */

import { limitesDoMes } from "@/lib/datas";

/**
 * Limites de um mês para campos `dateTime` do Directus (hora de PAREDE, sem
 * fuso — ex.: `atendimentos.data_abertura`, `tramitacoes.data_recebimento`).
 *
 * Use `_gte inicio` e `_lt fimExclusivo`. Com `_between [dia 1, último dia]`
 * o limite superior vira "último dia 00:00" e tudo o que foi registrado no
 * último dia do mês sumia dos indicadores.
 */
export function limitesDoMesDateTime(ano: number, mes: number) {
  const proxAno = mes === 12 ? ano + 1 : ano;
  const proxMes = mes === 12 ? 1 : mes + 1;
  return {
    inicio: `${limitesDoMes(ano, mes).inicio}T00:00:00`,
    fimExclusivo: `${limitesDoMes(proxAno, proxMes).inicio}T00:00:00`,
  };
}

/** Filtro Directus `{ _gte, _lt }` do mês para um campo `dateTime`. */
export function filtroMesDateTime(ano: number, mes: number) {
  const { inicio, fimExclusivo } = limitesDoMesDateTime(ano, mes);
  return { _gte: inicio, _lt: fimExclusivo };
}

/**
 * Idade completa em `referencia` ("AAAA-MM-DD…"), comparando só o calendário
 * (sem `new Date`, que desloca a data de nascimento um dia para trás no fuso
 * de Brasília). `null` quando a data falta ou é ilegível.
 */
export function idadeEm(
  dataNascimento: string | null | undefined,
  referencia: string,
): number | null {
  const n = String(dataNascimento ?? "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  const r = String(referencia ?? "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!n || !r) return null;
  let anos = Number(r[1]) - Number(n[1]);
  const mesDia = (m: RegExpMatchArray) => Number(m[2]) * 100 + Number(m[3]);
  if (mesDia(r) < mesDia(n)) anos--;
  return anos >= 0 ? anos : null;
}

export const FAIXAS_ETARIAS = [
  "Menor de 18 (<18)",
  "Jovem (18-29)",
  "Adulta (30-59)",
  "Idosa (60+)",
  "Não informada",
] as const;
export type FaixaEtaria = (typeof FAIXAS_ETARIAS)[number];

/**
 * Faixa etária do perfil demográfico. Menores de 18 têm faixa própria (antes
 * entravam em 18-29) e quem está sem data de nascimento conta como "Não
 * informada" (antes simplesmente desaparecia do total).
 */
export function faixaEtaria(idade: number | null): FaixaEtaria {
  if (idade === null) return "Não informada";
  if (idade < 18) return "Menor de 18 (<18)";
  if (idade < 30) return "Jovem (18-29)";
  if (idade < 60) return "Adulta (30-59)";
  return "Idosa (60+)";
}
