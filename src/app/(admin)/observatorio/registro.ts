import type { CollectionConfig } from "./types";

/**
 * Monta o que vai para o Directus a partir do formulário: só os campos da
 * configuração (o formulário de edição carrega o registro inteiro, com id,
 * datas de criação e a relação expandida), com os tipos que o banco espera.
 *
 * Devolve também os campos obrigatórios que ficaram vazios — o Directus os
 * recusaria com um erro genérico; aqui a tela pode dizer quais são.
 */
export function montarRegistro(
  config: CollectionConfig,
  dados: Record<string, unknown>,
): { payload: Record<string, unknown>; faltando: string[] } {
  const payload: Record<string, unknown> = {};
  const faltando: string[] = [];

  for (const campo of config.fields) {
    let valor = dados[campo.key];

    if (campo.type === "relation" && valor && typeof valor === "object") {
      valor = (valor as { id?: unknown }).id;
    }
    if (campo.type === "number") {
      valor = valor === "" || valor === null || valor === undefined ? null : Number(valor);
      if (typeof valor === "number" && !Number.isFinite(valor)) valor = null;
    } else if (campo.type === "boolean") {
      valor = valor === true || valor === "true" || valor === 1;
    } else if (typeof valor === "string") {
      valor = valor.trim();
      if (valor === "") valor = null;
    } else if (valor === undefined) {
      valor = null;
    }

    if (campo.required && (valor === null || valor === undefined)) faltando.push(campo.label);
    payload[campo.key] = valor;
  }

  // Períodos: a coleção ainda tem a coluna antiga `nome`, que o SIGMA
  // gravava. Mantida igual a `nome_periodo` para nada que a leia ficar vazio.
  if (config.name === "obser_periodos") payload.nome = payload.nome_periodo;

  return { payload, faltando };
}

/** Texto de uma célula da tabela. */
export function exibirValor(tipo: string, valor: unknown): string {
  if (valor === null || valor === undefined || valor === "") return "-";
  if (tipo === "boolean") return valor === true || valor === 1 ? "Sim" : "Não";
  if (tipo === "relation" && typeof valor === "object") {
    const v = valor as { nome_periodo?: string; id?: unknown };
    return v.nome_periodo || String(v.id ?? "-");
  }
  if (tipo === "date" && typeof valor === "string") {
    const [a, m, d] = valor.slice(0, 10).split("-");
    return d && m && a ? `${d}/${m}/${a}` : valor;
  }
  return String(valor);
}
