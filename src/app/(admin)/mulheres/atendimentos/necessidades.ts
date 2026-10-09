/**
 * `necessidades_sociais` e `necessidades_juridicas` (campos JSON no Directus)
 * convivem em dois formatos:
 *
 * - atual: TEXTO livre, digitado no textarea do formulário;
 * - legado: OBJETO/ARRAY (ex.: `{ "cesta_basica": true, "cras": "sim" }`),
 *   de cadastros antigos ou importados.
 *
 * Sem tratar os dois, o prontuário mostrava "Dados inválidos" para texto
 * (tentava `JSON.parse`), o relatório quebrava o React ao renderizar um
 * objeto e o formulário exibia "[object Object]" ao editar um registro legado.
 *
 * Módulo puro — servidor, cliente e testes.
 */

export type Necessidades =
  | { tipo: "texto"; texto: string }
  | { tipo: "lista"; itens: string[] };

/** "cesta_basica" → "Cesta Basica" */
function rotulo(chave: string): string {
  return chave.replace(/_/g, " ").replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

function valorLegivel(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function itensDe(valor: object): string[] {
  if (Array.isArray(valor)) {
    return valor.map(valorLegivel).map((s) => s.trim()).filter(Boolean);
  }
  const itens: string[] = [];
  for (const [chave, v] of Object.entries(valor)) {
    // Marcado como não/vazio = a necessidade não existe; não polui a lista.
    if (v === false || v === null || v === undefined || v === "" || v === 0) continue;
    // Checkbox marcado: basta o nome da necessidade.
    if (v === true || v === 1) {
      itens.push(rotulo(chave));
      continue;
    }
    itens.push(`${rotulo(chave)}: ${valorLegivel(v)}`);
  }
  return itens;
}

/** Interpreta o valor salvo; `null` quando não há nada a mostrar. */
export function lerNecessidades(valor: unknown): Necessidades | null {
  if (valor === null || valor === undefined) return null;
  if (typeof valor === "string") {
    const texto = valor.trim();
    if (!texto) return null;
    // Um objeto/array serializado como string também é formato legado.
    if (/^[[{]/.test(texto)) {
      try {
        const obj = JSON.parse(texto);
        if (obj && typeof obj === "object") return lerNecessidades(obj);
      } catch {
        // não era JSON — segue como texto livre
      }
    }
    return { tipo: "texto", texto: valor };
  }
  if (typeof valor === "object") {
    const itens = itensDe(valor);
    return itens.length ? { tipo: "lista", itens } : null;
  }
  return { tipo: "texto", texto: String(valor) };
}

/**
 * Texto para o textarea do formulário: o legado vira uma linha por item, para
 * que salvar o formulário grave texto legível em vez de "[object Object]".
 */
export function necessidadesParaTexto(valor: unknown): string {
  const lido = lerNecessidades(valor);
  if (!lido) return "";
  return lido.tipo === "texto" ? lido.texto : lido.itens.join("\n");
}
