/**
 * Converte texto que pode conter HTML (relatos antigos vinham de um editor
 * rico) em texto puro, para ser exibido pelo React — que escapa tudo.
 *
 * Nunca use `dangerouslySetInnerHTML` com texto digitado por usuária: um
 * `<img onerror=…>` num relato roda na sessão de quem abrir o prontuário,
 * inclusive de uma administradora.
 *
 * Módulo puro: usado em componentes de servidor e de cliente, e nos testes.
 */

const ENTIDADES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
};

export function htmlParaTexto(entrada: string | null | undefined): string {
  if (!entrada) return "";
  return (
    String(entrada)
      // blocos que eram invisíveis no editor também somem aqui
      .replace(/<(script|style)[\s\S]*?<\/\1\s*>/gi, "")
      // o que era quebra visual vira quebra de linha
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h[1-6]|tr)\s*>/gi, "\n")
      .replace(/<li[^>]*>/gi, "• ")
      // qualquer outra marcação sai
      .replace(/<[^>]*>/g, "")
      .replace(/&(amp|lt|gt|quot|#39|apos|nbsp);/g, (m) => ENTIDADES[m] ?? m)
      .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}
