"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import {
  TEMA_PADRAO,
  aplicarTema,
  guardarTema,
  lerTemaGuardado,
  resolverTema,
  type Tema,
  type TemaResolvido,
} from "@/lib/tema";

/**
 * ALTERNADOR DE TEMA — claro, escuro e sistema, os três sempre à vista.
 *
 * Porte do `AlternadorDeTema.tsx` da Trilha. A diferença é só de tokens: lá
 * `--maq-*`, aqui os do shadcn (`border`, `muted`, `card`…). Mora no Header,
 * num espaço que já é dele.
 *
 * ┌─ POR QUE TRÊS BOTÕES E NÃO UM QUE ALTERNA ───────────────────────────────┐
 * │ Um botão que cicla esconde o estado atual: a pessoa clica e descobre     │
 * │ para onde foi. Com três, o estado É a tela — e o leitor de tela anuncia  │
 * │ "pressionado" no que está valendo, sem rótulo dinâmico.                  │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─ POR QUE UM DEPÓSITO EXTERNO, E NÃO `useState` + `useEffect` ────────────┐
 * │ O tema mora no `localStorage`, no `matchMedia` e na classe do `<html>` — │
 * │ três coisas fora do React. `useSyncExternalStore` é feito para isso, e   │
 * │ resolve de graça o servidor não ter nenhuma das três: o instantâneo de   │
 * │ servidor é "ainda não sei", e nenhum botão é marcado até saber.          │
 * │                                                                          │
 * │ O depósito é de MÓDULO: o alternador e o `ToasterTematico` consomem o    │
 * │ mesmo, então o ouvinte do sistema é um só e os dois trocam juntos.       │
 * └──────────────────────────────────────────────────────────────────────────┘
 */

const OPCOES: { valor: Tema; rotulo: string; descricao: string; Icone: typeof Sun }[] = [
  { valor: "claro", rotulo: "Claro", descricao: "Usar o tema claro", Icone: Sun },
  { valor: "escuro", rotulo: "Escuro", descricao: "Usar o tema escuro", Icone: Moon },
  { valor: "sistema", rotulo: "Sistema", descricao: "Seguir o tema do sistema", Icone: Monitor },
];

type Instantaneo = { escolha: Tema; resolvido: TemaResolvido | null };

const NO_SERVIDOR: Instantaneo = { escolha: TEMA_PADRAO, resolvido: null };

let instantaneo: Instantaneo = NO_SERVIDOR;
let lido = false;
let ouvindoOSistema = false;
const ouvintes = new Set<() => void>();

/**
 * Recalcula e devolve o instantâneo. A identidade do objeto só muda quando o
 * VALOR muda — objeto novo a cada chamada faria o React acusar "getSnapshot
 * should be cached" e entrar em laço de renderização.
 */
function recalcular(): Instantaneo {
  const escolha = lerTemaGuardado();
  const resolvido = resolverTema(
    escolha,
    window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
  if (instantaneo.escolha !== escolha || instantaneo.resolvido !== resolvido) {
    instantaneo = { escolha, resolvido };
  }
  return instantaneo;
}

function noCliente(): Instantaneo {
  if (!lido) {
    lido = true;
    recalcular();
  }
  return instantaneo;
}

function avisar() {
  for (const ouvinte of ouvintes) ouvinte();
}

function assinar(aoMudar: () => void) {
  ouvintes.add(aoMudar);

  /*
    O ouvinte do sistema fica sempre ligado e a decisão é reavaliada dentro
    dele — senão trocar para "sistema" no meio da visita não voltaria a
    responder ao SO sem recarregar a página.
  */
  if (!ouvindoOSistema) {
    ouvindoOSistema = true;
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      recalcular();
      if (instantaneo.resolvido) aplicarTema(instantaneo.resolvido);
      avisar();
    });
  }

  return () => {
    ouvintes.delete(aoMudar);
  };
}

export function useTema() {
  const estado = useSyncExternalStore(assinar, noCliente, () => NO_SERVIDOR);

  const escolher = useCallback((novo: Tema) => {
    guardarTema(novo);
    recalcular();
    if (instantaneo.resolvido) aplicarTema(instantaneo.resolvido);
    avisar();
  }, []);

  return { escolha: estado.escolha, resolvido: estado.resolvido, escolher };
}

export function AlternadorDeTema({ className = "" }: { className?: string }) {
  const { escolha, resolvido, escolher } = useTema();
  /*
    Antes da hidratação o servidor não sabe qual está valendo — e marcar o
    botão errado por um instante é pior do que não marcar nenhum, porque o
    leitor de tela já anunciou. `montado` só libera o `aria-pressed`.
  */
  const montado = resolvido !== null;

  return (
    <div
      role="group"
      aria-label="Tema da página"
      className={`inline-flex items-center gap-0.5 rounded-full border border-border bg-muted p-0.5 ${className}`}
    >
      {OPCOES.map(({ valor, rotulo, descricao, Icone }) => {
        const ativo = montado && escolha === valor;
        return (
          <button
            key={valor}
            type="button"
            onClick={() => escolher(valor)}
            aria-label={descricao}
            aria-pressed={montado ? ativo : undefined}
            title={rotulo}
            /* `size-8` = 32px: acima do alvo mínimo de 24×24 (WCAG 2.5.8 AA). */
            className={`inline-flex size-8 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              ativo
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icone className="size-4" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
