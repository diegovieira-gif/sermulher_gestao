"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";

export type BeneficiariaOption = {
  id: number;
  nome_completo: string;
  cpf?: string;
};

interface BeneficiariaComboBoxProps {
  options: BeneficiariaOption[];
  value?: number;
  onValueChange: (value: number | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function BeneficiariaComboBox({
  options,
  value,
  onValueChange,
  placeholder = "Buscar beneficiária...",
  disabled = false,
}: BeneficiariaComboBoxProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Encontra a beneficiária selecionada
  const selectedBeneficiaria = options.find((opt) => opt.id === value);

  // Filtra opções baseado no termo de busca
  const filteredOptions = options.filter((opt) => {
    const search = searchTerm.toLowerCase();
    return (
      opt.nome_completo.toLowerCase().includes(search) ||
      (opt.cpf && opt.cpf.replace(/\D/g, "").includes(search))
    );
  });

  // Formata CPF para exibição
  const formatCPF = (cpf?: string) => {
    if (!cpf) return "";
    const cpfLimpo = cpf.replace(/\D/g, "");
    if (cpfLimpo.length !== 11) return cpf;
    return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setSearchTerm("");
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const handleSelect = (beneficiaria: BeneficiariaOption) => {
    onValueChange(beneficiaria.id);
    setOpen(false);
    setSearchTerm("");
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Input
          type="text"
          value={open ? searchTerm : selectedBeneficiaria?.nome_completo || ""}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            if (!searchTerm && selectedBeneficiaria) {
              setSearchTerm(selectedBeneficiaria.nome_completo);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => {
            setOpen(!open);
            if (!open && selectedBeneficiaria) {
              setSearchTerm(selectedBeneficiaria.nome_completo);
            }
          }}
          disabled={disabled}
          className="absolute right-0 top-0 h-full px-3 flex items-center justify-center"
        >
          <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {open && filteredOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-60 overflow-auto">
          {filteredOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleSelect(opt)}
              className={cn(
                "w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground flex items-center justify-between",
                value === opt.id && "bg-accent"
              )}
            >
              <div className="flex flex-col">
                <span className="font-medium">{opt.nome_completo}</span>
                {opt.cpf && (
                  <span className="text-xs text-muted-foreground">
                    CPF: {formatCPF(opt.cpf)}
                  </span>
                )}
              </div>
              {value === opt.id && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </button>
          ))}
        </div>
      )}

      {open && filteredOptions.length === 0 && searchTerm && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md p-3 text-sm text-muted-foreground">
          Nenhuma beneficiária encontrada
        </div>
      )}
    </div>
  );
}
