"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { EventoForm } from "./evento-form";
import { useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ParticipantesDialog } from "./participantes-dialog";
import { EquipeDialog } from "./equipe-dialog";
import { deleteEvento, getEventosParaExportar } from "./actions";
import { ORDENACOES_EVENTO, type EventosListaMeta } from "./schemas";
import { Input } from "@/components/ui/input";
import { baixarCsv } from "@/lib/csv";
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  Repeat,
  Eye,
  Users,
  Briefcase,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Download,
  Loader2,
  X,
  MapPin,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { todayLocalISO } from "@/lib/utils";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { tipoEventoEnum } from "./schemas";
import type { Evento } from "./schemas";

type TipoEventoOption = { id: number; nome: string; icone?: string };

interface EventosClientProps {
  eventos: any[];
  tiposEventoOptions: TipoEventoOption[];
  /** Página, total e ordenação atual — ausente se a consulta falhou. */
  meta?: EventosListaMeta;
}

type StatusEvento = "Encerrado" | "Em Andamento" | "Breve";

/**
 * Situação do evento a partir das datas.
 *
 * Comparação por string em AAAA-MM-DD, que é ordenável e exata. Usar
 * `new Date("2026-03-20")` trazia o mesmo deslocamento de fuso das outras
 * colunas: a data virava meia-noite UTC e, em UTC-3, o `setHours(0,0,0,0)`
 * seguinte a jogava para o dia ANTERIOR — um evento aparecia "Em Andamento"
 * um dia antes de começar.
 */
function calcularStatus(dataInicio: string, dataFim: string): StatusEvento {
  const hoje = todayLocalISO();
  const inicio = String(dataInicio || "").slice(0, 10);
  const fim = String(dataFim || "").slice(0, 10) || inicio;

  if (!inicio) return "Breve";

  if (hoje > fim) return "Encerrado";
  if (hoje >= inicio) return "Em Andamento";
  return "Breve";
}

/**
 * Formata uma data para dd/MM/aaaa, acrescentando a hora quando houver.
 *
 * Sem `new Date` de propósito. As colunas são `dateTime` (timestamp SEM fuso):
 * o valor guardado é a hora local do evento. Passar por `Date` reintroduziria
 * o deslocamento que fazia "2026-03-20" aparecer como 19/03 às 21:00.
 *
 * Meia-noite é tratada como "sem horário informado" e omitida — a maioria dos
 * eventos antigos ficou em 00:00 na migração, e exibir "00:00" em todos eles
 * seria ruído.
 */
function formatarData(data: string | null | undefined): string {
  if (!data) return "";
  const texto = String(data);
  const [ano, mes, dia] = texto.slice(0, 10).split("-");
  if (!dia || !mes || !ano) return texto;

  const dataFormatada = `${dia}/${mes}/${ano}`;
  const hora = texto.slice(11, 16);
  return hora && hora !== "00:00" ? `${dataFormatada} ${hora}` : dataFormatada;
}

/** Só a parte da data, para comparar dias sem considerar horário. */
function soDia(data: string | null | undefined): string {
  return String(data ?? "").slice(0, 10);
}

/**
 * Período do evento em uma única célula.
 *
 * No mesmo dia, evita repetir a data: mostra "20/03/2026 12:00 às 14:00" em
 * vez de "20/03/2026 12:00 a 20/03/2026 14:00".
 */
function formatarPeriodo(
  inicio: string | null | undefined,
  fim: string | null | undefined,
): string {
  const i = formatarData(inicio);
  const f = formatarData(fim);

  if (!i) return f || "-";
  if (!f || f === i) return i;

  if (soDia(inicio) === soDia(fim)) {
    const horaFim = String(fim).slice(11, 16);
    return horaFim && horaFim !== "00:00" ? `${i} às ${horaFim}` : i;
  }

  return `${i} a ${f}`;
}

// Função para obter a variante do badge baseado no status
function getBadgeVariant(
  status: StatusEvento,
): "secondary" | "success" | "info" {
  switch (status) {
    case "Encerrado":
      return "secondary";
    case "Em Andamento":
      return "success";
    case "Breve":
      return "info";
    default:
      return "secondary";
  }
}

// Função para obter o rótulo do tipo de evento (Categoria)
function getTipoLabel(tipo?: string): string {
  if (!tipo) return "Não especificado";
  const option = tipoEventoEnum.find((t) => t.value === tipo);
  return option ? option.label : tipo;
}

// Função para obter a variante de badge baseada no tipo de evento (Categoria)
function getTipoBadgeVariant(tipo?: string): "default" | "secondary" | "outline" | "success" | "info" {
  switch (tipo) {
    case "campanha":
      return "default";
    case "evento":
      return "info";
    case "roda_conversa":
      return "secondary";
    case "curso":
      return "success";
    default:
      return "outline";
  }
}

export function EventosClient({
  eventos,
  tiposEventoOptions,
  meta,
}: EventosClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [formOpen, setFormOpen] = useState(false);
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventoToDelete, setEventoToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtros e ordenação vivem na URL: o servidor os aplica sobre a base
  // inteira, e o estado sobrevive a recarregar a página ou compartilhar o link.
  const tipoFilter = searchParams.get("tipo") || "todos";
  const categoriaFilter = searchParams.get("categoria") || "todos";
  const situacaoFilter = searchParams.get("situacao") || "todos";
  const ordemAtual = meta?.ordenacao ?? "data_desc";

  const atualizarParam = useCallback(
    (chave: string, valor: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (valor === "todos") params.delete(chave);
      else params.set(chave, valor);
      // Trocar filtro ou ordenação sempre volta para a primeira página.
      params.delete("page");
      // A aba de lista precisa continuar aberta após a navegação.
      params.set("aba", "lista");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  const irParaPagina = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (page <= 1) params.delete("page");
      else params.set("page", String(page));
      params.set("aba", "lista");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  // Busca com debounce — empurra o termo para a URL, onde o servidor o aplica
  // sobre a base inteira (título ou local).
  const buscaUrl = searchParams.get("q") ?? "";
  const [busca, setBusca] = useState(buscaUrl);

  useEffect(() => {
    const t = setTimeout(() => {
      if (busca !== buscaUrl) atualizarParam("q", busca.trim() || "todos");
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca]);

  // Ressincroniza quando a URL muda por fora (voltar/avançar, limpar filtros).
  useEffect(() => {
    setBusca(buscaUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buscaUrl]);

  const filtrosAtivos =
    (tipoFilter !== "todos" ? 1 : 0) +
    (categoriaFilter !== "todos" ? 1 : 0) +
    (situacaoFilter !== "todos" ? 1 : 0) +
    (buscaUrl ? 1 : 0);

  const limparFiltros = () => {
    const params = new URLSearchParams();
    params.set("aba", "lista");
    // A ordenação é preferência de leitura, não filtro — é preservada.
    const ordem = searchParams.get("ordem");
    if (ordem) params.set("ordem", ordem);
    router.push(`${pathname}?${params.toString()}`);
  };

  const [exportando, setExportando] = useState(false);

  const exportarCsv = async () => {
    setExportando(true);
    try {
      const res = await getEventosParaExportar({
        ordenacao: searchParams.get("ordem") ?? undefined,
        tipoId: Number(searchParams.get("tipo")) || undefined,
        categoria: categoriaFilter,
        situacao: situacaoFilter,
        busca: buscaUrl,
      });
      if (!res.success || !res.data) {
        toast.error(res.error || "Não foi possível exportar.");
        return;
      }
      const linhas: (string | number)[][] = [
        [
          "ID",
          "Título",
          "Início",
          "Término",
          "Local",
          "Categoria",
          "Tipo de evento",
          "Recorrência",
          "Situação",
          "Descrição",
        ],
        ...res.data.map((e) => [
          e.id,
          e.nome ?? "",
          formatarData(e.data_inicio),
          formatarData(e.data_fim),
          e.local ?? "",
          e.tipo ?? "",
          e.tipo_id?.nome ?? "",
          e.recorrencia ?? "",
          calcularStatus(e.data_inicio, e.data_fim),
          e.descricao ?? "",
        ]),
      ];
      baixarCsv(`eventos-${todayLocalISO()}.csv`, linhas);
      toast.success(`${res.data.length} evento(s) exportado(s).`);
    } finally {
      setExportando(false);
    }
  };

  // Visualização de detalhes
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedViewEvento, setSelectedViewEvento] = useState<any | null>(null);
  // Evento cujo quadro de participantes está aberto (null = fechado).
  const [eventoParticipantes, setEventoParticipantes] = useState<{
    id: number;
    nome: string;
  } | null>(null);
  // Evento cuja equipe (servidoras que atuaram) está aberta (null = fechado).
  const [eventoEquipe, setEventoEquipe] = useState<{
    id: number;
    nome: string;
  } | null>(null);

  const handleNew = () => {
    setSelectedEvento(null);
    setFormOpen(true);
  };

  const handleEdit = (evento: any) => {
    setSelectedEvento(evento);
    setFormOpen(true);
  };

  const handleView = (evento: any) => {
    setSelectedViewEvento(evento);
    setViewDialogOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setEventoToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!eventoToDelete) return;

    setIsDeleting(true);
    try {
      const result = await deleteEvento(eventoToDelete);

      if (result.success) {
        toast.success("Evento excluído com sucesso!");
        setDeleteDialogOpen(false);
        setEventoToDelete(null);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Erro ao excluir evento");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtros e ordenação são resolvidos no servidor — a lista já chega pronta.
  const eventosFiltrados = eventos;

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Eventos e Campanhas</h1>
          <p className="text-muted-foreground">
            Gerencie os eventos e campanhas cadastrados no sistema
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Evento
        </Button>
      </div>

      {/* Busca + exportação */}
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por título ou local..."
            className="bg-white pl-9"
            aria-label="Buscar evento"
          />
        </div>
        <Button
          variant="outline"
          onClick={exportarCsv}
          disabled={exportando || !meta || meta.total === 0}
          className="bg-white"
        >
          {exportando ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Exportar CSV
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Filtro de Tipo de Evento */}
        <Select
          value={tipoFilter}
          onValueChange={(v) => atualizarParam("tipo", v)}
        >
          <SelectTrigger className="w-[180px] bg-white">
            <SelectValue placeholder="Tipo de Evento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            {tiposEventoOptions.map((tipo) => (
              <SelectItem key={tipo.id} value={String(tipo.id)}>
                {tipo.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filtro de Categoria (Campo 'tipo' na tabela) */}
        <Select
          value={categoriaFilter}
          onValueChange={(v) => atualizarParam("categoria", v)}
        >
          <SelectTrigger className="w-[180px] bg-white">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as categorias</SelectItem>
            {tipoEventoEnum.map((tipo) => (
              <SelectItem key={tipo.value} value={tipo.value}>
                {tipo.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filtro de Situação (posição do evento no tempo) */}
        <Select
          value={situacaoFilter}
          onValueChange={(v) => atualizarParam("situacao", v)}
        >
          <SelectTrigger className="w-[180px] bg-white">
            <SelectValue placeholder="Situação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as situações</SelectItem>
            <SelectItem value="Breve">Em Breve</SelectItem>
            <SelectItem value="Em Andamento">Em Andamento</SelectItem>
            <SelectItem value="Encerrado">Encerrado</SelectItem>
          </SelectContent>
        </Select>

        {filtrosAtivos > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={limparFiltros}
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <X className="mr-1 h-4 w-4" />
            Limpar filtros ({filtrosAtivos})
          </Button>
        )}

        {/* Ordenação */}
        <div className="ml-auto flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select
            value={ordemAtual}
            onValueChange={(v) => atualizarParam("ordem", v)}
          >
            <SelectTrigger className="w-[240px] bg-white">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ORDENACOES_EVENTO).map(([chave, opcao]) => (
                <SelectItem key={chave} value={chave}>
                  {opcao.rotulo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                Título
                <InfoTooltip text="Nome ou título identificador do evento." />
              </TableHead>
              <TableHead>
                Período
                <InfoTooltip text="Datas de início e término do evento. Quando começa e termina no mesmo dia, aparece uma só data." />
              </TableHead>
              <TableHead>
                Local
                <InfoTooltip text="Onde o evento acontece. Também é usado na busca e na ordenação." />
              </TableHead>
              <TableHead>
                Tipo de Evento
                <InfoTooltip text="Tipo personalizado associado ao evento." />
              </TableHead>
              <TableHead>
                Categoria
                <InfoTooltip text="Categoria geral do evento (Campanha, Evento, etc.)." />
              </TableHead>
              <TableHead>
                Situação
                <InfoTooltip text="Status temporal calculado a partir das datas." />
              </TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {eventosFiltrados.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-muted-foreground"
                >
                  {filtrosAtivos > 0
                    ? "Nenhum evento corresponde aos filtros aplicados."
                    : "Nenhum evento cadastrado"}
                </TableCell>
              </TableRow>
            ) : (
              eventosFiltrados.map((evento) => {
                const status = calcularStatus(
                  evento.data_inicio,
                  evento.data_fim,
                );
                const dataFormatada = formatarPeriodo(
                  evento.data_inicio,
                  evento.data_fim,
                );

                // Acessa tipo_id - pode vir como objeto expandido ou apenas ID
                const tipoObj =
                  typeof evento.tipo_id === "object" && evento.tipo_id !== null
                    ? evento.tipo_id
                    : typeof evento.tipo_id === "number"
                      ? tiposEventoOptions.find((t) => t.id === evento.tipo_id)
                      : null;

                const tipoNome = tipoObj?.nome;

                // Verifica se é evento recorrente
                const isRecorrente =
                  evento.recorrencia && evento.recorrencia !== "nao_recorrente";

                return (
                  <TableRow key={evento.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          {evento.nome}
                          {isRecorrente && (
                            <div
                              title={`Evento recorrente (${evento.recorrencia})`}
                            >
                              <Repeat className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{dataFormatada}</span>
                      </div>
                    </TableCell>
                    {/* Local em coluna própria: era um subtítulo discreto sob
                        o título, o que tornava ilegível a ordenação por local. */}
                    <TableCell>
                      {evento.local ? (
                        <div className="flex items-center gap-1.5 text-sm">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span className="truncate max-w-[200px]" title={evento.local}>
                            {evento.local}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {tipoNome ? (
                        <Badge variant="outline">{tipoNome}</Badge>
                      ) : (
                        <span className="text-muted-foreground">Sem tipo</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTipoBadgeVariant(evento.tipo)}>
                        {getTipoLabel(evento.tipo)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(status)}>{status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Visualizar Detalhes"
                          onClick={() => handleView(evento)}
                        >
                          <Eye className="h-4 w-4 text-sky-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Participantes"
                          onClick={() =>
                            setEventoParticipantes({
                              id: evento.id,
                              nome: evento.nome,
                            })
                          }
                        >
                          <Users className="h-4 w-4 text-emerald-600" />
                          <span className="sr-only">
                            Ver participantes de {evento.nome}
                          </span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Equipe"
                          onClick={() =>
                            setEventoEquipe({
                              id: evento.id,
                              nome: evento.nome,
                            })
                          }
                        >
                          <Briefcase className="h-4 w-4 text-violet-600" />
                          <span className="sr-only">
                            Ver equipe de {evento.nome}
                          </span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(evento)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(evento.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      {meta && meta.total > 0 && (
        <div className="mt-4 flex flex-col items-center justify-between gap-3 text-sm text-muted-foreground sm:flex-row">
          <div>
            Mostrando <strong>{(meta.page - 1) * meta.limit + 1}</strong> a{" "}
            <strong>{Math.min(meta.page * meta.limit, meta.total)}</strong> de{" "}
            <strong>{meta.total}</strong> eventos
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => irParaPagina(meta.page - 1)}
              disabled={meta.page <= 1}
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
            </Button>
            <span>
              Página {meta.page} de {meta.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => irParaPagina(meta.page + 1)}
              disabled={meta.page >= meta.totalPages}
            >
              Próxima <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <ParticipantesDialog
        evento={eventoParticipantes}
        open={eventoParticipantes !== null}
        onOpenChange={(aberto) => !aberto && setEventoParticipantes(null)}
      />

      <EquipeDialog
        evento={eventoEquipe}
        open={eventoEquipe !== null}
        onOpenChange={(aberto) => !aberto && setEventoEquipe(null)}
      />

      <EventoForm
        open={formOpen}
        onOpenChange={setFormOpen}
        tiposEventoOptions={tiposEventoOptions}
        evento={selectedEvento}
      />

      {/* Modal de Visualização de Detalhes */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-md bg-white border border-gray-100 shadow-lg rounded-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-800">
              <Calendar className="h-5 w-5 text-purple-600" />
              Detalhes do Evento
            </DialogTitle>
          </DialogHeader>
          {selectedViewEvento && (
            <div className="space-y-4 pt-2">
              <div>
                <h3 className="text-lg font-bold text-gray-900 leading-snug">
                  {selectedViewEvento.nome}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                    Categoria
                  </span>
                  <Badge variant={getTipoBadgeVariant(selectedViewEvento.tipo)}>
                    {getTipoLabel(selectedViewEvento.tipo)}
                  </Badge>
                </div>

                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                    Tipo de Evento
                  </span>
                  <Badge variant="outline" className="border-gray-200 text-gray-600">
                    {(() => {
                      const tipoObj =
                        typeof selectedViewEvento.tipo_id === "object" &&
                        selectedViewEvento.tipo_id !== null
                          ? selectedViewEvento.tipo_id
                          : typeof selectedViewEvento.tipo_id === "number"
                            ? tiposEventoOptions.find(
                                (t) => t.id === selectedViewEvento.tipo_id,
                              )
                            : null;
                      return tipoObj?.nome || "Sem tipo";
                    })()}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm border-t pt-3 border-gray-100">
                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-0.5">
                    Início
                  </span>
                  <span className="text-gray-700 font-medium block">
                    {formatarData(selectedViewEvento.data_inicio)}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-0.5">
                    Fim (Término)
                  </span>
                  <span className="text-gray-700 font-medium block">
                    {selectedViewEvento.data_fim
                      ? formatarData(selectedViewEvento.data_fim)
                      : "Sem data de término"}
                  </span>
                </div>
              </div>

              {selectedViewEvento.local && (
                <div className="text-sm border-t pt-3 border-gray-100">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-0.5">
                    Local
                  </span>
                  <span className="text-gray-700 font-medium block">
                    {selectedViewEvento.local}
                  </span>
                </div>
              )}

              {selectedViewEvento.recorrencia &&
                selectedViewEvento.recorrencia !== "nao_recorrente" && (
                  <div className="text-sm border-t pt-3 border-gray-100">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-0.5">
                      Recorrência
                    </span>
                    <span className="text-gray-700 font-medium block capitalize">
                      {selectedViewEvento.recorrencia === "mensal" ? "Mensal" : "Anual"}
                    </span>
                  </div>
                )}

              {selectedViewEvento.descricao && (
                <div className="text-sm pt-3 border-t border-gray-100">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                    Descrição
                  </span>
                  <p className="text-gray-600 bg-gray-50/70 p-3 rounded-lg border border-gray-100 text-xs leading-relaxed whitespace-pre-line">
                    {selectedViewEvento.descricao}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="pt-4 border-t border-gray-100">
            <Button onClick={() => setViewDialogOpen(false)} className="bg-gray-800 hover:bg-gray-900 text-white">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O evento será excluído
              permanentemente.
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
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
