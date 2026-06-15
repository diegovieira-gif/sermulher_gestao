"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Eye,
  Activity,
  User,
  Clock,
  Database,
  Smartphone,
  Globe,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Info,
} from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAuditLogs, getRevisionDetails, type AuditLog, type Revision } from "./actions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const FRIENDLY_COLLECTIONS: Record<string, string> = {
  tramitacoes: "Gestão de Demandas",
  setores: "Setores",
  mulheres: "Mulheres (Indicadores)",
  beneficiarias: "Beneficiárias",
  atendimentos: "Atendimentos",
  eventos: "Agenda Institucional",
  salas_azul: "Sala Azul - Ciclos",
  infratores: "Sala Azul - Infratores",
  participacoes_sala_azul: "Sala Azul - Participações",
  frequencias_sala_azul: "Sala Azul - Frequências",
  config_origens: "Config - Origens",
  config_prioridades: "Config - Prioridades",
  config_tipos_evento: "Config - Tipos de Evento",
  config_tipos_agressao: "Config - Tipos de Agressão",
  config_niveis_periculosidade: "Config - Níveis de Periculosidade",
  config_status_legal: "Config - Status Legal",
  config_bairros: "Config - Bairros",
  config_beneficios: "Config - Benefícios",
  config_encaminhamentos: "Config - Encaminhamentos",
  config_campanhas: "Config - Campanhas",
  configuracoes_site: "Configurações do Site",
  directus_users: "Usuários do Sistema",
  directus_roles: "Perfis de Acesso",
  directus_permissions: "Permissões",
  directus_files: "Arquivos/Uploads",
  escola_cursos: "Escola - Cursos",
  escola_turmas: "Escola - Turmas",
  escola_matriculas: "Escola - Matrículas",
  escola_frequencias: "Escola - Frequências",
  app_amar_categorias: "App Amar - Categorias",
  app_amar_servicos: "App Amar - Serviços",
  app_amar_campanhas: "App Amar - Campanhas",
  app_amar_sonhos: "App Amar - Sonhos",
  app_amar_cursos: "App Amar - Cursos",
  app_amar_contatos: "App Amar - Contatos",
  app_amar_projetos: "App Amar - Projetos",
};

interface AuditoriaClientProps {
  initialLogs: AuditLog[];
  initialMeta: { filter_count: number; total_count: number };
  collections: any[];
}

export function AuditoriaClient({
  initialLogs,
  initialMeta,
  collections,
}: AuditoriaClientProps) {
  const [logs, setLogs] = useState<AuditLog[]>(initialLogs);
  const [meta, setMeta] = useState(initialMeta);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCollection, setSelectedCollection] = useState("all");
  const [selectedAction, setSelectedAction] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 20;

  // Estados do Dialog de Detalhes
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loadingRevisions, setLoadingRevisions] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Carrega os dados sempre que os filtros ou página mudarem
  const fetchLogs = async (currentPage: number) => {
    setLoading(true);
    try {
      const result = await getAuditLogs({
        search: searchTerm || undefined,
        collection: selectedCollection === "all" ? undefined : selectedCollection,
        action: selectedAction === "all" ? undefined : selectedAction,
        page: currentPage,
        limit,
      });

      if (result.success) {
        setLogs(result.data);
        setMeta(result.meta);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Debounce ou gatilho manual de pesquisa
  useEffect(() => {
    setPage(1);
    fetchLogs(1);
  }, [selectedCollection, selectedAction]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchLogs(newPage);
  };

  const handleOpenDetails = async (log: AuditLog) => {
    setSelectedLog(log);
    setIsDetailsOpen(true);
    setRevisions([]);
    setLoadingRevisions(true);

    try {
      const result = await getRevisionDetails(log.id);
      if (result.success) {
        setRevisions(result.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRevisions(false);
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "create":
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50">
            Criação
          </Badge>
        );
      case "update":
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50">
            Edição
          </Badge>
        );
      case "delete":
        return (
          <Badge className="bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50">
            Exclusão
          </Badge>
        );
      case "login":
      case "authenticate":
        return (
          <Badge className="bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-50">
            Autenticação
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-50">
            {action}
          </Badge>
        );
    }
  };

  const formatFriendlyCollection = (colName: string) => {
    return FRIENDLY_COLLECTIONS[colName] || colName;
  };

  const formatBrowser = (userAgent: string | null) => {
    if (!userAgent) return "Desconhecido";
    if (userAgent.includes("Chrome")) return "Google Chrome";
    if (userAgent.includes("Firefox")) return "Mozilla Firefox";
    if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) return "Apple Safari";
    if (userAgent.includes("Edge")) return "Microsoft Edge";
    return userAgent.split(" ")[0] || "Outro";
  };

  const totalPages = Math.ceil(meta.filter_count / limit) || 1;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary animate-pulse" />
            Auditoria do Sistema
          </h2>
          <p className="text-sm text-gray-500">
            Rastreabilidade e histórico detalhado das operações realizadas no sistema
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchLogs(page)}
          disabled={loading}
          className="gap-2 shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar Logs
        </Button>
      </div>

      {/* Painel de Filtros */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por usuário, email, coleção ou ID do registro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-gray-50/50"
            />
          </div>
          
          <div className="grid grid-cols-2 md:flex gap-3">
            <select
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-primary min-w-[180px]"
            >
              <option value="all">Todas as Coleções</option>
              {collections.map((col) => (
                <option key={col.collection} value={col.collection}>
                  {col.name} {col.isSystem ? "(Sistema)" : ""}
                </option>
              ))}
            </select>

            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-primary min-w-[150px]"
            >
              <option value="all">Todas as Ações</option>
              <option value="create">Criação</option>
              <option value="update">Edição</option>
              <option value="delete">Exclusão</option>
              <option value="authenticate">Autenticação</option>
            </select>

            <Button type="submit" variant="default" className="md:w-auto w-full">
              Buscar
            </Button>
          </div>
        </form>
      </div>

      {/* Tabela de Logs */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-[180px]">Usuário</TableHead>
                <TableHead className="w-[110px]">Ação</TableHead>
                <TableHead>Coleção</TableHead>
                <TableHead className="w-[100px]">Registro ID</TableHead>
                <TableHead className="w-[160px]">Data e Hora</TableHead>
                <TableHead className="w-[120px]">IP</TableHead>
                <TableHead className="w-[80px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow key={idx} className="animate-pulse">
                    <TableCell>
                      <div className="h-4 bg-gray-200 rounded w-28 mb-1" />
                      <div className="h-3 bg-gray-200 rounded w-36" />
                    </TableCell>
                    <TableCell><div className="h-6 bg-gray-200 rounded w-16" /></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 rounded w-32" /></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 rounded w-12" /></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 rounded w-24" /></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 rounded w-16" /></TableCell>
                    <TableCell className="text-right"><div className="h-8 bg-gray-200 rounded w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-36 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Info className="h-8 w-8 text-gray-300" />
                      <p>Nenhum log de auditoria encontrado para os filtros selecionados.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => {
                  const hasDetails = log.action === "create" || log.action === "update" || log.action === "delete";
                  return (
                    <TableRow key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                            {log.user?.first_name?.[0] || log.user?.email?.[0]?.toUpperCase() || "S"}
                          </div>
                          <div className="flex flex-col overflow-hidden">
                            <span className="font-semibold text-gray-900 truncate">
                              {log.user ? `${log.user.first_name} ${log.user.last_name || ""}` : "Sistema / API"}
                            </span>
                            <span className="text-xs text-gray-500 truncate">
                              {log.user?.email || "Chave Administrativa"}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell className="font-medium text-gray-800">
                        <div className="flex flex-col">
                          <span className="text-sm">{formatFriendlyCollection(log.collection)}</span>
                          <span className="text-[10px] font-mono text-gray-400">{log.collection}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-gray-600 font-semibold">
                        {log.item || "---"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {format(new Date(log.timestamp), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-gray-500">
                        {log.ip || "---"}
                      </TableCell>
                      <TableCell className="text-right">
                        {hasDetails ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDetails(log)}
                            className="h-8 w-8 text-gray-500 hover:text-primary hover:bg-primary/5"
                            title="Visualizar Alterações"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-300 mr-2">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginação */}
        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50/50">
          <div className="text-xs text-gray-500">
            Mostrando <span className="font-semibold">{(page - 1) * limit + 1}</span> a{" "}
            <span className="font-semibold">
              {Math.min(page * limit, meta.filter_count)}
            </span>{" "}
            de <span className="font-semibold">{meta.filter_count}</span> logs
          </div>
          
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1 || loading}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="text-xs font-medium text-gray-700 px-2">
              Pág. {page} de {totalPages}
            </span>

            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages || loading}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de Detalhes da Auditoria */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-primary" />
              Detalhes da Operação #{selectedLog?.id}
            </DialogTitle>
            <DialogDescription>
              Informações técnicas e auditoria detalhada da modificação no registro.
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-6">
              {/* Informações Básicas do Evento */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-gray-50 border border-gray-100 text-sm">
                <div>
                  <span className="text-xs text-gray-400 block uppercase font-semibold">Quem</span>
                  <span className="font-semibold text-gray-800 block">
                    {selectedLog.user ? `${selectedLog.user.first_name} ${selectedLog.user.last_name || ""}` : "Sistema"}
                  </span>
                  <span className="text-xs text-gray-500 truncate block">
                    {selectedLog.user?.email || "Chave Administrativa"}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block uppercase font-semibold">Ação</span>
                  <div className="mt-0.5">{getActionBadge(selectedLog.action)}</div>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block uppercase font-semibold">Coleção</span>
                  <span className="font-medium text-gray-800 block">
                    {formatFriendlyCollection(selectedLog.collection)}
                  </span>
                  <span className="text-[10px] font-mono text-gray-400 block">{selectedLog.collection}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block uppercase font-semibold">Registro ID</span>
                  <span className="font-mono text-gray-800 block font-bold mt-0.5">{selectedLog.item || "---"}</span>
                </div>
              </div>

              {/* Tabs de Detalhes */}
              <Tabs defaultValue="changes" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="changes">Alterações Realizadas</TabsTrigger>
                  <TabsTrigger value="raw">Dados Raw (JSON)</TabsTrigger>
                  <TabsTrigger value="device">Dispositivo & Rede</TabsTrigger>
                </TabsList>

                <TabsContent value="changes" className="pt-4 space-y-4">
                  {loadingRevisions ? (
                    <div className="space-y-2 py-4">
                      <div className="h-4 bg-gray-100 rounded w-full animate-pulse" />
                      <div className="h-4 bg-gray-100 rounded w-5/6 animate-pulse" />
                      <div className="h-4 bg-gray-100 rounded w-4/5 animate-pulse" />
                    </div>
                  ) : revisions.length === 0 ? (
                    <div className="text-center py-6 text-gray-400 text-sm">
                      Nenhum histórico detalhado ou delta disponível para esta ação.
                    </div>
                  ) : (
                    revisions.map((rev) => {
                      const changes = rev.delta || rev.data || {};
                      const entries = Object.entries(changes);

                      if (entries.length === 0) {
                        return (
                          <div key={rev.id} className="text-center py-4 text-gray-400 text-sm">
                            Nenhum campo modificado nesta revisão.
                          </div>
                        );
                      }

                      return (
                        <div key={rev.id} className="rounded-lg border overflow-hidden">
                          <div className="bg-gray-50 border-b px-4 py-2 text-xs font-semibold text-gray-500 flex justify-between">
                            <span>Revisão ID #{rev.id}</span>
                            <span>Coleção: {rev.collection}</span>
                          </div>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[200px]">Campo</TableHead>
                                <TableHead>
                                  {selectedLog.action === "update" ? "Novo Valor Configurado" : "Valor Inserido"}
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {entries.map(([key, value]) => {
                                let displayedValue = "";
                                if (value === null) {
                                  displayedValue = "Nulo / Vazio";
                                } else if (typeof value === "object") {
                                  displayedValue = JSON.stringify(value);
                                } else {
                                  displayedValue = String(value);
                                }

                                return (
                                  <TableRow key={key} className="hover:bg-transparent">
                                    <TableCell className="font-mono text-xs font-bold text-gray-600">
                                      {key}
                                    </TableCell>
                                    <TableCell className="text-sm font-mono break-all whitespace-pre-wrap max-w-lg text-gray-700 bg-slate-50/30">
                                      {displayedValue}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      );
                    })
                  )}
                </TabsContent>

                <TabsContent value="raw" className="pt-4">
                  <div className="rounded-lg border border-gray-200 bg-gray-950 p-4 text-gray-100 font-mono text-xs overflow-x-auto max-h-[300px] leading-relaxed">
                    <pre>
                      {JSON.stringify(
                        {
                          actitity: {
                            id: selectedLog.id,
                            action: selectedLog.action,
                            timestamp: selectedLog.timestamp,
                            collection: selectedLog.collection,
                            item: selectedLog.item,
                          },
                          revisions: revisions,
                        },
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </TabsContent>

                <TabsContent value="device" className="pt-4 space-y-4">
                  <div className="rounded-lg border border-gray-200 overflow-hidden text-sm">
                    <div className="flex border-b p-3 hover:bg-slate-50/50">
                      <div className="w-[180px] font-semibold text-gray-600 flex items-center gap-2">
                        <Globe className="h-4 w-4 text-gray-400" />
                        Endereço IP
                      </div>
                      <div className="font-mono text-gray-800">{selectedLog.ip || "Não registrado"}</div>
                    </div>
                    
                    <div className="flex border-b p-3 hover:bg-slate-50/50">
                      <div className="w-[180px] font-semibold text-gray-600 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        Data Completa
                      </div>
                      <div className="text-gray-800">
                        {format(new Date(selectedLog.timestamp), "PPPP 'às' HH:mm:ss (zzzz)", { locale: ptBR })}
                      </div>
                    </div>

                    <div className="flex p-3 hover:bg-slate-50/50">
                      <div className="w-[180px] font-semibold text-gray-600 flex items-center gap-2 shrink-0">
                        <Smartphone className="h-4 w-4 text-gray-400" />
                        User Agent / Dispositivo
                      </div>
                      <div className="text-xs text-gray-600 font-mono break-words overflow-hidden">
                        <p className="font-semibold text-sm text-gray-800 font-sans mb-1">
                          {formatBrowser(selectedLog.user_agent)}
                        </p>
                        {selectedLog.user_agent || "Não registrado"}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-end pt-4 border-t">
                <Button onClick={() => setIsDetailsOpen(false)}>Fechar Janela</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
