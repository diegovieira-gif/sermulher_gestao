"use client";

import { useState, useTransition } from "react";
import { Plus, MoreHorizontal, Pencil, Trash2, CheckCircle, XCircle, ExternalLink, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { deleteCampanha, toggleCampanhaStatus } from "../actions";
import { CampanhaForm } from "./campanha-form";

interface Campanha {
  id: string;
  titulo: string;
  url_instagram: string;
  status: string;
}

interface CampanhasClientProps {
  initialData: Campanha[];
}

export function CampanhasClient({ initialData }: CampanhasClientProps) {
  const [isPending, startTransition] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Campanha | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;

    startTransition(async () => {
      const result = await deleteCampanha(deleteId);
      if (result.success) {
        toast.success("Campanha excluída com sucesso.");
      } else {
        toast.error(`Erro ao excluir campanha: ${result.error}`);
      }
      setDeleteId(null);
    });
  };

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "published" ? "draft" : "published";
    startTransition(async () => {
      const result = await toggleCampanhaStatus(id, newStatus);
      if (result.success) {
        toast.success(`Campanha ${newStatus === "published" ? "publicada" : "ocultada"}.`);
      } else {
        toast.error(`Erro ao atualizar status: ${result.error}`);
      }
    });
  };

  const handleCreateNew = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleEdit = (campanha: Campanha) => {
    setEditingItem(campanha);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingItem(null);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-green-600 hover:bg-green-700">Publicado</Badge>;
      case "draft":
        return <Badge variant="secondary" className="bg-gray-200 text-gray-800 hover:bg-gray-300">Rascunho</Badge>;
      case "archived":
        return <Badge variant="destructive">Arquivado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium">Lista de Campanhas</h3>
        <Button onClick={handleCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Campanha
        </Button>
      </div>

      <div className="rounded-md border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Link do Instagram</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  Nenhuma campanha encontrada.
                </TableCell>
              </TableRow>
            ) : (
              initialData.map((campanha) => (
                <TableRow key={campanha.id}>
                  <TableCell className="font-medium">{campanha.titulo}</TableCell>
                  <TableCell>
                    {campanha.url_instagram ? (
                      <a 
                        href={campanha.url_instagram} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:underline gap-1 text-sm font-medium bg-blue-50 px-3 py-1 rounded w-fit"
                      >
                        <Instagram className="h-4 w-4" />
                        Ver Postagem
                        <ExternalLink className="h-3 w-3 ml-1 opacity-50" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>{statusBadge(campanha.status)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(campanha)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          <span>Editar</span>
                        </DropdownMenuItem>
                        {campanha.url_instagram && (
                          <DropdownMenuItem asChild>
                            <a href={campanha.url_instagram} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="mr-2 h-4 w-4" />
                              <span>Ver no Instagram</span>
                            </a>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleToggleStatus(campanha.id, campanha.status)}>
                          {campanha.status === "published" ? (
                            <>
                              <XCircle className="mr-2 h-4 w-4" />
                              <span>Marcar como Rascunho</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              <span>Publicar</span>
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600 focus:text-red-600 focus:bg-red-50"
                          onClick={() => setDeleteId(campanha.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Excluir</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className="sm:max-w-4xl overflow-y-auto w-full">
          <SheetHeader className="mb-6">
            <SheetTitle>{editingItem ? "Editar Campanha" : "Nova Campanha"}</SheetTitle>
            <SheetDescription>
              {editingItem 
                ? "Atualize os detalhes da campanha abaixo." 
                : "Insira o link do Instagram para criar uma nova campanha."}
            </SheetDescription>
          </SheetHeader>
          <CampanhaForm 
            initialData={editingItem as any} 
            onSuccess={closeForm} 
            onCancel={closeForm} 
          />
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isto excluirá permanentemente a campanha.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={isPending}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
