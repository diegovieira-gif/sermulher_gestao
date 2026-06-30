"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search as LucideSearch,
  Download as LucideDownload,
  Filter as LucideFilter,
  X as LucideX,
  Loader2 as LucideLoader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const Search = LucideSearch as React.ComponentType<any>;
const Download = LucideDownload as React.ComponentType<any>;
const Filter = LucideFilter as React.ComponentType<any>;
const X = LucideX as React.ComponentType<any>;
const Loader2 = LucideLoader2 as React.ComponentType<any>;

const SORT_OPTIONS = [
  { value: "created_at_desc", label: "Mais recentes primeiro" },
  { value: "created_at_asc", label: "Mais antigos primeiro" },
  { value: "nome_completo_asc", label: "Nome (A-Z)" },
  { value: "nome_completo_desc", label: "Nome (Z-A)" },
  { value: "data_nascimento_asc", label: "Idade (maior primeiro)" },
  { value: "data_nascimento_desc", label: "Idade (menor primeiro)" },
];

interface BeneficiariasFiltrosProps {
  bairros: { id: number; nome: string }[];
  isExporting: boolean;
  onExport: () => void;
  hasData: boolean;
  /** Chamado imediatamente antes de uma navegação, para o indicador de carregamento. */
  onBeforeNavigate?: () => void;
}

/**
 * Barra de busca + filtros avançados da listagem de beneficiárias.
 *
 * O estado dos filtros é derivado diretamente da URL (fonte única de verdade),
 * evitando dessincronização entre UI e dados ao navegar (voltar/avançar, links).
 * Cada alteração faz um único push para a URL, sempre reiniciando para a página 1.
 */
export function BeneficiariasFiltros({
  bairros,
  isExporting,
  onExport,
  hasData,
  onBeforeNavigate,
}: BeneficiariasFiltrosProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Valores atuais derivados da URL
  const q = searchParams.get("q") || "";
  const bairro = searchParams.get("bairro") || "";
  const medidaProtetiva = searchParams.get("medidaProtetiva") === "true";
  const bolsaFamilia = searchParams.get("bolsaFamilia") === "true";
  const bpc = searchParams.get("bpc") === "true";
  const sortField = searchParams.get("sortField") || "created_at";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  const activeCount =
    (bairro ? 1 : 0) +
    (medidaProtetiva ? 1 : 0) +
    (bolsaFamilia ? 1 : 0) +
    (bpc ? 1 : 0);

  const [panelOpen, setPanelOpen] = useState(activeCount > 0);
  const [searchInput, setSearchInput] = useState(q);

  // Aplica um conjunto de mudanças nos query params (sempre reinicia page=1).
  const applyParams = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      params.set("page", "1");
      onBeforeNavigate?.();
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams, onBeforeNavigate],
  );

  const setParam = useCallback(
    (key: string, value: string | null) => {
      applyParams((p) => {
        if (value) p.set(key, value);
        else p.delete(key);
      });
    },
    [applyParams],
  );

  // Busca com debounce: empurra para a URL quando difere do valor atual.
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== q) {
        setParam("q", searchInput || null);
      }
    }, 400);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  // Ressincroniza o input quando a URL muda externamente (voltar/avançar, limpar).
  useEffect(() => {
    setSearchInput(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // Máscara progressiva de CPF quando o usuário digita números.
  const handleSearchChange = (val: string) => {
    const clean = val.replace(/\D/g, "");
    if (clean.length > 0 && /^\d/.test(val.trim())) {
      let masked = clean;
      if (clean.length > 3) masked = `${clean.slice(0, 3)}.${clean.slice(3)}`;
      if (clean.length > 6) masked = `${masked.slice(0, 7)}.${clean.slice(6)}`;
      if (clean.length > 9) masked = `${masked.slice(0, 11)}-${clean.slice(9, 11)}`;
      setSearchInput(masked);
    } else {
      setSearchInput(val);
    }
  };

  const clearAllFilters = () => {
    applyParams((p) => {
      p.delete("bairro");
      p.delete("medidaProtetiva");
      p.delete("bolsaFamilia");
      p.delete("bpc");
    });
  };

  const currentSortValue = `${sortField}_${sortOrder}`;

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];
    if (bairro)
      chips.push({ key: "bairro", label: `Bairro: ${bairro}`, onRemove: () => setParam("bairro", null) });
    if (medidaProtetiva)
      chips.push({ key: "mp", label: "Medida Protetiva", onRemove: () => setParam("medidaProtetiva", null) });
    if (bolsaFamilia)
      chips.push({ key: "bf", label: "Bolsa Família", onRemove: () => setParam("bolsaFamilia", null) });
    if (bpc)
      chips.push({ key: "bpc", label: "BPC", onRemove: () => setParam("bpc", null) });
    return chips;
  }, [bairro, medidaProtetiva, bolsaFamilia, bpc, setParam]);

  return (
    <div className="space-y-4">
      {/* Barra de ferramentas: busca + ações */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-150 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por nome ou CPF..."
            className="pl-10 pr-10 h-10 w-full bg-slate-50/50 border-slate-200/80 focus-visible:bg-white focus-visible:ring-purple-500/20"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          {searchInput && (
            <button
              type="button"
              aria-label="Limpar busca"
              onClick={() => setSearchInput("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
          <Button
            variant={panelOpen ? "default" : "outline"}
            className={cn(
              "h-10 px-4 transition-colors font-medium",
              panelOpen
                ? "bg-purple-600 hover:bg-purple-700 text-white"
                : "text-slate-600 border-slate-200 hover:bg-slate-50",
            )}
            onClick={() => setPanelOpen((v) => !v)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
            {activeCount > 0 && (
              <span
                className={cn(
                  "ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold",
                  panelOpen ? "bg-white/20 text-white" : "bg-purple-100 text-purple-700",
                )}
              >
                {activeCount}
              </span>
            )}
          </Button>

          <Button
            variant="outline"
            className="text-slate-600 border-slate-200 hover:bg-slate-50 h-10 px-4 font-medium"
            onClick={onExport}
            disabled={isExporting || !hasData}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Painel de filtros avançados */}
      {panelOpen && (
        <div className="bg-slate-50/75 p-5 rounded-xl border border-slate-100 shadow-sm animate-in slide-in-from-top-2 duration-200 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Bairro */}
            <div className="space-y-2">
              <Label
                htmlFor="filtro-bairro"
                className="text-xs font-semibold text-slate-600 uppercase tracking-wider"
              >
                Bairro
              </Label>
              <Select
                value={bairro || "__todos__"}
                onValueChange={(val) => setParam("bairro", val === "__todos__" ? null : val)}
              >
                <SelectTrigger id="filtro-bairro" className="h-10 bg-white border-slate-200">
                  <SelectValue placeholder="Todos os bairros" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__todos__">Todos os bairros</SelectItem>
                  {bairros.map((b) => (
                    <SelectItem key={b.id} value={b.nome}>
                      {b.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ordenação */}
            <div className="space-y-2">
              <Label
                htmlFor="filtro-ordenacao"
                className="text-xs font-semibold text-slate-600 uppercase tracking-wider"
              >
                Ordenação
              </Label>
              <Select
                value={currentSortValue}
                onValueChange={(val) => {
                  const idx = val.lastIndexOf("_");
                  const field = val.slice(0, idx);
                  const order = val.slice(idx + 1);
                  applyParams((p) => {
                    p.set("sortField", field);
                    p.set("sortOrder", order);
                  });
                }}
              >
                <SelectTrigger id="filtro-ordenacao" className="h-10 bg-white border-slate-200">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Toggles */}
            <div className="space-y-2 sm:col-span-2 lg:col-span-2">
              <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Marcadores
              </Label>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 h-10">
                <div className="flex items-center gap-2">
                  <Switch
                    id="filtro-medida"
                    checked={medidaProtetiva}
                    onCheckedChange={(c) => setParam("medidaProtetiva", c ? "true" : null)}
                  />
                  <Label htmlFor="filtro-medida" className="text-sm font-medium text-slate-700 cursor-pointer">
                    Medida Protetiva
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="filtro-bolsa"
                    checked={bolsaFamilia}
                    onCheckedChange={(c) => setParam("bolsaFamilia", c ? "true" : null)}
                  />
                  <Label htmlFor="filtro-bolsa" className="text-sm font-medium text-slate-700 cursor-pointer">
                    Bolsa Família
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="filtro-bpc"
                    checked={bpc}
                    onCheckedChange={(c) => setParam("bpc", c ? "true" : null)}
                  />
                  <Label htmlFor="filtro-bpc" className="text-sm font-medium text-slate-700 cursor-pointer">
                    BPC
                  </Label>
                </div>
              </div>
            </div>
          </div>

          {/* Chips de filtros ativos + limpar */}
          {activeChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-t border-slate-200/70 pt-4">
              <span className="text-xs font-medium text-slate-500">Filtros ativos:</span>
              {activeChips.map((chip) => (
                <Badge
                  key={chip.key}
                  variant="secondary"
                  className="gap-1 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 pl-2.5 pr-1.5 py-0.5 font-medium"
                >
                  {chip.label}
                  <button
                    type="button"
                    aria-label={`Remover filtro ${chip.label}`}
                    onClick={chip.onRemove}
                    className="rounded-full hover:bg-purple-200/60 p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs text-red-500 hover:text-red-600 h-7 px-2.5 rounded-full hover:bg-red-50 ml-auto"
              >
                <X className="h-3.5 w-3.5 mr-1" /> Limpar tudo
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
