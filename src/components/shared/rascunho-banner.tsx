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
    <div className="flex flex-col gap-3 rounded-lg border border-alerta/40 bg-alerta/10 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <History className="mt-0.5 size-5 shrink-0 text-alerta" aria-hidden />
        <div className="text-sm">
          <p className="font-medium text-foreground">
            Há um preenchimento não salvo deste formulário
          </p>
          <p className="text-muted-foreground">
            Salvo automaticamente em {quando}. Deseja continuar de onde parou?
          </p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button
          type="button"
          size="sm"
          className="bg-alerta text-alerta-foreground hover:bg-alerta/90"
          onClick={rascunho.recuperar}
        >
          Recuperar
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-alerta/50 text-foreground hover:bg-alerta/15"
          onClick={rascunho.descartar}
        >
          <X className="mr-1 size-4" /> Descartar
        </Button>
      </div>
    </div>
  );
}
