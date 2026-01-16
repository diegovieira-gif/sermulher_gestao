"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { SalaForm } from "./sala-form";
import { deleteSala } from "./actions";
import { Plus, Pencil, Trash2, Calendar, MapPin, Users, UserPlus } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import type { Sala, StatusSala } from "./schemas";

interface LocalOption {
  id: number;
  nome: string;
}

interface ResponsavelOption {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

interface SalasClientProps {
  salas: any[];
  locais: LocalOption[];
  responsaveis: ResponsavelOption[];
}

// Função para formatar data no formato dd/MM/yyyy
function formatarData(data: string | Date): string {
  try {
    const date = typeof data === "string" ? new Date(data) : data;
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  } catch {
    return String(data);
  }
}

// Função para formatar período
function formatarPeriodo(dataInicio: string | Date, dataTermino: string | Date): string {
  const inicio = formatarData(dataInicio);
  const termino = formatarData(dataTermino);
  return `${inicio} até ${termino}`;
}

// Função para obter a variante do badge baseado no status
function getBadgeVariant(status: StatusSala): "secondary" | "success" | "info" {
  switch (status) {
    case "Planejada":
      return "secondary"; // Cinza
    case "Em Andamento":
      return "success"; // Verde
    case "Finalizada":
      return "info"; // Azul
    default:
      return "secondary";
  }
}

// Função para formatar nome do responsável
function formatNomeResponsavel(responsavel: any): string {
  if (!responsavel) return "-";
  const firstName = responsavel.first_name || "";
  const lastName = responsavel.last_name || "";
  const nomeCompleto = `${firstName} ${lastName}`.trim();
  return nomeCompleto || "-";
}

export function SalasClient({
  salas,
  locais,
  responsaveis,
}: SalasClientProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [selectedSala, setSelectedSala] = useState<Sala | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [salaToDelete, setSalaToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleNew = () => {
    setSelectedSala(null);
    setFormOpen(true);
  };

  const handleEdit = (sala: any) => {
    setSelectedSala(sala);
    setFormOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setSalaToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!salaToDelete) return;

    setIsDeleting(true);
    try {
      const result = await deleteSala(salaToDelete);

      if (result.success) {
        toast.success(result.message);
        setDeleteDialogOpen(false);
        setSalaToDelete(null);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Erro ao excluir ciclo");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            Gestão de Ciclos (Salas Azul)
          </h1>
          <p className="text-muted-foreground">
            Gerencie os ciclos de salas azul cadastrados no sistema
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Ciclo
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ciclo</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Local</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {salas.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground"
                >
                  Nenhum ciclo cadastrado
                </TableCell>
              </TableRow>
            ) : (
              salas.map((sala) => (
                <TableRow key={sala.id}>
                  <TableCell className="font-medium">
                    {sala.nome_ciclo}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {formatarPeriodo(sala.data_inicio, sala.data_termino)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {(() => {
                          const localObj = sala.local_id;
                          return localObj?.nome || "-";
                        })()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {sala.responsavel_tecnico
                          ? formatNomeResponsavel(sala.responsavel_tecnico)
                          : "-"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getBadgeVariant(sala.status)}>
                      {sala.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/sala-azul/ciclos/${sala.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Gerenciar participantes"
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(sala)}
                        title="Editar ciclo"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(sala.id)}
                        title="Excluir ciclo"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <SalaForm
        open={formOpen}
        onOpenChange={setFormOpen}
        sala={selectedSala}
        locais={locais}
        responsaveis={responsaveis}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O ciclo será excluído
              permanentemente.
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
