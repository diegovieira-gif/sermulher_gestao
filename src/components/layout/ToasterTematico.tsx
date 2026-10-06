"use client";

import { Toaster } from "sonner";
import { useTema } from "@/components/layout/AlternadorDeTema";

/**
 * O `<Toaster>` do sonner, acompanhando o tema escolhido.
 *
 * O sonner não enxerga a classe `.dark` do `<html>`: sem `theme` ele segue só
 * o `prefers-color-scheme`, e um aviso podia sair claro numa tela escura (ou
 * o contrário, enquanto o padrão do app ainda é "claro").
 *
 * Antes da hidratação o tema ainda é desconhecido; "light" ali coincide com o
 * padrão atual e com o que o servidor pinta.
 */
export function ToasterTematico() {
  const { resolvido } = useTema();
  return (
    <Toaster
      position="top-right"
      richColors
      theme={resolvido === "escuro" ? "dark" : "light"}
    />
  );
}
