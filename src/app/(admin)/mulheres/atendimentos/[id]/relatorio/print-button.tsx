"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 shadow-sm transition-colors"
    >
      <Printer className="h-4 w-4" /> 
      <span>Imprimir</span>
    </button>
  );
}