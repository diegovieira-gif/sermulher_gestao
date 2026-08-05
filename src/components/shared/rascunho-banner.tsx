"use client";

import { History, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Rascunho } from "@/hooks/use-rascunho";

/**
 * Faixa de recuperação de rascunho: aparece no topo do formulário quando o
 * `useRascunho` encontra um preenchimento anterior não enviado.
 */
export function RascunhoBanner({ rascunho }: { rascunho: Rascunho }) {
  if (!rascunho.disponivel || !rascunho.salvoEm) return null;

  const quando = rascunho.salvoEm.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <History className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden />
        <div className="text-sm">
          <p className="font-medium text-amber-900">
            Há um preenchimento não salvo deste formulário
          </p>
          <p className="text-amber-800">
            Salvo automaticamente em {quando}. Deseja continuar de onde parou?
          </p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button
          type="button"
          size="sm"
          className="bg-amber-600 text-white hover:bg-amber-700"
          onClick={rascunho.recuperar}
        >
          Recuperar
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-amber-300 text-amber-800 hover:bg-amber-100"
          onClick={rascunho.descartar}
        >
          <X className="mr-1 size-4" /> Descartar
        </Button>
      </div>
    </div>
  );
}
