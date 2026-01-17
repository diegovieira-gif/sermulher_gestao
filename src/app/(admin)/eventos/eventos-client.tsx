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
import { deleteEvento } from "./actions";
import { Plus, Edit, Trash2, Calendar, Repeat } from "lucide-react";
import { toast } from "sonner";
import type { Evento } from "./schemas";

type TipoEventoOption = { id: number; nome: string; icone?: string };

interface EventosClientProps {
  eventos: any[];
  tiposEventoOptions: TipoEventoOption[];
}

type StatusEvento = "Encerrado" | "Em Andamento" | "Breve";

// Função para calcular o status do evento
function calcularStatus(dataInicio: string, dataFim: string): StatusEvento {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const inicio = new Date(dataInicio);
  inicio.setHours(0, 0, 0, 0);

  const fim = new Date(dataFim);
  fim.setHours(0, 0, 0, 0);

  if (hoje > fim) {
    return "Encerrado";
  } else if (hoje >= inicio && hoje <= fim) {
    return "Em Andamento";
  } else {
    return "Breve";
  }
}

// Função para formatar data no formato dd/MM/yyyy
function formatarData(data: string): string {
  try {
    const date = new Date(data);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  } catch {
    return data;
  }
}

// Função para obter a variante do badge baseado no status
function getBadgeVariant(status: StatusEvento): "secondary" | "success" | "info" {
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

export function EventosClient({ eventos, tiposEventoOptions }: EventosClientProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventoToDelete, setEventoToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleNew = () => {
    setSelectedEvento(null);
    setFormOpen(true);
  };

  const handleEdit = (evento: any) => {
    setSelectedEvento(evento);
    setFormOpen(true);
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
        toast.success(result.message);
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

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {eventos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nenhum evento cadastrado
                </TableCell>
              </TableRow>
            ) : (
              eventos.map((evento) => {
                const status = calcularStatus(
                  evento.data_inicio,
                  evento.data_fim
                );
                const dataFormatada = formatarData(evento.data_inicio);

                // Acessa tipo_id - pode vir como objeto expandido ou apenas ID
                const tipoObj = 
                  typeof evento.tipo_id === "object" && evento.tipo_id !== null
                    ? evento.tipo_id
                    : typeof evento.tipo_id === "number"
                    ? tiposEventoOptions.find((t) => t.id === evento.tipo_id)
                    : null;

                const tipoNome = tipoObj?.nome;

                // Verifica se é evento recorrente
                const isRecorrente = evento.recorrencia && evento.recorrencia !== "nao_recorrente";

                return (
                  <TableRow key={evento.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {evento.nome}
                        {isRecorrente && (
                          <Repeat className="h-4 w-4 text-muted-foreground" title="Evento recorrente" />
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
                      <Badge variant={getBadgeVariant(status)}>
                        {status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
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

      <EventoForm
        open={formOpen}
        onOpenChange={setFormOpen}
        tiposEventoOptions={tiposEventoOptions}
        evento={selectedEvento}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O evento será excluído permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
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
