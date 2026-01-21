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
import { Plus, Pencil, Trash2, Calendar, MapPin, Users, UserPlus, User } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { SalaAzulDB } from "@/types/database"; // Usando o tipo do Catálogo
import { StatusSala } from "./schemas";
import { InfoTooltip } from "@/components/ui/info-tooltip";

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
  salas: SalaAzulDB[];
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
      timeZone: "UTC",
    }).format(date);
  } catch (e) {
    return "";
  }
}

// Helper para status
function getStatusBadge(status: string) {
  switch (status) {
    case StatusSala.PLANEJADA:
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Planejada</Badge>;
    case StatusSala.EM_ANDAMENTO:
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Em Andamento</Badge>;
    case StatusSala.FINALIZADA:
      return <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200">Finalizada</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function SalasClient({ salas, locais, responsaveis }: SalasClientProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [selectedSala, setSelectedSala] = useState<SalaAzulDB | null>(null);
  
  // Estados para exclusão
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [salaToDelete, setSalaToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = (sala: SalaAzulDB) => {
    setSelectedSala(sala);
    setFormOpen(true);
  };

  const handleNew = () => {
    setSelectedSala(null);
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
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Erro ao excluir ciclo.");
    } finally {
      setIsDeleting(false);
      setSalaToDelete(null);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sala Azul - Ciclos</h1>
          <p className="text-muted-foreground">
            Gerencie os ciclos, turmas e participantes.
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" /> Novo Ciclo
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                Ciclo / Nome
                <InfoTooltip text="Identificação única do ciclo de atendimento." />
              </TableHead>
              <TableHead>
                Período
                <InfoTooltip text="Intervalo de datas de início e término do ciclo." />
              </TableHead>
              <TableHead>
                Status
                <InfoTooltip text="Situação atual do ciclo (Planejada, Em Andamento, Finalizada)." />
              </TableHead>
              <TableHead>
                Local
                <InfoTooltip text="Local físico onde as sessões são realizadas." />
              </TableHead>
              <TableHead>
                Facilitador
                <InfoTooltip text="Técnico responsável pela condução das sessões." />
              </TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {salas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Nenhum ciclo encontrado.
                </TableCell>
              </TableRow>
            ) : (
              salas.map((sala) => (
                <TableRow key={sala.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{sala.nome_ciclo}</span>
                      <span className="text-xs text-muted-foreground">ID: {sala.id}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="mr-2 h-4 w-4" />
                      {formatarData(sala.data_inicio)} - {formatarData(sala.data_termino)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(sala.status)}
                  </TableCell>
                  
                  {/* CORREÇÃO DE BUILD: Verificação de Tipo para Local */}
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>
                        {typeof sala.local_id === "object" && sala.local_id
                          ? sala.local_id.nome
                          : "-"}
                      </span>
                    </div>
                  </TableCell>

                  {/* CORREÇÃO DE BUILD: Verificação de Tipo para Facilitador */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="text-sm">
                        {typeof sala.responsavel_tecnico === "object" && sala.responsavel_tecnico
                          ? `${sala.responsavel_tecnico.first_name} ${sala.responsavel_tecnico.last_name || ""}`
                          : "Não atribuído"}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/sala-azul/ciclos/${sala.id}`}>
                        <Button variant="outline" size="sm" title="Gerenciar Participantes">
                          <Users className="h-4 w-4 mr-2" />
                          Participantes
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
