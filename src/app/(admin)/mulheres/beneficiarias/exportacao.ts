/**
 * Exportação CSV das beneficiárias.
 *
 * O objetivo declarado é fidelidade: o arquivo precisa conter tudo o que está
 * gravado, de forma que sirva para conferência e para repor dados. Por isso os
 * valores saem em formato de MÁQUINA, não de leitura humana — booleanos como
 * `true`/`false` e datas em ISO, sem tradução. Um "Sim"/"Não" traduzido lê
 * melhor no Excel mas é ambíguo na volta.
 *
 * Chaves estrangeiras saem em DUAS colunas: o id (que é o que permite repor o
 * vínculo) e o nome (que é o que permite conferir sem consultar outra tabela).
 *
 * Módulo puro: sem I/O e sem React. Roda no servidor e no cliente.
 */

export interface ColunaExport {
  cabecalho: string;
  /** Caminho no registro; aceita aninhamento com ponto. */
  caminho: string;
}

/**
 * Ordem pensada para leitura: identificação, contato, endereço, dados sociais,
 * marcadores e, por último, auditoria.
 */
export const COLUNAS_EXPORT: ColunaExport[] = [
  { cabecalho: "id", caminho: "id" },

  { cabecalho: "nome_completo", caminho: "nome_completo" },
  { cabecalho: "nome_social", caminho: "nome_social" },
  { cabecalho: "cpf", caminho: "cpf" },
  { cabecalho: "data_nascimento", caminho: "data_nascimento" },

  { cabecalho: "telefone", caminho: "telefone" },
  { cabecalho: "telefone_validado", caminho: "telefone_validado" },
  { cabecalho: "email", caminho: "email" },
  { cabecalho: "melhor_turno_contato", caminho: "contato.melhor_turno_contato" },

  { cabecalho: "endereco_cep", caminho: "endereco.cep" },
  { cabecalho: "endereco_logradouro", caminho: "endereco.logradouro" },
  { cabecalho: "endereco_numero", caminho: "endereco.numero" },
  { cabecalho: "endereco_bairro", caminho: "endereco.bairro" },
  { cabecalho: "endereco_cidade", caminho: "endereco.cidade" },

  { cabecalho: "raca_cor_id", caminho: "raca_cor_id.id" },
  { cabecalho: "raca_cor_nome", caminho: "raca_cor_id.nome" },
  { cabecalho: "estado_civil_id", caminho: "estado_civil_id.id" },
  { cabecalho: "estado_civil_nome", caminho: "estado_civil_id.nome" },
  { cabecalho: "escolaridade_id", caminho: "escolaridade_id.id" },
  { cabecalho: "escolaridade_nome", caminho: "escolaridade_id.nome" },
  { cabecalho: "situacao_trabalho_id", caminho: "situacao_trabalho_id.id" },
  { cabecalho: "situacao_trabalho_nome", caminho: "situacao_trabalho_id.nome" },
  { cabecalho: "ubs_id", caminho: "ubs_id.id" },
  { cabecalho: "ubs_nome", caminho: "ubs_id.nome" },

  { cabecalho: "quantidade_filhos", caminho: "quantidade_filhos" },
  { cabecalho: "numero_cad_unico", caminho: "numero_cad_unico" },
  { cabecalho: "perfil_socioeconomico", caminho: "perfil_socioeconomico" },

  { cabecalho: "recebe_bolsa_familia", caminho: "recebe_bolsa_familia" },
  { cabecalho: "recebe_bpc", caminho: "recebe_bpc" },
  { cabecalho: "possui_medida_protetiva", caminho: "possui_medida_protetiva" },
  { cabecalho: "tags", caminho: "tags" },

  { cabecalho: "created_at", caminho: "created_at" },
  { cabecalho: "updated_at", caminho: "updated_at" },
  { cabecalho: "date_created", caminho: "date_created" },
  { cabecalho: "date_updated", caminho: "date_updated" },
  { cabecalho: "user_created", caminho: "user_created" },
  { cabecalho: "user_updated", caminho: "user_updated" },
];

/** Lê caminho com ponto, tolerando JSON serializado e M2O não expandido. */
function lerCaminho(registro: unknown, caminho: string): unknown {
  const partes = caminho.split(".");
  let atual: unknown = registro;

  for (let i = 0; i < partes.length; i++) {
    if (atual === null || atual === undefined) return undefined;

    // `contato` e `endereco` são colunas JSON e às vezes voltam como string.
    if (typeof atual === "string") {
      try {
        atual = JSON.parse(atual);
      } catch {
        return undefined;
      }
    }

    // M2O não expandido: o valor é o próprio id. Nesse caso `campo.id` deve
    // devolver o número, e `campo.nome` deve devolver vazio em vez de quebrar.
    if (typeof atual === "number") {
      return partes[i] === "id" ? atual : undefined;
    }

    if (typeof atual !== "object") return undefined;
    atual = (atual as Record<string, unknown>)[partes[i]];
  }

  return atual;
}

/**
 * Converte um valor para texto de célula, preservando fidelidade.
 *
 * Números passam como estão, inclusive os 1/0 que esta instância do Directus
 * devolve para colunas booleanas. Traduzi-los para "Sim"/"Não" leria melhor,
 * mas o arquivo existe para repor dados: o que está gravado é o que sai.
 */
export function formatarCelula(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  if (typeof valor === "boolean") return valor ? "true" : "false";
  if (Array.isArray(valor)) return valor.join("; ");
  if (typeof valor === "object") return JSON.stringify(valor);
  return String(valor);
}

/** Escapa uma célula para CSV: aspas, vírgulas e quebras de linha. */
export function escaparCsv(texto: string): string {
  return `"${texto.replace(/"/g, '""')}"`;
}

/**
 * Monta o CSV completo.
 *
 * Prefixa BOM (﻿) porque sem ele o Excel abre o arquivo em ANSI e os
 * acentos saem corrompidos — "Conceição" vira "ConceiÃ§Ã£o". É o motivo mais
 * comum de exportação "quebrada" reportada por quem abre no Excel.
 */
export function montarCsv(
  registros: unknown[],
  colunas: ColunaExport[] = COLUNAS_EXPORT,
): string {
  const cabecalho = colunas.map((c) => escaparCsv(c.cabecalho)).join(",");

  const linhas = registros.map((registro) =>
    colunas
      .map((coluna) => escaparCsv(formatarCelula(lerCaminho(registro, coluna.caminho))))
      .join(","),
  );

  return "﻿" + [cabecalho, ...linhas].join("\r\n");
}

/** Nome do arquivo com a data, para não sobrescrever exportações anteriores. */
export function nomeArquivoCsv(prefixo: string, data = new Date()): string {
  return `${prefixo}_${data.toISOString().slice(0, 10)}.csv`;
}
