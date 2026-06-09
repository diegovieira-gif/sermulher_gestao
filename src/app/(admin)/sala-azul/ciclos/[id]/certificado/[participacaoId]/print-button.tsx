"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 shadow transition-colors font-medium"
    >
      <Printer className="h-4 w-4" />
      <span>Imprimir / Salvar PDF</span>
    </button>
  );
}