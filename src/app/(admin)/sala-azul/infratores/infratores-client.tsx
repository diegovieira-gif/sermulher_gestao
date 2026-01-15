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
import { InfratorForm } from "./infrator-form";
import { deleteInfrator } from "./actions";
import { Plus, Pencil, Trash2, AlertTriangle, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import type { Infrator, NivelPericulosidade } from "./schemas";
import { cn } from "@/lib/utils";

interface InfratoresClientProps {
  infratores: any[];
}

// Função para obter a cor do badge baseado no nível de periculosidade
function getPericulosidadeBadgeVariant(
  nivel: NivelPericulosidade
): "default" | "secondary" | "destructive" | "success" | "warning" | "info" {
  switch (nivel) {
    case "Baixo":
      return "secondary"; // Verde/Cinza
    case "Médio":
      return "warning"; // Amarelo/Laranja
    case "Alto":
      return "destructive"; // Vermelho
    case "Crítico":
      return "default"; // Vamos usar uma classe customizada para roxo/preto
    default:
      return "secondary";
  }
}

// Função para obter classes CSS customizadas para nível crítico
function getPericulosidadeBadgeClass(nivel: NivelPericulosidade): string {
  if (nivel === "Crítico") {
    return "bg-purple-950 text-white border-purple-900 font-bold shadow-lg";
  }
  return "";
}

// Função para obter ícone baseado no nível
function getPericulosidadeIcon(nivel: NivelPericulosidade) {
  switch (nivel) {
    case "Baixo":
      return null;
    case "Médio":
      return <AlertTriangle className="h-3 w-3 mr-1" />;
    case "Alto":
      return <AlertTriangle className="h-3 w-3 mr-1" />;
    case "Crítico":
      return <ShieldAlert className="h-3 w-3 mr-1" />;
    default:
      return null;
  }
}

export function InfratoresClient({ infratores }: InfratoresClientProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [selectedInfrator, setSelectedInfrator] = useState<Infrator | null>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [infratorToDelete, setInfratorToDelete] = useState<number | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const handleNew = () => {
    setSelectedInfrator(null);
    setFormOpen(true);
  };

  const handleEdit = (infrator: any) => {
    setSelectedInfrator(infrator);
    setFormOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setInfratorToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!infratorToDelete) return;

    setIsDeleting(true);
    try {
      const result = await deleteInfrator(infratorToDelete);

      if (result.success) {
        toast.success(result.message);
        setDeleteDialogOpen(false);
        setInfratorToDelete(null);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Erro ao excluir infrator");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Função auxiliar para formatar tipo_agressao (pode vir como string CSV ou array)
  const formatTipoAgressao = (tipoAgressao: any): string => {
    if (!tipoAgressao) return "-";
    if (Array.isArray(tipoAgressao)) {
      return tipoAgressao.join(", ");
    }
    if (typeof tipoAgressao === "string") {
      return tipoAgressao;
    }
    return "-";
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShieldAlert className="h-8 w-8 text-destructive" />
            Gestão de Infratores
          </h1>
          <p className="text-muted-foreground">
            Gerencie os infratores cadastrados no sistema (Sala Azul)
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Infrator
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Nível de Periculosidade</TableHead>
              <TableHead>Tipos de Agressão</TableHead>
              <TableHead>Status Legal</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {infratores.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground"
                >
                  Nenhum infrator cadastrado
                </TableCell>
              </TableRow>
            ) : (
              infratores.map((infrator) => (
                <TableRow key={infrator.id}>
                  <TableCell className="font-medium">
                    {infrator.nome_completo}
                  </TableCell>
                  <TableCell>{infrator.cpf}</TableCell>
                  <TableCell>
                    <Badge
                      variant={getPericulosidadeBadgeVariant(
                        infrator.nivel_periculosidade
                      )}
                      className={cn(
                        getPericulosidadeBadgeClass(infrator.nivel_periculosidade)
                      )}
                    >
                      {getPericulosidadeIcon(infrator.nivel_periculosidade)}
                      {infrator.nivel_periculosidade}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {formatTipoAgressao(infrator.tipo_agressao)}
                  </TableCell>
                  <TableCell>{infrator.status_legal}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(infrator)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(infrator.id)}
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

      <InfratorForm
        open={formOpen}
        onOpenChange={setFormOpen}
        infrator={selectedInfrator}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O infrator será excluído
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
