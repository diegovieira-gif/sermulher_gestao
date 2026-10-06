/**
 * O TEMA: claro, escuro, ou o que o sistema mandar.
 *
 * Porte do `lib/tema.ts` da Trilha (`trilha_inteligente`), que por sua vez é
 * porte do `site_oficial`. A lógica é a mesma; o que muda é o PADRÃO — ver
 * abaixo.
 *
 * ┌─ POR QUE A LÓGICA MORA AQUI, E NÃO NO COMPONENTE ────────────────────────┐
 * │ Ela é usada em DOIS lugares que não podem divergir: o componente React   │
 * │ e o script que roda ANTES da primeira pintura. Se os dois decidissem por │
 * │ conta própria, o dia em que a regra mudasse a página passaria a piscar   │
 * │ antes de assentar — e o sintoma apareceria só no navegador de alguém.    │
 * │                                                                          │
 * │ Por isso o script anti-flash é GERADO daqui (`SCRIPT_ANTI_FLASH`) e a    │
 * │ paridade entre os dois é testada em `tests/unit/tema.spec.ts`.           │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─ POR QUE O PADRÃO AINDA É "CLARO" (e não "sistema", como na Trilha) ─────┐
 * │ Em 10/2026 o SERMULHER ganhou a paleta escura, mas boa parte das telas   │
 * │ ainda pinta cores chumbadas (`bg-white`, `text-slate-500`…) que não      │
 * │ acompanham o tema. Com "sistema" de padrão, quem tem o Windows ou o      │
 * │ celular no escuro cairia direto em telas meio migradas sem ter pedido.   │
 * │                                                                          │
 * │ Então: só fica escuro quem ESCOLHE. Quando a migração das telas acabar,  │
 * │ basta trocar `TEMA_PADRAO` para "sistema" — o teste de paridade cobre o  │
 * │ script junto.                                                            │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─ POR QUE A ESCOLHA É SEMPRE GRAVADA ─────────────────────────────────────┐
 * │ A Trilha apaga a chave quando a pessoa volta ao padrão. Aqui não: como o │
 * │ padrão vai mudar, apagar "claro" hoje faria quem escolheu claro de       │
 * │ propósito ser arrastado para "sistema" no dia da troca. Chave ausente    │
 * │ significa só uma coisa — "nunca escolheu".                               │
 * └──────────────────────────────────────────────────────────────────────────┘
 */

export type Tema = "claro" | "escuro" | "sistema";
export type TemaResolvido = "claro" | "escuro";

/** Vale para quem nunca escolheu. Ver o quadro acima antes de trocar. */
export const TEMA_PADRAO: Tema = "claro";

/** Chave no `localStorage`. */
export const CHAVE_TEMA = "tema";

/** A classe que o Tailwind observa — ver `@custom-variant dark` no globals. */
export const CLASSE_ESCURO = "dark";

export function ehTema(valor: unknown): valor is Tema {
  return valor === "claro" || valor === "escuro" || valor === "sistema";
}

/**
 * A decisão, isolada de navegador e de React para poder ser testada.
 *
 * `sistemaEscuro` é o que a mídia `prefers-color-scheme: dark` respondeu.
 */
export function resolverTema(escolha: Tema, sistemaEscuro: boolean): TemaResolvido {
  if (escolha === "claro") return "claro";
  if (escolha === "escuro") return "escuro";
  return sistemaEscuro ? "escuro" : "claro";
}

/**
 * Lê a escolha guardada. Devolve o padrão para qualquer coisa estranha —
 * inclusive quando o `localStorage` LANÇA, o que acontece em janela anônima
 * com armazenamento bloqueado. Tema é conveniência: nunca derruba a página.
 */
export function lerTemaGuardado(): Tema {
  try {
    const bruto = window.localStorage.getItem(CHAVE_TEMA);
    return ehTema(bruto) ? bruto : TEMA_PADRAO;
  } catch {
    return TEMA_PADRAO;
  }
}

export function guardarTema(escolha: Tema): void {
  try {
    window.localStorage.setItem(CHAVE_TEMA, escolha);
  } catch {
    /* Sem persistência a troca ainda vale para esta visita. */
  }
}

export function aplicarTema(resolvido: TemaResolvido): void {
  document.documentElement.classList.toggle(CLASSE_ESCURO, resolvido === "escuro");
}

/**
 * O script que roda ANTES da primeira pintura, dentro do `<head>`.
 *
 * Sem ele a página nasceria clara e escureceria depois da hidratação: um
 * flash branco na cara de quem escolheu escuro. Por isso é `<script>` cru e
 * síncrono, e não `useEffect`. Fica minúsculo de propósito — atrasa a
 * primeira pintura de todo mundo.
 */
export const SCRIPT_ANTI_FLASH = `(function(){try{
var e=localStorage.getItem('${CHAVE_TEMA}');
if(e!=='claro'&&e!=='escuro'&&e!=='sistema')e='${TEMA_PADRAO}';
var d=e==='escuro'||(e==='sistema'&&window.matchMedia('(prefers-color-scheme: dark)').matches);
document.documentElement.classList.toggle('${CLASSE_ESCURO}',d);
}catch(_){}})();`;
