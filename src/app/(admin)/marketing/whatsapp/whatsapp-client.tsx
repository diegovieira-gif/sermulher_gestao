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
} from "lucide-react";
import {
  getWhatsappConfig,
  saveWhatsappConfig,
  testEvolutionConnection,
  getWhatsappCampaigns,
  saveWhatsappCampaign,
  deleteWhatsappCampaign,
  getBeneficiariasList,
  getDispatchLogs,
  triggerCampaignDispatch,
} from "./actions";

interface Beneficiaria {
  id: string;
  nome_completo: string;
  nome_social: string;
  telefone: string;
  cpf?: string;
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
  const [beneficiarias, setBeneficiarias] = useState<Beneficiaria[]>([]);
  const [dispatchLogs, setDispatchLogs] = useState<any[]>([]);

  // Dialog States
  const [campaignFormOpen, setCampaignFormOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [dispatchDialogOpen, setDispatchDialogOpen] = useState(false);
  const [selectedCampaignForDispatch, setSelectedCampaignForDispatch] = useState<Campaign | null>(null);
  
  // Selection / Search for send campaign dialog
  const [searchBeneficiaria, setSearchBeneficiaria] = useState("");
  const [selectedBeneficiarias, setSelectedBeneficiarias] = useState<string[]>([]);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchProgress, setDispatchProgress] = useState({ current: 0, total: 0 });

  // Form states for campaign
  const [campaignName, setCampaignName] = useState("");
  const [campaignObjective, setCampaignObjective] = useState("");
  const [campaignMessage, setCampaignMessage] = useState("");

  const refreshData = async () => {
    startTransition(async () => {
      const [configRes, campaignsRes, beneficiariasRes, logsRes] = await Promise.all([
        getWhatsappConfig(),
        getWhatsappCampaigns(),
        getBeneficiariasList(),
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
      }
      if (campaignsRes.success) setCampaigns(campaignsRes.data || []);
      if (beneficiariasRes.success) setBeneficiarias(beneficiariasRes.data || []);
      if (logsRes.success) setDispatchLogs(logsRes.data || []);
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
        instance: config.evolution_api_instance,
      });

      if (res.success) {
        setConnectionState({
          tested: true,
          connected: res.isConnected,
          state: res.state,
          loading: false,
        });
        if (res.isConnected) {
          toast.success("Conectado à Evolution API com sucesso!");
        } else {
          toast.warning(`Instância ativa mas status é: ${res.state}. Abra o WhatsApp.`);
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
    setSelectedCampaignForDispatch(camp);
    setSelectedBeneficiarias(beneficiarias.map((b) => b.id)); // Select all by default
    setSearchBeneficiaria("");
    setDispatchDialogOpen(true);
  };

  const handleTriggerDispatch = async () => {
    if (!selectedCampaignForDispatch || selectedBeneficiarias.length === 0) {
      toast.error("Selecione pelo menos uma beneficiária para envio.");
      return;
    }

    setDispatching(true);
    setDispatchProgress({ current: 0, total: selectedBeneficiarias.length });

    try {
      const res = await triggerCampaignDispatch(
        selectedCampaignForDispatch.id!,
        selectedBeneficiarias
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
      setSelectedBeneficiarias(beneficiarias.map((b) => b.id));
    } else {
      setSelectedBeneficiarias([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedBeneficiarias((prev) => [...prev, id]);
    } else {
      setSelectedBeneficiarias((prev) => prev.filter((item) => item !== id));
    }
  };

  const filteredBeneficiarias = beneficiarias.filter(
    (b) =>
      b.nome_completo.toLowerCase().includes(searchBeneficiaria.toLowerCase()) ||
      (b.nome_social && b.nome_social.toLowerCase().includes(searchBeneficiaria.toLowerCase())) ||
      b.telefone.includes(searchBeneficiaria)
  );

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
            <span className="text-xs text-purple-700 dark:text-purple-300 font-medium">Evolution API</span>
            <span className="text-[10px] text-slate-500 font-mono truncate max-w-[120px]">
              {config.evolution_api_instance || "Nenhum configurado"}
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
            <div className="text-2xl font-bold">{beneficiarias.length}</div>
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
                          >
                            <Send className="h-4 w-4" />
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dispatchLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-slate-400">
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
                              variant={log.status === "sent" ? "default" : "destructive"}
                              className={log.status === "sent" ? "bg-green-600" : ""}
                            >
                              {log.status === "sent" ? "Enviado" : "Falhou"}
                            </Badge>
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
                Configure os parâmetros de conexão da Evolution API e do n8n para disparo automático.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveConfig} className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-slate-900 dark:text-slate-100 border-b pb-2 flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-purple-600" />
                    Evolution API (WhatsApp Direto)
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">URL da Evolution API</label>
                      <Input
                        placeholder="https://api.exemplo.com"
                        value={config.evolution_api_url}
                        onChange={(e) => setConfig({ ...config, evolution_api_url: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Token Global / API Key</label>
                      <Input
                        type="password"
                        placeholder="API Key"
                        value={config.evolution_api_token}
                        onChange={(e) => setConfig({ ...config, evolution_api_token: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome da Instância</label>
                      <Input
                        placeholder="sermulher_whatsapp"
                        value={config.evolution_api_instance}
                        onChange={(e) => setConfig({ ...config, evolution_api_instance: e.target.value })}
                      />
                      <p className="text-[11px] text-slate-500">
                        O nome exato da instância do WhatsApp criada dentro do painel da Evolution API.
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

              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  className="pl-9 h-9"
                  placeholder="Buscar beneficiária por nome ou telefone..."
                  value={searchBeneficiaria}
                  onChange={(e) => setSearchBeneficiaria(e.target.value)}
                />
              </div>

              {/* Beneficiary List Selector */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-2 py-1">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="select-all"
                      checked={
                        filteredBeneficiarias.length > 0 &&
                        filteredBeneficiarias.every((b) => selectedBeneficiarias.includes(b.id))
                      }
                      onCheckedChange={(checked) => handleSelectAll(!!checked)}
                    />
                    <label htmlFor="select-all" className="text-xs font-semibold text-slate-700 cursor-pointer">
                      Selecionar Todas Filtradas ({filteredBeneficiarias.length})
                    </label>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {selectedBeneficiarias.length} selecionadas
                  </span>
                </div>

                <div className="border border-slate-100 rounded-lg max-h-[300px] overflow-y-auto divide-y divide-slate-100">
                  {filteredBeneficiarias.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      Nenhuma beneficiária elegível com WhatsApp cadastrado foi encontrada.
                    </div>
                  ) : (
                    filteredBeneficiarias.map((b) => (
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
              </div>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="border-t pt-4 mt-auto space-y-4">
            {dispatching && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span>Enviando Mensagens...</span>
                  <span>
                    {dispatchProgress.current} / {dispatchProgress.total}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-purple-600 h-2.5 rounded-full transition-all duration-300"
                    style={{
                      width: `${(dispatchProgress.current / dispatchProgress.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setDispatchDialogOpen(false)} disabled={dispatching}>
                Cancelar
              </Button>
              <Button
                onClick={handleTriggerDispatch}
                disabled={selectedBeneficiarias.length === 0 || dispatching}
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
                    Disparar WhatsApp Lote
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
