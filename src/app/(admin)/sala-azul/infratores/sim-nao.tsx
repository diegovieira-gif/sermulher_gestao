"use client";

import { cn } from "@/lib/utils";

/**
 * Escolha "( ) Sim ( ) Não" para campo booleano opcional.
 * `null` = não informado (nenhum marcado); clicar no marcado desmarca.
 */
export function SimNao({
  value,
  onChange,
  name,
}: {
  value: boolean | null | undefined;
  onChange: (v: boolean | null) => void;
  name: string;
}) {
  const opcoes: { rotulo: string; valor: boolean }[] = [
    { rotulo: "Sim", valor: true },
    { rotulo: "Não", valor: false },
  ];
  return (
    <div role="radiogroup" className="flex items-center gap-4 h-10">
      {opcoes.map((o) => {
        const marcado = value === o.valor;
        return (
          <label key={o.rotulo} className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name={name}
              checked={marcado}
              onChange={() => onChange(o.valor)}
              onClick={() => {
                if (marcado) onChange(null);
              }}
              className={cn("h-4 w-4 accent-purple-600 cursor-pointer")}
            />
            {o.rotulo}
          </label>
        );
      })}
    </div>
  );
}
