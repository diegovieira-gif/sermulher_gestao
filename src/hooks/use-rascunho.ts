"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";

/**
 * Rascunho automático de formulário em `localStorage`.
 *
 * Os formulários grandes (beneficiária, CRAM, atendimento) são preenchidos
 * durante um atendimento presencial, muitas vezes com a mulher na frente da
 * técnica. Uma sessão expirada, uma aba fechada sem querer ou uma queda de
 * energia perdiam TUDO. Este hook:
 *
 * 1. Salva os valores do formulário (debounce de 1s) enquanto a pessoa digita;
 * 2. Ao montar, detecta rascunho anterior e o expõe para a UI oferecer
 *    recuperação (nunca restaura sozinho — a pessoa decide);
 * 3. Avisa antes de fechar/recarregar a aba com alterações não salvas;
 * 4. `limpar()` deve ser chamado após o submit bem-sucedido.
 *
 * Privacidade: o rascunho contém dados pessoais e fica na máquina local.
 * Por isso ele é apagado no submit, no descarte e automaticamente após
 * VALIDADE_MS — não é um histórico, é uma rede de segurança curta.
 */

const PREFIXO = "sigma:rascunho:";
const DEBOUNCE_MS = 1000;
const VALIDADE_MS = 24 * 60 * 60 * 1000;

interface RascunhoSalvo {
  salvoEm: number;
  valores: unknown;
}

export interface Rascunho {
  /** Há rascunho anterior disponível para recuperar. */
  disponivel: boolean;
  /** Quando o rascunho disponível foi salvo (Date) — null se não há. */
  salvoEm: Date | null;
  /** Aplica o rascunho ao formulário e fecha a oferta. */
  recuperar: () => void;
  /** Descarta o rascunho e fecha a oferta. */
  descartar: () => void;
  /** Apaga o rascunho (chamar após submit bem-sucedido). */
  limpar: () => void;
}

export function useRascunho<T extends FieldValues>(
  form: UseFormReturn<T>,
  chave: string,
  ativo = true,
): Rascunho {
  const storageKey = PREFIXO + chave;
  const [pendente, setPendente] = useState<RascunhoSalvo | null>(null);
  // Evita que o autosave grave por cima do rascunho antes de a pessoa decidir.
  const decidiuRef = useRef(false);

  // Detecção na montagem (uma vez por chave).
  useEffect(() => {
    if (!ativo) return;
    decidiuRef.current = false;
    setPendente(null);
    try {
      const bruto = localStorage.getItem(storageKey);
      if (!bruto) return;
      const salvo = JSON.parse(bruto) as RascunhoSalvo;
      if (!salvo?.salvoEm || Date.now() - salvo.salvoEm > VALIDADE_MS) {
        localStorage.removeItem(storageKey);
        return;
      }
      setPendente(salvo);
    } catch {
      localStorage.removeItem(storageKey);
    }
  }, [storageKey, ativo]);

  // Autosave com debounce enquanto os valores mudam.
  useEffect(() => {
    if (!ativo) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const sub = form.watch(() => {
      // Só grava depois de alguma interação e depois da decisão sobre o
      // rascunho anterior (se houver).
      if (!form.formState.isDirty) return;
      if (pendente && !decidiuRef.current) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        try {
          const registro: RascunhoSalvo = {
            salvoEm: Date.now(),
            valores: form.getValues(),
          };
          localStorage.setItem(storageKey, JSON.stringify(registro));
        } catch {
          // localStorage cheio/indisponível: o autosave é melhor-esforço.
        }
      }, DEBOUNCE_MS);
    });
    return () => {
      sub.unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, [form, storageKey, ativo, pendente]);

  // Aviso ao fechar/recarregar com alterações não salvas.
  useEffect(() => {
    if (!ativo) return;
    const handler = (e: BeforeUnloadEvent) => {
      if (form.formState.isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [form, ativo]);

  const recuperar = useCallback(() => {
    if (!pendente) return;
    decidiuRef.current = true;
    // keepDefaultValues: os valores voltam como "sujos" — o submit envia tudo
    // e o beforeunload continua protegendo.
    form.reset(pendente.valores as T, { keepDefaultValues: true });
    setPendente(null);
  }, [form, pendente]);

  const descartar = useCallback(() => {
    decidiuRef.current = true;
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    setPendente(null);
  }, [storageKey]);

  const limpar = useCallback(() => {
    decidiuRef.current = true;
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    setPendente(null);
  }, [storageKey]);

  return {
    disponivel: pendente !== null,
    salvoEm: pendente ? new Date(pendente.salvoEm) : null,
    recuperar,
    descartar,
    limpar,
  };
}
