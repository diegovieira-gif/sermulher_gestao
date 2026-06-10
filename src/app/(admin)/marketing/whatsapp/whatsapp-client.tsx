"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  MessageSquare,
  Send,
  Smartphone,
  Settings,
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Search,
  Users,
  Settings2,
  Plus,
  Trash2,
  Edit,
  History,
  Info,
  ExternalLink,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react";
import {
  getWhatsappConfig,
  saveWhatsappConfig,
  testEvolutionConnection,
  getWhatsappCampaigns,
  saveWhatsappCampaign,
  deleteWhatsappCampaign,
  getEligibleBeneficiariasCount,
  searchBeneficiarias,
  getDispatchLogs,
  triggerCampaignDispatch,
  getBeneficiariaFilterOptions,
  getBeneficiariasCountForFilter,
  type BeneficiariaFilter,
  type DispatchTarget,
} from "./actions";

interface Beneficiaria {
  id: string;
  nome_completo: string;
  nome_social: string;
  telefone: string;
  cpf?: string;
}

type ConfigOption = { id: number; nome: string };
interface FilterOptions {
  racas: ConfigOption[];
  estadosCivis: ConfigOption[];
  escolaridades: ConfigOption[];
  situacoesTrabalho: ConfigOption[];
  bairros: ConfigOption[];
}

const EMPTY_FILTER: BeneficiariaFilter = {
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

// Conta quantos critérios estão ativos no filtro (para exibir no resumo).
function countActiveFilters(f: BeneficiariaFilter): number {
  let n = 0;
  if (f.busca && f.busca.trim()) n++;
  if (f.status && f.status.trim()) n++;
  n += (f.raca_cor_id?.length ? 1 : 0);
  n += (f.estado_civil_id?.length ? 1 : 0);
  n += (f.escolaridade_id?.length ? 1 : 0);
  n += (f.situacao_trabalho_id?.length ? 1 : 0);
  n += (f.bairro?.length ? 1 : 0);
  if (f.recebe_bolsa_familia === true || f.recebe_bolsa_familia === false) n++;
  if (f.recebe_bpc === true || f.recebe_bpc === false) n++;
  if (f.possui_medida_protetiva === true || f.possui_medida_protetiva === false) n++;
  if (typeof f.filhos_min === "number" || typeof f.filhos_max === "number") n++;
  if (typeof f.idade_min === "number" || typeof f.idade_max === "number") n++;
  if (f.aniversariantes_hoje) n++;
  return n;
}

interface Campaign {
  id?: string;
  nome: string;
  objetivo?: string;
  mensagem: string;
  status: "draft" | "scheduled" | "running" | "paused" | "completed";
  data_envio?: string | null;
  date_created?: string;
}

interface ConnectionConfig {
  id?: number;
  evolution_api_url: string;
  evolution_api_token: string;
  evolution_api_instance: string;
  n8n_webhook_url: string;
}

export function WhatsappClient() {
  const [activeTab, setActiveTab] = useState<"campaigns" | "config" | "logs">("campaigns");
  const [isPending, startTransition] = useTransition();

  // Connection State
  const [config, setConfig] = useState<ConnectionConfig>({
    evolution_api_url: "",
    evolution_api_token: "",
    evolution_api_instance: "",
    n8n_webhook_url: "",
  });
  const [connectionState, setConnectionState] = useState<{
    tested: boolean;
    connected: boolean;
    state: string;
    loading: boolean;
  }>({ tested: false, connected: false, state: "unknown", loading: false });

  // Data Lists
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [eligibleCount, setEligibleCount] = useState(0);
  const [dispatchLogs, setDispatchLogs] = useState<any[]>([]);

  // Dialog States
  const [campaignFormOpen, setCampaignFormOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [dispatchDialogOpen, setDispatchDialogOpen] = useState(false);
  const [selectedCampaignForDispatch, setSelectedCampaignForDispatch] = useState<Campaign | null>(null);
  const [openingDispatchId, setOpeningDispatchId] = useState<string | null>(null);

  // Público-alvo do disparo
  // "all" = todas elegíveis; "manual" = seleção específica; "filtered" = por filtros
  const [audienceMode, setAudienceMode] = useState<"all" | "manual" | "filtered">("all");
  const [searchBeneficiaria, setSearchBeneficiaria] = useState("");
  const [searchResults, setSearchResults] = useState<Beneficiaria[]>([]);
  const [searchingAudience, setSearchingAudience] = useState(false);
  const [selectedBeneficiarias, setSelectedBeneficiarias] = useState<string[]>([]);
  const [dispatching, setDispatching] = useState(false);

  // Filtros estruturados de público
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [loadingFilterOptions, setLoadingFilterOptions] = useState(false);
  const [filterValue, setFilterValue] = useState<BeneficiariaFilter>(EMPTY_FILTER);
  const [filteredCount, setFilteredCount] = useState<number | null>(null);
  const [countingFilter, setCountingFilter] = useState(false);

  // Form states for campaign
  const [campaignName, setCampaignName] = useState("");
  const [campaignObjective, setCampaignObjective] = useState("");
  const [campaignMessage, setCampaignMessage] = useState("");

  const refreshData = async () => {
    startTransition(async () => {
      // Note: a contagem de elegíveis é leve (aggregate); a lista completa
      // NÃO é mais carregada aqui — ela é buscada sob demanda (busca server-side)
      // ao abrir o disparo, evitando travar a página com milhares de registros.
      const [configRes, campaignsRes, countRes, logsRes] = await Promise.all([
        getWhatsappConfig(),
        getWhatsappCampaigns(),
        getEligibleBeneficiariasCount(),
        getDispatchLogs(),
      ]);

      if (configRes.success && configRes.data) {
        setConfig({
          id: configRes.data.id,
          evolution_api_url: configRes.data.evolution_api_url || "",
          evolution_api_token: configRes.data.evolution_api_token || "",
          evolution_api_instance: configRes.data.evolution_api_instance || "",
          n8n_webhook_url: configRes.data.n8n_webhook_url || "",
        });
      } else if (configRes.error) {
        toast.error(configRes.error);
      }

      if (campaignsRes.success) {
        setCampaigns(campaignsRes.data || []);
      } else if (campaignsRes.error) {
        toast.error(campaignsRes.error);
      }

      if (countRes.success) {
        setEligibleCount(countRes.count || 0);
      } else if (countRes.error) {
        toast.error(countRes.error);
      }

      if (logsRes.success) {
        setDispatchLogs(logsRes.data || []);
      } else if (logsRes.error) {
        toast.error(logsRes.error);
      }
    });
  };


  useEffect(() => {
    refreshData();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await saveWhatsappConfig(config);
      if (res.success) {
        toast.success("Configurações salvas com sucesso!");
        refreshData();
      } else {
        toast.error("Erro ao salvar configurações.");
      }
    } catch (err) {
      toast.error("Ocorreu um erro ao salvar as configurações.");
    }
  };

  const handleTestConnection = async () => {
    setConnectionState((prev) => ({ ...prev, loading: true }));
    try {
      const res = await testEvolutionConnection({
        url: config.evolution_api_url,
        token: config.evolution_api_token,
      });

      if (res.success) {
        setConnectionState({
          tested: true,
          connected: res.isConnected,
          state: res.state,
          loading: false,
        });
        if (res.isConnected) {
          toast.success("Conectado ao GoWA com sucesso!");
        } else {
          toast.warning("GoWA acessível, mas nenhum WhatsApp logado. Faça o login/QR Code no painel do GoWA.");
        }
      } else {
        setConnectionState({
          tested: true,
          connected: false,
          state: "disconnected",
          loading: false,
        });
        toast.error(res.error || "Não foi possível conectar.");
      }
    } catch (err) {
      setConnectionState({
        tested: true,
        connected: false,
        state: "error",
        loading: false,
      });
      toast.error("Erro inesperado ao conectar.");
    }
  };

  const handleOpenCampaignForm = (camp?: Campaign) => {
    if (camp) {
      setEditingCampaign(camp);
      setCampaignName(camp.nome);
      setCampaignObjective(camp.objetivo || "");
      setCampaignMessage(camp.mensagem);
    } else {
      setEditingCampaign(null);
      setCampaignName("");
      setCampaignObjective("");
      setCampaignMessage("");
    }
    setCampaignFormOpen(true);
  };

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName || !campaignMessage) {
      toast.error("Nome da campanha e mensagem são obrigatórios.");
      return;
    }

    try {
      const res = await saveWhatsappCampaign({
        id: editingCampaign?.id,
        nome: campaignName,
        objetivo: campaignObjective,
        mensagem: campaignMessage,
        status: editingCampaign?.status || "draft",
      });

      if (res.success) {
        toast.success(editingCampaign ? "Campanha atualizada!" : "Campanha criada com sucesso!");
        setCampaignFormOpen(false);
        refreshData();
      } else {
        toast.error("Erro ao salvar campanha.");
      }
    } catch (err) {
      toast.error("Erro ao processar requisição.");
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta campanha?")) return;

    try {
      const res = await deleteWhatsappCampaign(id);
      if (res.success) {
        toast.success("Campanha excluída com sucesso.");
        refreshData();
      } else {
        toast.error("Erro ao excluir campanha.");
      }
    } catch (err) {
      toast.error("Erro ao processar requisição.");
    }
  };

  const handleOpenDispatch = (camp: Campaign) => {
    // Feedback imediato no botão da linha enquanto o painel abre.
    setOpeningDispatchId(camp.id ?? null);
    setSelectedCampaignForDispatch(camp);
    setAudienceMode("all");
    setSelectedBeneficiarias([]);
    setSearchBeneficiaria("");
    setSearchResults([]);
    setDispatchDialogOpen(true);
    // O painel é leve e abre instantaneamente; libera o estado de "abrindo".
    setTimeout(() => setOpeningDispatchId(null), 400);
  };

  // Busca server-side (debounce) — só quando em modo manual e painel aberto.
  useEffect(() => {
    if (!dispatchDialogOpen || audienceMode !== "manual") return;
    let active = true;
    setSearchingAudience(true);
    const t = setTimeout(async () => {
      const res = await searchBeneficiarias(searchBeneficiaria);
      if (!active) return;
      if (res.success) {
        setSearchResults(res.data || []);
      } else {
        toast.error(res.error || "Erro ao buscar beneficiárias.");
        setSearchResults([]);
      }
      setSearchingAudience(false);
    }, 350);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [searchBeneficiaria, audienceMode, dispatchDialogOpen]);

  // Carrega as opções dos selects de filtro na 1ª vez que o disparo é aberto.
  useEffect(() => {
    if (!dispatchDialogOpen || filterOptions || loadingFilterOptions) return;
    let active = true;
    setLoadingFilterOptions(true);
    (async () => {
      const res = await getBeneficiariaFilterOptions();
      if (!active) return;
      if (res.success && res.data) {
        setFilterOptions(res.data as FilterOptions);
      } else {
        toast.error((res as any).error || "Erro ao carregar opções de filtro.");
      }
      setLoadingFilterOptions(false);
    })();
    return () => {
      active = false;
    };
  }, [dispatchDialogOpen, filterOptions, loadingFilterOptions]);

  // Contagem ao vivo do público filtrado (debounce).
  useEffect(() => {
    if (!dispatchDialogOpen || audienceMode !== "filtered") return;
    let active = true;
    setCountingFilter(true);
    const t = setTimeout(async () => {
      const res = await getBeneficiariasCountForFilter(filterValue);
      if (!active) return;
      if (res.success) {
        setFilteredCount(res.count ?? 0);
      } else {
        toast.error((res as any).error || "Erro ao contar o público.");
        setFilteredCount(0);
      }
      setCountingFilter(false);
    }, 400);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [filterValue, audienceMode, dispatchDialogOpen]);

  // Alterna um id em um campo multi-seleção do filtro.
  const toggleFilterId = (
    field: "raca_cor_id" | "estado_civil_id" | "escolaridade_id" | "situacao_trabalho_id" | "bairro",
    id: number,
  ) => {
    setFilterValue((prev) => {
      const cur = (prev[field] as number[]) || [];
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
      return { ...prev, [field]: next };
    });
  };

  const resetFilter = () => {
    setFilterValue(EMPTY_FILTER);
  };

  const activeFilterCount = countActiveFilters(filterValue);

  const renderChipGroup = (
    label: string,
    field: "raca_cor_id" | "estado_civil_id" | "escolaridade_id" | "situacao_trabalho_id" | "bairro",
    opts: ConfigOption[],
  ) => {
    const selected = (filterValue[field] as number[]) || [];
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
                  onClick={() => toggleFilterId(field, o.id)}
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
    const val = filterValue[field];
    const opt = (lbl: string, v: boolean | null) => (
      <button
        type="button"
        onClick={() => setFilterValue((p) => ({ ...p, [field]: v }))}
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

  // Lê um input numérico opcional (vazio => null).
  const numOrNull = (v: string): number | null => {
    if (v.trim() === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const handleTriggerDispatch = async () => {
    if (!selectedCampaignForDispatch) return;

    if (audienceMode === "manual" && selectedBeneficiarias.length === 0) {
      toast.error("Selecione pelo menos uma beneficiária para envio.");
      return;
    }
    if (audienceMode === "filtered" && (filteredCount ?? 0) === 0) {
      toast.error("Nenhuma beneficiária corresponde aos filtros selecionados.");
      return;
    }

    const target: DispatchTarget =
      audienceMode === "all"
        ? { mode: "all" }
        : audienceMode === "filtered"
          ? { mode: "filtered", filter: filterValue }
          : { mode: "selected", ids: selectedBeneficiarias };

    setDispatching(true);
    try {
      const res = await triggerCampaignDispatch(
        selectedCampaignForDispatch.id!,
        target
      );

      if (res.success) {
        toast.success(
          `Disparo finalizado: ${res.successCount} enviados, ${res.failedCount} falhas de um total de ${res.total}.`
        );
        setDispatchDialogOpen(false);
        refreshData();
      } else {
        toast.error(res.error || "Erro ao disparar campanha.");
      }
    } catch (err) {
      toast.error("Falha ao executar disparos.");
    } finally {
      setDispatching(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Seleciona os resultados atualmente carregados (até 50 por busca).
      setSelectedBeneficiarias((prev) =>
        Array.from(new Set([...prev, ...searchResults.map((b) => b.id)]))
      );
    } else {
      const idsToRemove = new Set(searchResults.map((b) => b.id));
      setSelectedBeneficiarias((prev) =>
        prev.filter((id) => !idsToRemove.has(id))
      );
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedBeneficiarias((prev) => [...prev, id]);
    } else {
      setSelectedBeneficiarias((prev) => prev.filter((item) => item !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Smartphone className="h-8 w-8 text-purple-600" />
            Campanhas WhatsApp
          </h1>
          <p className="text-slate-500 mt-1">
            Gestão de campanhas inbound e outbound e envio automatizado de informativos para beneficiárias.
          </p>
        </div>
        
        {/* Connection Widget */}
        <div className="flex items-center gap-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/50 rounded-xl p-3">
          <div className="flex flex-col">
            <span className="text-xs text-purple-700 dark:text-purple-300 font-medium">GoWA (WhatsApp)</span>
            <span className="text-[10px] text-slate-500 font-mono truncate max-w-[120px]">
              {config.evolution_api_url || "Nenhum configurado"}
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 border-purple-200 text-purple-700 hover:bg-purple-100"
            onClick={handleTestConnection}
            disabled={connectionState.loading || !config.evolution_api_url}
          >
            {connectionState.loading ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <Activity className="h-3 w-3 mr-1" />
            )}
            Testar Conexão
          </Button>
          {connectionState.tested && (
            <Badge
              variant={connectionState.connected ? "default" : "destructive"}
              className={connectionState.connected ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {connectionState.connected ? "Conectado" : "Offline"}
            </Badge>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-sm border-slate-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total de Campanhas</CardTitle>
            <MessageSquare className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length}</div>
            <p className="text-xs text-slate-500 mt-1">Registradas no canal WhatsApp</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-slate-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Mulheres Elegíveis</CardTitle>
            <Users className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eligibleCount.toLocaleString("pt-BR")}</div>
            <p className="text-xs text-slate-500 mt-1">Beneficiárias com número cadastrado</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Disparos Recentes</CardTitle>
            <History className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dispatchLogs.filter((l) => l.status === "sent").length}
            </div>
            <p className="text-xs text-slate-500 mt-1">Sucessos registrados na linha do tempo</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100">
        <button
          onClick={() => setActiveTab("campaigns")}
          className={`py-3 px-6 font-medium text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "campaigns"
              ? "border-purple-600 text-purple-600 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Campanhas
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`py-3 px-6 font-medium text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "logs"
              ? "border-purple-600 text-purple-600 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <History className="h-4 w-4" />
          Histórico de Envio
        </button>
        <button
          onClick={() => setActiveTab("config")}
          className={`py-3 px-6 font-medium text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "config"
              ? "border-purple-600 text-purple-600 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Settings className="h-4 w-4" />
          Configuração da Conexão
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {/* CAMPAIGNS TAB */}
        {activeTab === "campaigns" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 shadow-sm">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">Modelos de Campanhas WhatsApp</h3>
              <Button onClick={() => handleOpenCampaignForm()} className="bg-purple-600 hover:bg-purple-700 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Criar Campanha
              </Button>
            </div>

            <div className="rounded-xl border border-slate-100 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-950">
                  <TableRow>
                    <TableHead className="w-[200px]">Nome</TableHead>
                    <TableHead className="w-[250px]">Objetivo</TableHead>
                    <TableHead>Mensagem</TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                    <TableHead className="text-right w-[150px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-slate-400">
                        Nenhuma campanha WhatsApp cadastrada. Clique em &quot;Criar Campanha&quot; para começar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    campaigns.map((camp) => (
                      <TableRow key={camp.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-semibold text-slate-800 dark:text-slate-200">
                          {camp.nome}
                        </TableCell>
                        <TableCell className="text-slate-500 text-sm">
                          {camp.objetivo || <span className="italic opacity-50">Não informado</span>}
                        </TableCell>
                        <TableCell className="text-slate-600 max-w-[400px] truncate text-sm">
                          {camp.mensagem}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              camp.status === "completed"
                                ? "bg-green-600"
                                : camp.status === "running"
                                ? "bg-purple-600"
                                : "bg-slate-500"
                            }
                          >
                            {camp.status === "completed"
                              ? "Concluído"
                              : camp.status === "running"
                              ? "Disparando"
                              : "Rascunho"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Disparar Campanha"
                            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                            onClick={() => handleOpenDispatch(camp)}
                            disabled={openingDispatchId === camp.id}
                          >
                            {openingDispatchId === camp.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Editar"
                            onClick={() => handleOpenCampaignForm(camp)}
                          >
                            <Edit className="h-4 w-4 text-blue-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Excluir"
                            onClick={() => handleDeleteCampaign(camp.id!)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* LOGS TAB */}
        {activeTab === "logs" && (
          <Card className="shadow-sm border-slate-100">
            <CardHeader>
              <CardTitle>Linha do Tempo de Disparos</CardTitle>
              <CardDescription>Histórico detalhado das mensagens de WhatsApp enviadas para as beneficiárias.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-slate-100 overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-950">
                    <TableRow>
                      <TableHead>Beneficiária</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Campanha</TableHead>
                      <TableHead>Data de Envio</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Detalhes / Erro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dispatchLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-slate-400">
                          Nenhum registro de disparo encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      dispatchLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">
                            {log.beneficiaria_id?.nome_completo || "Desconhecida"}
                          </TableCell>
                          <TableCell className="font-mono text-sm text-slate-500">
                            {log.beneficiaria_id?.telefone || "-"}
                          </TableCell>
                          <TableCell className="text-slate-600 text-sm">
                            {log.campanha_id?.nome || "Sem campanha"}
                          </TableCell>
                          <TableCell className="text-slate-500 text-sm">
                            {log.data_envio
                              ? new Date(log.data_envio).toLocaleString("pt-BR")
                              : new Date(log.date_created).toLocaleString("pt-BR")}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                log.status === "sent"
                                  ? "default"
                                  : log.status === "scheduled"
                                  ? "secondary"
                                  : "destructive"
                              }
                              className={
                                log.status === "sent"
                                  ? "bg-green-600 hover:bg-green-600 text-white"
                                  : log.status === "scheduled"
                                  ? "bg-blue-600 hover:bg-blue-600 text-white"
                                  : ""
                              }
                            >
                              {log.status === "sent"
                                ? "Enviado"
                                : log.status === "scheduled"
                                ? "Em Fila"
                                : "Falhou"}
                            </Badge>
                          </TableCell>
                          <TableCell className="align-top">
                            {log.detalhes_erro ? (
                              <p className="max-w-[320px] whitespace-pre-wrap break-words text-xs leading-relaxed text-red-600">
                                {log.detalhes_erro}
                              </p>
                            ) : (
                              <span className="text-xs text-slate-400">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* CONFIG TAB */}
        {activeTab === "config" && (
          <Card className="shadow-sm border-slate-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-purple-600" />
                Configuração de Integração
              </CardTitle>
              <CardDescription>
                Configure os parâmetros de conexão do GoWA (WhatsApp) e do n8n para disparo automático.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveConfig} className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-slate-900 dark:text-slate-100 border-b pb-2 flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-purple-600" />
                    GoWA (WhatsApp Direto)
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">URL do GoWA</label>
                      <Input
                        placeholder="http://192.168.0.118:3000"
                        value={config.evolution_api_url}
                        onChange={(e) => setConfig({ ...config, evolution_api_url: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Basic Auth (usuário:senha)</label>
                      <Input
                        type="password"
                        placeholder="usuario:senha"
                        value={config.evolution_api_token}
                        onChange={(e) => setConfig({ ...config, evolution_api_token: e.target.value })}
                      />
                      <p className="text-[11px] text-slate-500">
                        As credenciais Basic Auth do GoWA, no formato <code>usuario:senha</code> (variáveis SERVICE_USER_GOWA e SERVICE_PASSWORD_GOWA).
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium text-slate-900 dark:text-slate-100 border-b pb-2 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-indigo-600" />
                    Workflow n8n (Fila & Inbound)
                  </h4>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">URL do Webhook do n8n</label>
                    <Input
                      placeholder="https://n8n.exemplo.com/webhook/campanha-whatsapp"
                      value={config.n8n_webhook_url}
                      onChange={(e) => setConfig({ ...config, n8n_webhook_url: e.target.value })}
                    />
                    <p className="text-[11px] text-slate-500">
                      Caso preenchido, os disparos também notificarão este webhook no n8n com o payload completo do envio da campanha.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">
                    Salvar Configurações
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>

      {/* CAMPAIGN DIALOG FORM */}
      <Dialog open={campaignFormOpen} onOpenChange={setCampaignFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingCampaign ? "Editar Campanha" : "Nova Campanha WhatsApp"}</DialogTitle>
            <DialogDescription>
              Crie o modelo de mensagem para enviar em lote para as beneficiárias.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveCampaign} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome da Campanha</label>
              <Input
                placeholder="Ex: Informativo Outubro Rosa"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Objetivo / Observação</label>
              <Input
                placeholder="Ex: Conscientização de saúde da mulher"
                value={campaignObjective}
                onChange={(e) => setCampaignObjective(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Mensagem do WhatsApp</label>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-[9px] cursor-pointer" onClick={() => setCampaignMessage((p) => p + " {primeiro_nome}")}>
                    + Primeiro Nome
                  </Badge>
                  <Badge variant="outline" className="text-[9px] cursor-pointer" onClick={() => setCampaignMessage((p) => p + " {nome_completo}")}>
                    + Nome Completo
                  </Badge>
                </div>
              </div>
              <textarea
                className="w-full h-36 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 dark:bg-slate-950"
                placeholder="Olá {primeiro_nome}, informamos que no mês de Outubro estamos com exames preventivos agendados..."
                value={campaignMessage}
                onChange={(e) => setCampaignMessage(e.target.value)}
                required
              />
              <p className="text-[10px] text-slate-500 flex items-center gap-1">
                <Info className="h-3 w-3" />
                Variáveis dinâmicas como &quot;{`{primeiro_nome}`}&quot; e &quot;{`{nome_completo}`}&quot; serão substituídas automaticamente antes de enviar.
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setCampaignFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">
                {editingCampaign ? "Atualizar" : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DISPATCH FLOW SHEET (SELECT BENEFICIARIES & TRIGGER SEND) */}
      <Sheet open={dispatchDialogOpen} onOpenChange={setDispatchDialogOpen}>
        <SheetContent className="sm:max-w-xl flex flex-col h-full bg-white dark:bg-slate-900 border-l border-slate-100">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-purple-600" />
              Disparar Campanha
            </SheetTitle>
            <SheetDescription>
              Selecione o público-alvo (beneficiárias com celular cadastrado) e envie a mensagem em lote.
            </SheetDescription>
          </SheetHeader>

          {selectedCampaignForDispatch && (
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/50 rounded-lg">
                <h4 className="font-semibold text-xs text-purple-900 dark:text-purple-300">Mensagem da Campanha:</h4>
                <p className="text-xs text-purple-700 dark:text-purple-400 mt-1 italic whitespace-pre-wrap">
                  &quot;{selectedCampaignForDispatch.mensagem}&quot;
                </p>
              </div>

              {/* Seleção de público */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAudienceMode("all")}
                  className={cn(
                    "flex flex-col items-start gap-0.5 rounded-lg border p-3 text-left transition-colors",
                    audienceMode === "all"
                      ? "border-purple-300 bg-purple-50 dark:bg-purple-950/20 ring-1 ring-purple-300"
                      : "border-slate-200 hover:bg-slate-50",
                  )}
                >
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                    <Users className="h-4 w-4 text-purple-600" />
                    Todas
                  </span>
                  <span className="text-xs text-slate-500">
                    {eligibleCount.toLocaleString("pt-BR")} elegíveis
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setAudienceMode("filtered")}
                  className={cn(
                    "flex flex-col items-start gap-0.5 rounded-lg border p-3 text-left transition-colors",
                    audienceMode === "filtered"
                      ? "border-purple-300 bg-purple-50 dark:bg-purple-950/20 ring-1 ring-purple-300"
                      : "border-slate-200 hover:bg-slate-50",
                  )}
                >
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                    <SlidersHorizontal className="h-4 w-4 text-purple-600" />
                    Por filtros
                  </span>
                  <span className="text-xs text-slate-500">
                    {activeFilterCount > 0
                      ? `${activeFilterCount} filtro(s)`
                      : "Segmentar"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setAudienceMode("manual")}
                  className={cn(
                    "flex flex-col items-start gap-0.5 rounded-lg border p-3 text-left transition-colors",
                    audienceMode === "manual"
                      ? "border-purple-300 bg-purple-50 dark:bg-purple-950/20 ring-1 ring-purple-300"
                      : "border-slate-200 hover:bg-slate-50",
                  )}
                >
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                    <Search className="h-4 w-4 text-purple-600" />
                    Selecionar
                  </span>
                  <span className="text-xs text-slate-500">
                    {selectedBeneficiarias.length} selecionada(s)
                  </span>
                </button>
              </div>

              {audienceMode === "all" ? (
                <div className="flex items-start gap-2 rounded-lg border border-purple-100 bg-purple-50/60 dark:bg-purple-950/10 p-4 text-sm text-purple-900 dark:text-purple-300">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    A mensagem será enviada para{" "}
                    <strong>
                      todas as {eligibleCount.toLocaleString("pt-BR")} beneficiárias
                    </strong>{" "}
                    com WhatsApp cadastrado. O envio é processado no servidor.
                  </span>
                </div>
              ) : audienceMode === "filtered" ? (
                <div className="space-y-4">
                  {/* Resumo do público filtrado */}
                  <div className="flex items-center justify-between rounded-lg border border-purple-100 bg-purple-50/60 dark:bg-purple-950/10 p-3">
                    <div className="flex items-center gap-2 text-sm text-purple-900 dark:text-purple-300">
                      <Users className="h-4 w-4" />
                      {countingFilter ? (
                        <span className="flex items-center gap-1.5">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Calculando...
                        </span>
                      ) : (
                        <span>
                          <strong>{(filteredCount ?? 0).toLocaleString("pt-BR")}</strong>{" "}
                          beneficiária(s) correspondem
                        </span>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-slate-500"
                      onClick={resetFilter}
                      disabled={activeFilterCount === 0}
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1" /> Limpar
                    </Button>
                  </div>

                  {loadingFilterOptions && !filterOptions ? (
                    <div className="flex items-center justify-center gap-2 p-6 text-xs text-slate-400">
                      <Loader2 className="h-4 w-4 animate-spin" /> Carregando filtros...
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Busca textual */}
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                          className="pl-9 h-9"
                          placeholder="Nome, telefone ou CPF..."
                          value={filterValue.busca || ""}
                          onChange={(e) =>
                            setFilterValue((p) => ({ ...p, busca: e.target.value }))
                          }
                        />
                      </div>

                      {/* Aniversariantes de hoje (atalho) */}
                      <button
                        type="button"
                        onClick={() =>
                          setFilterValue((p) => ({
                            ...p,
                            aniversariantes_hoje: !p.aniversariantes_hoje,
                          }))
                        }
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors",
                          filterValue.aniversariantes_hoje
                            ? "border-purple-300 bg-purple-50 ring-1 ring-purple-300 dark:bg-purple-950/20"
                            : "border-slate-200 hover:bg-slate-50",
                        )}
                      >
                        <span className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            🎂 Aniversariantes de hoje
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Quem faz aniversário na data de hoje
                          </span>
                        </span>
                        <Checkbox checked={!!filterValue.aniversariantes_hoje} className="pointer-events-none" />
                      </button>

                      {/* Status */}
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
                              onClick={() => setFilterValue((p) => ({ ...p, status: s.v }))}
                              className={cn(
                                "flex-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                                (filterValue.status || "") === s.v
                                  ? "bg-purple-600 text-white"
                                  : "text-slate-600 hover:bg-slate-100",
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
                              value={filterValue.idade_min ?? ""}
                              onChange={(e) =>
                                setFilterValue((p) => ({ ...p, idade_min: numOrNull(e.target.value) }))
                              }
                            />
                            <span className="text-xs text-slate-400">a</span>
                            <Input
                              type="number"
                              min={0}
                              className="h-8"
                              placeholder="máx"
                              value={filterValue.idade_max ?? ""}
                              onChange={(e) =>
                                setFilterValue((p) => ({ ...p, idade_max: numOrNull(e.target.value) }))
                              }
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
                              value={filterValue.filhos_min ?? ""}
                              onChange={(e) =>
                                setFilterValue((p) => ({ ...p, filhos_min: numOrNull(e.target.value) }))
                              }
                            />
                            <span className="text-xs text-slate-400">a</span>
                            <Input
                              type="number"
                              min={0}
                              className="h-8"
                              placeholder="máx"
                              value={filterValue.filhos_max ?? ""}
                              onChange={(e) =>
                                setFilterValue((p) => ({ ...p, filhos_max: numOrNull(e.target.value) }))
                              }
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
                      {filterOptions && (
                        <div className="space-y-4">
                          {renderChipGroup("Bairro", "bairro", filterOptions.bairros)}
                          {renderChipGroup("Raça / Cor", "raca_cor_id", filterOptions.racas)}
                          {renderChipGroup("Estado civil", "estado_civil_id", filterOptions.estadosCivis)}
                          {renderChipGroup("Escolaridade", "escolaridade_id", filterOptions.escolaridades)}
                          {renderChipGroup("Situação de trabalho", "situacao_trabalho_id", filterOptions.situacoesTrabalho)}
                        </div>
                      )}

                      <p className="text-[10px] text-slate-400">
                        Apenas beneficiárias com WhatsApp cadastrado entram no envio. Critérios
                        vazios não restringem o público.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Busca server-side */}
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      className="pl-9 h-9"
                      placeholder="Buscar por nome ou telefone..."
                      value={searchBeneficiaria}
                      onChange={(e) => setSearchBeneficiaria(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-between items-center px-2 py-1">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="select-all"
                        checked={
                          searchResults.length > 0 &&
                          searchResults.every((b) => selectedBeneficiarias.includes(b.id))
                        }
                        onCheckedChange={(checked) => handleSelectAll(!!checked)}
                        disabled={searchResults.length === 0}
                      />
                      <label htmlFor="select-all" className="text-xs font-semibold text-slate-700 cursor-pointer">
                        Selecionar resultados ({searchResults.length})
                      </label>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                      {selectedBeneficiarias.length} selecionada(s)
                    </span>
                  </div>

                  <div className="border border-slate-100 rounded-lg max-h-[300px] overflow-y-auto divide-y divide-slate-100">
                    {searchingAudience ? (
                      <div className="flex items-center justify-center gap-2 p-6 text-xs text-slate-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Buscando beneficiárias...
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        {searchBeneficiaria
                          ? "Nenhuma beneficiária encontrada para esta busca."
                          : "Digite um nome ou telefone para localizar beneficiárias."}
                      </div>
                    ) : (
                      searchResults.map((b) => (
                        <div key={b.id} className="flex items-center justify-between p-3 hover:bg-slate-50/50">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`b-${b.id}`}
                              checked={selectedBeneficiarias.includes(b.id)}
                              onCheckedChange={(checked) => handleSelectOne(b.id, !!checked)}
                            />
                            <div className="flex flex-col text-left">
                              <label htmlFor={`b-${b.id}`} className="text-xs font-medium text-slate-800 dark:text-slate-200 cursor-pointer">
                                {b.nome_social || b.nome_completo}
                              </label>
                              <span className="text-[10px] text-slate-500 font-mono">{b.telefone}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 px-1">
                    Mostrando até 50 resultados por busca. Refine o termo para
                    encontrar outras beneficiárias.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Bottom Actions */}
          <div className="border-t pt-4 mt-auto">
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setDispatchDialogOpen(false)} disabled={dispatching}>
                Cancelar
              </Button>
              <Button
                onClick={handleTriggerDispatch}
                disabled={
                  dispatching ||
                  (audienceMode === "manual" && selectedBeneficiarias.length === 0) ||
                  (audienceMode === "all" && eligibleCount === 0) ||
                  (audienceMode === "filtered" && (countingFilter || (filteredCount ?? 0) === 0))
                }
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {dispatching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Disparando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {audienceMode === "all"
                      ? `Disparar para todas (${eligibleCount.toLocaleString("pt-BR")})`
                      : audienceMode === "filtered"
                        ? `Disparar para ${(filteredCount ?? 0).toLocaleString("pt-BR")} filtrada(s)`
                        : `Disparar para ${selectedBeneficiarias.length}`}
                  </>
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
