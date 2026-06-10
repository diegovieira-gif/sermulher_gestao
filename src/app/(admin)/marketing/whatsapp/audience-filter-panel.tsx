"use client";

import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BeneficiariaFilter } from "./actions";

export type ConfigOption = { id: number; nome: string };
export interface FilterOptions {
  racas: ConfigOption[];
  estadosCivis: ConfigOption[];
  escolaridades: ConfigOption[];
  situacoesTrabalho: ConfigOption[];
  bairros: ConfigOption[];
}

export const EMPTY_FILTER: BeneficiariaFilter = {
  busca: "",
  status: "",
  raca_cor_id: [],
  estado_civil_id: [],
  escolaridade_id: [],
  situacao_trabalho_id: [],
  bairro: [],
  recebe_bolsa_familia: null,
  recebe_bpc: null,
  possui_medida_protetiva: null,
  filhos_min: null,
  filhos_max: null,
  idade_min: null,
  idade_max: null,
  aniversariantes_hoje: false,
};

// Conta quantos critérios estão ativos no filtro (para resumos na UI).
export function countActiveFilters(f: BeneficiariaFilter): number {
  let n = 0;
  if (f.busca && f.busca.trim()) n++;
  if (f.status && f.status.trim()) n++;
  n += f.raca_cor_id?.length ? 1 : 0;
  n += f.estado_civil_id?.length ? 1 : 0;
  n += f.escolaridade_id?.length ? 1 : 0;
  n += f.situacao_trabalho_id?.length ? 1 : 0;
  n += f.bairro?.length ? 1 : 0;
  if (f.recebe_bolsa_familia === true || f.recebe_bolsa_familia === false) n++;
  if (f.recebe_bpc === true || f.recebe_bpc === false) n++;
  if (f.possui_medida_protetiva === true || f.possui_medida_protetiva === false) n++;
  if (typeof f.filhos_min === "number" || typeof f.filhos_max === "number") n++;
  if (typeof f.idade_min === "number" || typeof f.idade_max === "number") n++;
  if (f.aniversariantes_hoje) n++;
  return n;
}

type MultiField =
  | "raca_cor_id"
  | "estado_civil_id"
  | "escolaridade_id"
  | "situacao_trabalho_id"
  | "bairro";

interface Props {
  value: BeneficiariaFilter;
  onChange: (next: BeneficiariaFilter) => void;
  options: FilterOptions | null;
  loadingOptions?: boolean;
}

export function AudienceFilterPanel({ value, onChange, options, loadingOptions }: Props) {
  const patch = (p: Partial<BeneficiariaFilter>) => onChange({ ...value, ...p });

  const toggleId = (field: MultiField, id: number) => {
    const cur = (value[field] as number[]) || [];
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    patch({ [field]: next } as Partial<BeneficiariaFilter>);
  };

  const numOrNull = (v: string): number | null => {
    if (v.trim() === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const renderChipGroup = (label: string, field: MultiField, opts: ConfigOption[]) => {
    const selected = (value[field] as number[]) || [];
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</label>
          {selected.length > 0 && (
            <span className="text-[10px] text-purple-600 font-medium">{selected.length} selec.</span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {opts.length === 0 ? (
            <span className="text-[11px] text-slate-400">Sem opções</span>
          ) : (
            opts.map((o) => {
              const active = selected.includes(o.id);
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => toggleId(field, o.id)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] transition-colors",
                    active
                      ? "border-purple-300 bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50",
                  )}
                >
                  {o.nome}
                </button>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const renderTriState = (
    label: string,
    field: "recebe_bolsa_familia" | "recebe_bpc" | "possui_medida_protetiva",
  ) => {
    const val = value[field];
    const opt = (lbl: string, v: boolean | null) => (
      <button
        type="button"
        onClick={() => patch({ [field]: v } as Partial<BeneficiariaFilter>)}
        className={cn(
          "flex-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
          val === v ? "bg-purple-600 text-white" : "text-slate-600 hover:bg-slate-100",
        )}
      >
        {lbl}
      </button>
    );
    return (
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</label>
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-0.5">
          {opt("Qualquer", null)}
          {opt("Sim", true)}
          {opt("Não", false)}
        </div>
      </div>
    );
  };

  if (loadingOptions && !options) {
    return (
      <div className="flex items-center justify-center gap-2 p-6 text-xs text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando filtros...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Busca textual */}
      <div className="relative">
        <Input
          className="h-9"
          placeholder="Nome, telefone ou CPF..."
          value={value.busca || ""}
          onChange={(e) => patch({ busca: e.target.value })}
        />
      </div>

      {/* Aniversariantes de hoje (atalho) */}
      <button
        type="button"
        onClick={() => patch({ aniversariantes_hoje: !value.aniversariantes_hoje })}
        className={cn(
          "flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors",
          value.aniversariantes_hoje
            ? "border-purple-300 bg-purple-50 ring-1 ring-purple-300 dark:bg-purple-950/20"
            : "border-slate-200 hover:bg-slate-50",
        )}
      >
        <span className="flex flex-col">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            🎂 Aniversariantes de hoje
          </span>
          <span className="text-[11px] text-slate-500">
            Quem faz aniversário na data de execução
          </span>
        </span>
        <Checkbox checked={!!value.aniversariantes_hoje} className="pointer-events-none" />
      </button>

      {/* Situação cadastral */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Situação cadastral</label>
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-0.5">
          {[
            { lbl: "Todas", v: "" },
            { lbl: "Ativas", v: "ativa" },
            { lbl: "Arquivadas", v: "arquivada" },
          ].map((s) => (
            <button
              key={s.v}
              type="button"
              onClick={() => patch({ status: s.v })}
              className={cn(
                "flex-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                (value.status || "") === s.v ? "bg-purple-600 text-white" : "text-slate-600 hover:bg-slate-100",
              )}
            >
              {s.lbl}
            </button>
          ))}
        </div>
      </div>

      {/* Faixas numéricas */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Idade</label>
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              min={0}
              className="h-8"
              placeholder="mín"
              value={value.idade_min ?? ""}
              onChange={(e) => patch({ idade_min: numOrNull(e.target.value) })}
            />
            <span className="text-xs text-slate-400">a</span>
            <Input
              type="number"
              min={0}
              className="h-8"
              placeholder="máx"
              value={value.idade_max ?? ""}
              onChange={(e) => patch({ idade_max: numOrNull(e.target.value) })}
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nº de filhos</label>
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              min={0}
              className="h-8"
              placeholder="mín"
              value={value.filhos_min ?? ""}
              onChange={(e) => patch({ filhos_min: numOrNull(e.target.value) })}
            />
            <span className="text-xs text-slate-400">a</span>
            <Input
              type="number"
              min={0}
              className="h-8"
              placeholder="máx"
              value={value.filhos_max ?? ""}
              onChange={(e) => patch({ filhos_max: numOrNull(e.target.value) })}
            />
          </div>
        </div>
      </div>

      {/* Programas / proteção (tri-state) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {renderTriState("Bolsa Família", "recebe_bolsa_familia")}
        {renderTriState("BPC", "recebe_bpc")}
        {renderTriState("Medida protetiva", "possui_medida_protetiva")}
      </div>

      {/* Multi-seleções relacionais */}
      {options && (
        <div className="space-y-4">
          {renderChipGroup("Bairro", "bairro", options.bairros)}
          {renderChipGroup("Raça / Cor", "raca_cor_id", options.racas)}
          {renderChipGroup("Estado civil", "estado_civil_id", options.estadosCivis)}
          {renderChipGroup("Escolaridade", "escolaridade_id", options.escolaridades)}
          {renderChipGroup("Situação de trabalho", "situacao_trabalho_id", options.situacoesTrabalho)}
        </div>
      )}

      <p className="text-[10px] text-slate-400">
        Apenas beneficiárias com WhatsApp cadastrado entram no envio. Critérios vazios não restringem o público.
      </p>
    </div>
  );
}
