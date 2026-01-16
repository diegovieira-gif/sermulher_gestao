"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 shadow transition-colors font-medium"
    >
      <Printer className="h-4 w-4" />
      <span>Imprimir / Salvar PDF</span>
    </button>
  );
}