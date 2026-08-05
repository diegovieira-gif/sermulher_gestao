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
import { ParticipantesDialog } from "./participantes-dialog";
import { deleteEvento } from "./actions";
import { Plus, Edit, Trash2, Calendar, Repeat, Eye, Users } from "lucide-react";
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
 * Formata uma data para dd/MM/aaaa.
 *
 * Sem `new Date` de propósito: as colunas são do tipo `date` (sem hora), e
 * `new Date("2026-03-20")` é lido como meia-noite UTC — exibido no fuso local
 * virava "19/03/2026 21:00". Recortar a string evita o deslocamento, e a hora
 * some porque nunca existiu no banco.
 */
function formatarData(data: string | null | undefined): string {
  if (!data) return "";
  const [ano, mes, dia] = String(data).slice(0, 10).split("-");
  return dia && mes && ano ? `${dia}/${mes}/${ano}` : String(data);
}

/**
 * Período do evento em uma única célula.
 *
 * Quando início e fim caem no mesmo dia — a maioria dos casos — mostra só uma
 * data, em vez de repetir "20/03/2026 a 20/03/2026".
 */
function formatarPeriodo(
  inicio: string | null | undefined,
  fim: string | null | undefined,
): string {
  const i = formatarData(inicio);
  const f = formatarData(fim);
  if (!i) return f || "-";
  if (!f || f === i) return i;
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
}: EventosClientProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventoToDelete, setEventoToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [tipoFilter, setTipoFilter] = useState("todos");
  const [categoriaFilter, setCategoriaFilter] = useState("todos");
  const [situacaoFilter, setSituacaoFilter] = useState("todos");

  // Visualização de detalhes
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedViewEvento, setSelectedViewEvento] = useState<any | null>(null);
  // Evento cujo quadro de participantes está aberto (null = fechado).
  const [eventoParticipantes, setEventoParticipantes] = useState<{
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

  // Filtrar eventos baseado nos filtros selecionados
  const eventosFiltrados = eventos.filter((evento) => {
    const tipoMatch =
      tipoFilter === "todos" ||
      String(
        typeof evento.tipo_id === "object" && evento.tipo_id !== null
          ? evento.tipo_id.id
          : evento.tipo_id,
      ) === tipoFilter;

    const categoriaMatch =
      categoriaFilter === "todos" || evento.tipo === categoriaFilter;

    const situacao = calcularStatus(evento.data_inicio, evento.data_fim);
    const situacaoMatch =
      situacaoFilter === "todos" || situacao === situacaoFilter;

    return tipoMatch && categoriaMatch && situacaoMatch;
  });

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

      <div className="mb-4 flex flex-wrap gap-3">
        {/* Filtro de Tipo de Evento */}
        <Select value={tipoFilter} onValueChange={setTipoFilter}>
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
        <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
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

        {/* Filtro de Situação (Calculado) */}
        <Select value={situacaoFilter} onValueChange={setSituacaoFilter}>
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
                  colSpan={6}
                  className="text-center text-muted-foreground"
                >
                  Nenhum evento cadastrado
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
                        {evento.local && (
                          <span className="text-xs text-muted-foreground font-normal mt-0.5">
                            {evento.local}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{dataFormatada}</span>
                      </div>
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

      <ParticipantesDialog
        evento={eventoParticipantes}
        open={eventoParticipantes !== null}
        onOpenChange={(aberto) => !aberto && setEventoParticipantes(null)}
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
