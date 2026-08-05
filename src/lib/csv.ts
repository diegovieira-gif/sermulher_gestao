/**
 * Utilitário de exportação CSV no navegador — mesmo padrão do export de
 * beneficiárias: separador `;` (o Excel pt-BR usa vírgula como decimal) e
 * BOM UTF-8 para os acentos abrirem corretos no Excel.
 */

function formatarCelula(valor: string | number | null | undefined): string {
  if (valor === null || valor === undefined) return "";
  const texto = String(valor);
  if (/[";\n\r]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

export function montarCsv(linhas: (string | number | null | undefined)[][]): string {
  return linhas.map((linha) => linha.map(formatarCelula).join(";")).join("\r\n");
}

/** Dispara o download de um CSV montado a partir de linhas simples. */
export function baixarCsv(
  nomeArquivo: string,
  linhas: (string | number | null | undefined)[][],
): void {
  // "﻿" = BOM UTF-8, para o Excel reconhecer os acentos.
  const conteudo = "﻿" + montarCsv(linhas);
  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
