/**
 * Cabeçalhos para servir, na origem do SIGMA, um arquivo enviado por usuária.
 *
 * Servir inline um SVG ou HTML na mesma origem do app é XSS: o script dentro
 * do arquivo roda com a sessão de quem abrir o link. Só tipos que o navegador
 * não executa (imagem raster, PDF, vídeo/áudio) vão inline; o resto é baixado.
 */

const INLINE = /^(image\/(png|jpe?g|gif|webp|avif)|application\/pdf|video\/(mp4|webm)|audio\/(mpeg|ogg|wav))$/i;

export function cabecalhosDeArquivo(tipo: string | null, disposicao: string | null): Headers {
  const contentType = (tipo || "application/octet-stream").split(";")[0].trim();
  const headers = new Headers();
  headers.set("X-Content-Type-Options", "nosniff");

  if (INLINE.test(contentType)) {
    headers.set("Content-Type", contentType);
    if (disposicao) headers.set("Content-Disposition", disposicao);
    // PDF usa o visualizador do navegador, que o sandbox bloquearia
    if (!/pdf$/i.test(contentType)) headers.set("Content-Security-Policy", "default-src 'none'; sandbox");
  } else {
    headers.set("Content-Type", "application/octet-stream");
    const nome = disposicao?.match(/filename\*?=([^;]+)/i)?.[0];
    headers.set("Content-Disposition", nome ? `attachment; ${nome}` : "attachment");
    headers.set("Content-Security-Policy", "default-src 'none'; sandbox");
  }
  return headers;
}

/** Tipos aceitos como imagem de campanha (o `file.type` vem do navegador). */
export const IMAGENS_ACEITAS = ["image/jpeg", "image/png", "image/webp", "image/gif"];
