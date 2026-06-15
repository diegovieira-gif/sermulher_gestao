"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { BeneficiariaForm } from "./beneficiaria-form";
import { deleteBeneficiaria } from "./actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Plus as LucidePlus,
  Pencil as LucidePencil,
  Trash2 as LucideTrash2,
  Eye as LucideEye,
  Search as LucideSearch,
  Download as LucideDownload,
  ChevronLeft as LucideChevronLeft,
  ChevronRight as LucideChevronRight,
  Loader2 as LucideLoader2,
  Calendar as LucideCalendar,
  MapPin as LucideMapPin,
  Users as LucideUsers,
  ShieldAlert as LucideShieldAlert,
  Gift as LucideGift,
  Filter as LucideFilter,
  X as LucideX,
  FileText as LucideFileText,
  ArrowUpDown as LucideArrowUpDown,
  ArrowUp as LucideArrowUp,
  ArrowDown as LucideArrowDown,
} from "lucide-react";

// Bypass global Object prototype pollution from n8n-workflows.d.ts (which defines global 'in' property)
const Plus = LucidePlus as React.ComponentType<any>;
const Pencil = LucidePencil as React.ComponentType<any>;
const Trash2 = LucideTrash2 as React.ComponentType<any>;
const Eye = LucideEye as React.ComponentType<any>;
const Search = LucideSearch as React.ComponentType<any>;
const Download = LucideDownload as React.ComponentType<any>;
const ChevronLeft = LucideChevronLeft as React.ComponentType<any>;
const ChevronRight = LucideChevronRight as React.ComponentType<any>;
const Loader2 = LucideLoader2 as React.ComponentType<any>;
const Calendar = LucideCalendar as React.ComponentType<any>;
const MapPin = LucideMapPin as React.ComponentType<any>;
const Users = LucideUsers as React.ComponentType<any>;
const ShieldAlert = LucideShieldAlert as React.ComponentType<any>;
const Gift = LucideGift as React.ComponentType<any>;
const Filter = LucideFilter as React.ComponentType<any>;
const X = LucideX as React.ComponentType<any>;
const FileText = LucideFileText as React.ComponentType<any>;
const ArrowUpDown = LucideArrowUpDown as React.ComponentType<any>;
const ArrowUp = LucideArrowUp as React.ComponentType<any>;
const ArrowDown = LucideArrowDown as React.ComponentType<any>;

import { InfoTooltip } from "@/components/ui/info-tooltip";
import { toast } from "sonner";
import { formatDateDisplay, cn } from "@/lib/utils";
import type { Beneficiaria } from "./schemas";

const getInitials = (name: string): string => {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const formatCPF = (cpf: string | null | undefined): string => {
  if (!cpf) return "-";
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return cpf;
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

const normalizePhone = (phone: string | null | undefined): string => {
  if (!phone) return "";
  let clean = phone.replace(/\D/g, "");
  if (clean.startsWith("55") && (clean.length === 12 || clean.length === 13)) {
    clean = clean.substring(2);
  }
  return clean;
};

const formatPhone = (phone: string | null | undefined): string => {
  if (!phone) return "-";
  const clean = normalizePhone(phone);
  if (clean.length === 11) {
    return clean.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  } else if (clean.length === 10) {
    return clean.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  } else if (clean.length === 9) {
    return clean.replace(/(\d{5})(\d{4})/, "$1-$2");
  } else if (clean.length === 8) {
    return clean.replace(/(\d{4})(\d{4})/, "$1-$2");
  }
  return phone;
};

const maskCPF = (cpf: string | null | undefined): string => {
  if (!cpf) return "-";
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return cpf;
  return `${clean.substring(0, 3)}.***.***-${clean.substring(9)}`;
};

const maskPhone = (phone: string | null | undefined): string => {
  if (!phone) return "-";
  const clean = normalizePhone(phone);
  if (clean.length === 11) {
    return `(${clean.substring(0, 2)}) ${clean.substring(2, 3)}****-${clean.substring(7)}`;
  } else if (clean.length === 10) {
    return `(${clean.substring(0, 2)}) ****-${clean.substring(6)}`;
  } else if (clean.length === 9) {
    return `${clean.substring(0, 1)}****-${clean.substring(5)}`;
  } else if (clean.length === 8) {
    return `****-${clean.substring(4)}`;
  }
  if (clean.length > 4) {
    return `${"*".repeat(clean.length - 4)}${clean.substring(clean.length - 4)}`;
  }
  return "****";
};

const isValidNomeSocial = (name: string | null | undefined): boolean => {
  if (!name) return false;
  const clean = name.trim();
  return !(
    clean === "00" ||
    clean === "0" ||
    clean.toLowerCase() === "false" ||
    clean === ""
  );
};

interface BeneficiariasClientProps {
  initialData: any[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  formOptions: {
    racas: any[];
    estadosCivis: any[];
    escolaridades: any[];
    situacoesTrabalho: any[];
    bairros: any[];
    ubs: any[];
  } | null;
  metrics: {
    total: number;
    medidaProtetiva: number;
    bolsaFamilia: number;
    bpc: number;
    recentes: number;
  };
}

export function BeneficiariasClient({
  initialData,
  meta,
  formOptions,
  metrics,
}: BeneficiariasClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Estados locais
  const [formOpen, setFormOpen] = useState(false);
  const [selectedBeneficiaria, setSelectedBeneficiaria] =
    useState<Beneficiaria | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [idsToDelete, setIdsToDelete] = useState<number[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Busca e Exportação
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("q") || ""
  );
  const [isExporting, setIsExporting] = useState(false);

  // Filtros Avançados
  const [filterMedida, setFilterMedida] = useState(searchParams.get("medidaProtetiva") === "true");
  const [filterBolsa, setFilterBolsa] = useState(searchParams.get("bolsaFamilia") === "true");
  const [filterBpc, setFilterBpc] = useState(searchParams.get("bpc") === "true");
  const [filterBairro, setFilterBairro] = useState(searchParams.get("bairro") || "");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Loading indicator para transições
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Seleção múltipla para ações em lote
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Preview Drawer/Sheet
  const [previewBeneficiaria, setPreviewBeneficiaria] = useState<any | null>(null);

  // Reset states when data changes
  useEffect(() => {
    setIsLoadingData(false);
    setSelectedIds([]);
  }, [initialData]);

  // Debounced search effect
  useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (searchTerm) {
        params.set("q", searchTerm);
      } else {
        params.delete("q");
      }
      
      const currentQ = searchParams.get("q") || "";
      if (searchTerm !== currentQ) {
        setIsLoadingData(true);
        params.set("page", "1");
        router.push(`${pathname}?${params.toString()}`);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [searchTerm, router, pathname, searchParams]);

  const applyFilters = (newFilters: {
    medidaProtetiva?: boolean;
    bolsaFamilia?: boolean;
    bpc?: boolean;
    bairro?: string;
  }) => {
    setIsLoadingData(true);
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");

    const mp = newFilters.hasOwnProperty("medidaProtetiva") ? newFilters.medidaProtetiva : filterMedida;
    const bf = newFilters.hasOwnProperty("bolsaFamilia") ? newFilters.bolsaFamilia : filterBolsa;
    const bp = newFilters.hasOwnProperty("bpc") ? newFilters.bpc : filterBpc;
    const br = newFilters.hasOwnProperty("bairro") ? newFilters.bairro : filterBairro;

    if (mp) params.set("medidaProtetiva", "true");
    else params.delete("medidaProtetiva");

    if (bf) params.set("bolsaFamilia", "true");
    else params.delete("bolsaFamilia");

    if (bp) params.set("bpc", "true");
    else params.delete("bpc");

    if (br) params.set("bairro", br);
    else params.delete("bairro");

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleClearFilters = () => {
    setIsLoadingData(true);
    setFilterMedida(false);
    setFilterBolsa(false);
    setFilterBpc(false);
    setFilterBairro("");
    
    const params = new URLSearchParams(searchParams);
    params.delete("medidaProtetiva");
    params.delete("bolsaFamilia");
    params.delete("bpc");
    params.delete("bairro");
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const currentSortField = searchParams.get("sortField") || "created_at";
  const currentSortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "desc";

  const handleSort = (field: string) => {
    setIsLoadingData(true);
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");
    
    if (currentSortField === field) {
      const nextOrder = currentSortOrder === "asc" ? "desc" : "asc";
      params.set("sortOrder", nextOrder);
    } else {
      params.set("sortField", field);
      params.set("sortOrder", field === "created_at" ? "desc" : "asc");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearchChange = (val: string) => {
    const clean = val.replace(/\D/g, "");
    if (clean.length > 0 && /^\d/.test(val.trim())) {
      let masked = clean;
      if (clean.length > 3) {
        masked = `${clean.slice(0, 3)}.${clean.slice(3)}`;
      }
      if (clean.length > 6) {
        masked = `${masked.slice(0, 7)}.${clean.slice(6)}`;
      }
      if (clean.length > 9) {
        masked = `${masked.slice(0, 11)}-${clean.slice(9, 11)}`;
      }
      setSearchTerm(masked);
    } else {
      setSearchTerm(val);
    }
  };

  const filteredData = initialData;

  const handlePageChange = (newPage: number) => {
    setIsLoadingData(true);
    const params = new URLSearchParams(searchParams);
    if (newPage > 1) {
      params.set("page", newPage.toString());
    } else {
      params.delete("page");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleExport = () => {
    setIsExporting(true);
    try {
      if (filteredData.length > 0) {
        const headers = [
          "Nome Completo",
          "CPF",
          "Telefone",
          "Data Nascimento",
          "Bairro",
          "Cidade",
        ];
        const rows = filteredData.map((b: any) => [
          b.nome_completo,
          b.cpf || "",
          b.telefone || "",
          b.data_nascimento || "",
          b.endereco?.bairro || "",
          b.endereco?.cidade || "",
        ]);

        const csvContent = [
          headers.join(","),
          ...rows.map((r: any[]) =>
            r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","),
          ),
        ].join("\n");

        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          `beneficiarias_${new Date().toISOString().slice(0, 10)}.csv`,
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Download do relatório completo iniciado!");
      }
    } catch (error) {
      toast.error("Erro ao exportar dados.");
    } finally {
      setIsExporting(false);
    }
  };

  const toggleSelectRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredData.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredData.map((b) => b.id));
    }
  };

  const handleExportSelected = () => {
    const dataToExport = filteredData.filter((b) => selectedIds.includes(b.id));
    if (dataToExport.length === 0) return;
    
    setIsExporting(true);
    try {
      const headers = [
        "Nome Completo",
        "CPF",
        "Telefone",
        "Data Nascimento",
        "Bairro",
        "Cidade",
      ];
      const rows = dataToExport.map((b: any) => [
        b.nome_completo,
        b.cpf || "",
        b.telefone || "",
        b.data_nascimento || "",
        b.endereco?.bairro || "",
        b.endereco?.cidade || "",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((r: any[]) =>
          r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","),
        ),
      ].join("\n");

      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `beneficiarias_selecionadas_${new Date().toISOString().slice(0, 10)}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Exportação de registros selecionados iniciada!");
    } catch (e) {
      toast.error("Erro ao exportar registros selecionados.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteSelectedClick = () => {
    setIdsToDelete(selectedIds);
    setDeleteDialogOpen(true);
  };

  const handleEditClick = (beneficiaria: any) => {
    setSelectedBeneficiaria(beneficiaria);
    setFormOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setIdsToDelete([id]);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (idsToDelete.length === 0) return;
    setIsDeleting(true);
    
    try {
      let successCount = 0;
      let failCount = 0;
      
      for (const id of idsToDelete) {
        const result = await deleteBeneficiaria(id);
        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      }
      
      if (successCount > 0) {
        toast.success(`${successCount} beneficiária(s) excluída(s) com sucesso!`);
        router.refresh();
      }
      if (failCount > 0) {
        toast.error(`Falha ao excluir ${failCount} beneficiária(s).`);
      }
    } catch (e) {
      toast.error("Erro ao realizar exclusão.");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setIdsToDelete([]);
      setSelectedIds([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Título e Ação */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Beneficiárias</h1>
          <p className="text-muted-foreground text-sm">
            Gerencie o cadastro das mulheres atendidas ({meta.total} registros).
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedBeneficiaria(null);
            setFormOpen(true);
          }}
          className="bg-purple-600 hover:bg-purple-700 font-semibold shadow-sm transition-all"
        >
          <Plus className="mr-2 h-4 w-4" /> Nova Beneficiária
        </Button>
      </div>

      {/* 1. Cards de Métricas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow duration-200">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</span>
            <h3 className="text-2xl font-bold text-slate-900">{metrics.total}</h3>
          </div>
          <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow duration-200">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Medida Protetiva</span>
            <h3 className="text-2xl font-bold text-red-600">{metrics.medidaProtetiva}</h3>
          </div>
          <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600 border border-red-100">
            <ShieldAlert className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow duration-200">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Benefícios Sociais</span>
            <h3 className="text-2xl font-bold text-emerald-600">{metrics.bolsaFamilia + metrics.bpc}</h3>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
            <Gift className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow duration-200">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Últimos 30 dias</span>
            <h3 className="text-2xl font-bold text-blue-600">{metrics.recentes}</h3>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
            <Calendar className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Barra de Ferramentas com Pesquisa e Botão Filtros */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-150 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por nome ou CPF..."
            className="pl-10 h-10 w-full bg-slate-50/50 border-slate-200/80 focus-visible:bg-white focus-visible:ring-purple-500/20"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
          {/* 2. Filtros Avançados Trigger */}
          <Button
            variant={filtersOpen ? "default" : "outline"}
            className={cn(
              "h-10 px-4 transition-colors font-medium",
              filtersOpen
                ? "bg-purple-600 hover:bg-purple-700 text-white"
                : "text-slate-600 border-slate-200 hover:bg-slate-50"
            )}
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
            {(filterMedida || filterBolsa || filterBpc || filterBairro) && (
              <span className="ml-1.5 flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            )}
          </Button>

          <Button
            variant="outline"
            className="text-slate-600 border-slate-200 hover:bg-slate-50 h-10 px-4 font-medium"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* 2. Painel Filtros Avançados */}
      {filtersOpen && (
        <div className="bg-slate-50/75 backdrop-blur-sm p-5 rounded-xl border border-slate-100 shadow-sm -mt-4 mb-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-5 animate-in slide-in-from-top-3 duration-300">
          <div className="space-y-2">
            <Label htmlFor="filter-bairro" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Bairro</Label>
            <Select
              value={filterBairro || "all_bairros"}
              onValueChange={(val) => {
                const actualVal = val === "all_bairros" ? "" : val;
                setFilterBairro(actualVal);
                applyFilters({ bairro: actualVal });
              }}
            >
              <SelectTrigger id="filter-bairro" className="h-10 bg-white border-slate-200">
                <SelectValue placeholder="Todos os bairros" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_bairros">Todos os bairros</SelectItem>
                {formOptions?.bairros?.map((b) => (
                  <SelectItem key={b.id} value={b.nome}>
                    {b.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sort-select" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Ordenação</Label>
            <Select
              value={`${currentSortField}_${currentSortOrder}`}
              onValueChange={(val) => {
                const [field, order] = val.split("_");
                setIsLoadingData(true);
                const params = new URLSearchParams(searchParams);
                params.set("sortField", field);
                params.set("sortOrder", order);
                params.set("page", "1");
                router.push(`${pathname}?${params.toString()}`);
              }}
            >
              <SelectTrigger id="sort-select" className="h-10 bg-white border-slate-200">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nome_completo_asc">Nome (A-Z)</SelectItem>
                <SelectItem value="nome_completo_desc">Nome (Z-A)</SelectItem>
                <SelectItem value="created_at_desc">Mais recentes primeiro</SelectItem>
                <SelectItem value="created_at_asc">Mais antigos primeiro</SelectItem>
                <SelectItem value="data_nascimento_asc">Idade (Maior primeiro)</SelectItem>
                <SelectItem value="data_nascimento_desc">Idade (Menor primeiro)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2 pt-8">
            <Switch
              id="filter-medida"
              checked={filterMedida}
              onCheckedChange={(checked) => {
                setFilterMedida(checked);
                applyFilters({ medidaProtetiva: checked });
              }}
            />
            <Label htmlFor="filter-medida" className="text-sm font-medium text-slate-700 cursor-pointer">
              Medida Protetiva
            </Label>
          </div>

          <div className="flex items-center space-x-2 pt-8">
            <Switch
              id="filter-bolsa"
              checked={filterBolsa}
              onCheckedChange={(checked) => {
                setFilterBolsa(checked);
                applyFilters({ bolsaFamilia: checked });
              }}
            />
            <Label htmlFor="filter-bolsa" className="text-sm font-medium text-slate-700 cursor-pointer">
              Bolsa Família
            </Label>
          </div>

          <div className="flex items-center space-x-2 pt-8 justify-between md:justify-start">
            <div className="flex items-center space-x-2">
              <Switch
                id="filter-bpc"
                checked={filterBpc}
                onCheckedChange={(checked) => {
                  setFilterBpc(checked);
                  applyFilters({ bpc: checked });
                }}
              />
              <Label htmlFor="filter-bpc" className="text-sm font-medium text-slate-700 cursor-pointer">
                BPC
              </Label>
            </div>
            {(filterMedida || filterBolsa || filterBpc || filterBairro) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-xs text-red-500 hover:text-red-600 h-8 px-2.5 rounded-full hover:bg-red-50 ml-auto md:ml-4"
              >
                <X className="h-3.5 w-3.5 mr-1" /> Limpar
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Tabela de Dados */}
      <div className="rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden relative">
        {/* 3. Indicador de Carregamento */}
        {isLoadingData && (
          <div className="absolute inset-x-0 top-0 h-1 bg-purple-100 overflow-hidden z-10">
            <div className="h-full bg-purple-600 animate-pulse w-1/3 rounded-full" />
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/75">
              {/* Checkbox Master para Lote */}
              <TableHead className="w-12 text-center">
                <Checkbox
                  checked={filteredData.length > 0 && selectedIds.length === filteredData.length}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Selecionar todos"
                />
              </TableHead>
              <TableHead
                className="font-semibold text-slate-700 cursor-pointer select-none hover:bg-slate-100/50 transition-colors group"
                onClick={() => handleSort("nome_completo")}
              >
                <div className="flex items-center gap-1.5">
                  Beneficiária
                  {currentSortField === "nome_completo" ? (
                    currentSortOrder === "asc" ? <ArrowUp className="h-3.5 w-3.5 text-purple-600" /> : <ArrowDown className="h-3.5 w-3.5 text-purple-600" />
                  ) : (
                    <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
              </TableHead>
              <TableHead className="font-semibold text-slate-700">CPF</TableHead>
              <TableHead className="font-semibold text-slate-700">Contato</TableHead>
              <TableHead className="font-semibold text-slate-700">Localização</TableHead>
              <TableHead
                className="font-semibold text-slate-700 cursor-pointer select-none hover:bg-slate-100/50 transition-colors group"
                onClick={() => handleSort("data_nascimento")}
              >
                <div className="flex items-center gap-1.5">
                  Idade
                  {currentSortField === "data_nascimento" ? (
                    currentSortOrder === "asc" ? <ArrowUp className="h-3.5 w-3.5 text-purple-600" /> : <ArrowDown className="h-3.5 w-3.5 text-purple-600" />
                  ) : (
                    <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
              </TableHead>
              <TableHead
                className="font-semibold text-slate-700 cursor-pointer select-none hover:bg-slate-100/50 transition-colors group"
                onClick={() => handleSort("created_at")}
              >
                <div className="flex items-center gap-1.5">
                  Cadastro
                  {currentSortField === "created_at" ? (
                    currentSortOrder === "asc" ? <ArrowUp className="h-3.5 w-3.5 text-purple-600" /> : <ArrowDown className="h-3.5 w-3.5 text-purple-600" />
                  ) : (
                    <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
              </TableHead>
              <TableHead className="text-right font-semibold text-slate-700">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-32 text-center text-muted-foreground"
                >
                  Nenhum registro encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((b: any) => (
                <TableRow
                  key={b.id}
                  className={cn(
                    "hover:bg-slate-50/40 transition-colors duration-200",
                    selectedIds.includes(b.id) && "bg-purple-50/25 hover:bg-purple-50/35",
                    isLoadingData && "opacity-60"
                  )}
                >
                  {/* Checkbox Linha para Lote */}
                  <TableCell className="text-center w-12">
                    <Checkbox
                      checked={selectedIds.includes(b.id)}
                      onCheckedChange={() => toggleSelectRow(b.id)}
                      aria-label={`Selecionar ${b.nome_completo}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 text-purple-800 font-semibold text-xs border border-purple-200/50 shadow-sm">
                        {getInitials(b.nome_completo)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 leading-none">{b.nome_completo}</span>
                        {isValidNomeSocial(b.nome_social) && (
                          <span className="text-xs text-slate-500 mt-1 italic">
                            Nome social: {b.nome_social}
                          </span>
                        )}
                        <div className="flex flex-wrap gap-1 mt-1.5 items-center">
                          {!!b.possui_medida_protetiva && (
                            <Badge className="bg-red-50 text-red-700 border border-red-200 text-[10px] py-0 px-1.5 font-medium hover:bg-red-50">
                              Medida Protetiva
                            </Badge>
                          )}
                          {!!b.recebe_bolsa_familia && (
                            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] py-0 px-1.5 font-medium hover:bg-emerald-50">
                              Bolsa Família
                            </Badge>
                          )}
                          {!!b.recebe_bpc && (
                            <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] py-0 px-1.5 font-medium hover:bg-blue-50">
                              BPC
                            </Badge>
                          )}
                          {b.origem_dado === "importacao_odoo" && (
                            <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] py-0 px-1.5 font-medium hover:bg-amber-50">
                              Importado
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-600">
                    {maskCPF(b.cpf)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-slate-800 text-sm font-medium">{maskPhone(b.telefone)}</span>
                      {b.email && (
                        <span className="text-xs text-slate-400 font-normal mt-0.5 truncate max-w-[180px]">
                          {b.email}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {b.endereco?.cidade || b.endereco?.bairro ? (
                      <div className="flex items-start gap-1 text-slate-800 text-sm">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <div className="flex flex-col">
                          <span className="font-medium leading-none">{b.endereco.bairro || "-"}</span>
                          <span className="text-slate-500 text-xs mt-1">{b.endereco.cidade || "-"}</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {b.data_nascimento ? (
                      <div className="flex flex-col">
                        <span className="text-slate-800 text-sm font-medium">
                          {(() => {
                            const today = new Date();
                            const birthDate = new Date(b.data_nascimento);
                            let age = today.getFullYear() - birthDate.getFullYear();
                            const m = today.getMonth() - birthDate.getMonth();
                            if (
                              m < 0 ||
                              (m === 0 && today.getDate() < birthDate.getDate())
                            ) {
                              age--;
                            }
                            return age + " anos";
                          })()}
                        </span>
                        <span className="text-slate-400 text-xs font-mono mt-0.5">
                          {formatDateDisplay(b.data_nascimento)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {b.created_at ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-slate-900 text-sm font-semibold">
                          <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                          <span>{formatDateDisplay(b.created_at)}</span>
                        </div>
                        {b.updated_at && (
                          <span className="text-xs text-slate-400 pl-[22px]">
                            Atu: {formatDateDisplay(b.updated_at)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {/* 6. Visualizar Resumo via Sheet Trigger */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-full"
                        title="Visualizar Resumo"
                        onClick={() => setPreviewBeneficiaria(b)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-full"
                        onClick={() => handleEditClick(b)}
                        aria-label="Editar"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full"
                        onClick={() => handleDeleteClick(b.id)}
                        aria-label="Excluir"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Itens por página:</span>
          <Select
            value={String(meta.limit)}
            onValueChange={(value) => {
              setIsLoadingData(true);
              const params = new URLSearchParams(searchParams);
              params.set("limit", value);
              params.set("page", "1");
              router.push(`${pathname}?${params.toString()}`);
            }}
          >
            <SelectTrigger className="w-[70px] h-8 bg-white border-slate-200">
              <SelectValue placeholder={String(meta.limit)} />
            </SelectTrigger>
            <SelectContent>
              {[10, 25, 50, 100].map((limit) => (
                <SelectItem key={limit} value={String(limit)}>
                  {limit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-gray-500">
          Mostrando <strong>{(meta.page - 1) * meta.limit + 1}</strong> a{" "}
          <strong>{Math.min(meta.page * meta.limit, meta.total)}</strong> de{" "}
          <strong>{meta.total}</strong> resultados
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(meta.page - 1)}
            disabled={meta.page <= 1}
            className="border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
          </Button>
          <div className="flex items-center justify-center px-4 font-medium text-sm">
            Página {meta.page} de {meta.totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(meta.page + 1)}
            disabled={meta.page >= meta.totalPages}
            className="border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            Próximo <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Form de Cadastro/Edição */}
      <BeneficiariaForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setSelectedBeneficiaria(null);
        }}
        beneficiaria={selectedBeneficiaria}
        formOptions={formOptions || undefined}
      />

      {/* 5. Ações em Lote Floating Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-6 border border-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <span className="text-sm font-semibold text-slate-200">
            {selectedIds.length} selecionada(s)
          </span>
          <div className="h-4 w-px bg-slate-800" />
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:text-purple-300 hover:bg-slate-800 rounded-full h-8"
              onClick={handleExportSelected}
            >
              <Download className="h-4 w-4 mr-1.5" />
              Exportar CSV
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-full h-8"
              onClick={handleDeleteSelectedClick}
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Excluir
            </Button>
          </div>
        </div>
      )}

      {/* 6. Drawer de Visualização Rápida */}
      <Sheet open={!!previewBeneficiaria} onOpenChange={(open) => !open && setPreviewBeneficiaria(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          {previewBeneficiaria && (
            <div className="space-y-6 pt-4">
              <SheetHeader className="text-left">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 text-purple-800 font-bold text-lg border border-purple-200/50 shadow-sm">
                    {getInitials(previewBeneficiaria.nome_completo)}
                  </div>
                  <div>
                    <SheetTitle className="text-xl font-bold text-slate-900 leading-tight">
                      {previewBeneficiaria.nome_completo}
                    </SheetTitle>
                    {isValidNomeSocial(previewBeneficiaria.nome_social) && (
                      <p className="text-xs text-slate-500 mt-0.5 italic">
                        Nome social: {previewBeneficiaria.nome_social}
                      </p>
                    )}
                  </div>
                </div>
                <SheetDescription className="pt-2 text-slate-400 text-xs">
                  Resumo cadastral da beneficiária.
                </SheetDescription>
              </SheetHeader>

              <div className="border-t border-slate-100 my-4" />

              {/* Status Badges */}
              <div className="flex flex-wrap gap-2">
                 {!!previewBeneficiaria.possui_medida_protetiva && (
                  <Badge className="bg-red-50 text-red-700 border border-red-200 font-semibold text-xs py-1 px-2.5 hover:bg-red-50">
                    <ShieldAlert className="h-3.5 w-3.5 mr-1" />
                    Medida Protetiva
                  </Badge>
                )}
                {!!previewBeneficiaria.recebe_bolsa_familia && (
                  <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-xs py-1 px-2.5 hover:bg-emerald-50">
                    <Gift className="h-3.5 w-3.5 mr-1" />
                    Bolsa Família
                  </Badge>
                )}
                {!!previewBeneficiaria.recebe_bpc && (
                  <Badge className="bg-blue-50 text-blue-700 border border-blue-200 font-semibold text-xs py-1 px-2.5 hover:bg-blue-50">
                    <Gift className="h-3.5 w-3.5 mr-1" />
                    BPC
                  </Badge>
                )}
              </div>

              {/* Informações Básicas */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dados Pessoais</h4>
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">CPF</span>
                    <p className="text-sm font-medium text-slate-800">{formatCPF(previewBeneficiaria.cpf)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">Idade / Nasc.</span>
                    <p className="text-sm font-medium text-slate-800">
                      {previewBeneficiaria.data_nascimento ? (
                        <>
                          {(() => {
                            const today = new Date();
                            const birthDate = new Date(previewBeneficiaria.data_nascimento);
                            let age = today.getFullYear() - birthDate.getFullYear();
                            const m = today.getMonth() - birthDate.getMonth();
                            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                              age--;
                            }
                            return `${age} anos`;
                          })()}{" "}
                          <span className="text-slate-400 text-xs font-mono">
                            ({formatDateDisplay(previewBeneficiaria.data_nascimento)})
                          </span>
                        </>
                      ) : (
                        "-"
                      )}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">Telefone</span>
                    <p className="text-sm font-medium text-slate-800">{formatPhone(previewBeneficiaria.telefone)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">E-mail</span>
                    <p className="text-sm font-medium text-slate-800 truncate max-w-[150px]" title={previewBeneficiaria.email}>
                      {previewBeneficiaria.email || "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Endereço</h4>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <div className="flex gap-2">
                    <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {previewBeneficiaria.endereco?.logradouro || "-"}
                        {previewBeneficiaria.endereco?.numero ? `, nº ${previewBeneficiaria.endereco.numero}` : ""}
                      </p>
                      <p className="text-xs text-slate-500">
                        {previewBeneficiaria.endereco?.bairro || "-"} — {previewBeneficiaria.endereco?.cidade || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informações de Cadastro */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Histórico</h4>
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">Data Cadastro</span>
                    <p className="text-xs font-medium text-slate-800 flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {formatDateDisplay(previewBeneficiaria.created_at)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">Última Atualização</span>
                    <p className="text-xs font-medium text-slate-800 flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {formatDateDisplay(previewBeneficiaria.updated_at)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 my-4" />

              <div className="flex gap-3">
                <Link href={`/mulheres/beneficiarias/${previewBeneficiaria.id}`} className="flex-1">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium">
                    <FileText className="h-4 w-4 mr-2" />
                    Ver Ficha Completa
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="flex-1 font-medium border-slate-200 text-slate-700"
                  onClick={() => {
                    setPreviewBeneficiaria(null);
                    handleEditClick(previewBeneficiaria);
                  }}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar Dados
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente
              {idsToDelete.length > 1
                ? ` as ${idsToDelete.length} beneficiárias selecionadas`
                : " a beneficiária"} e todos os dados associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Excluindo..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
