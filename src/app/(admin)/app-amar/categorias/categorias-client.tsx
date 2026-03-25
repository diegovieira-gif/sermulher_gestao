"use client";

import { useState, useTransition } from "react";
import { Plus, MoreHorizontal, Pencil, Trash2, CheckCircle, XCircle } from "lucide-react";
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
import { deleteCategoria, toggleCategoriaStatus } from "../actions";
import { CategoriaForm } from "./categoria-form";

interface Categoria {
  id: string;
  nome: string;
  slug: string;
  status: string;
  icone?: string;
  cor_hex?: string;
  ordem?: number;
}

interface CategoriasClientProps {
  initialData: Categoria[];
}

export function CategoriasClient({ initialData }: CategoriasClientProps) {
  const [isPending, startTransition] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Categoria | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;

    startTransition(async () => {
      const result = await deleteCategoria(deleteId);
      if (result.success) {
        toast.success("Categoria excluída com sucesso.");
      } else {
        toast.error(`Erro ao excluir categoria: ${result.error}`);
      }
      setDeleteId(null);
    });
  };

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "published" ? "draft" : "published";
    startTransition(async () => {
      const result = await toggleCategoriaStatus(id, newStatus);
      if (result.success) {
        toast.success(`Categoria ${newStatus === "published" ? "publicada" : "ocultada"}.`);
      } else {
        toast.error(`Erro ao atualizar status: ${result.error}`);
      }
    });
  };

  const handleCreateNew = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleEdit = (categoria: Categoria) => {
    setEditingItem(categoria);
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
        <h3 className="text-lg font-medium">Lista de Categorias</h3>
        <Button onClick={handleCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Categoria
        </Button>
      </div>

      <div className="rounded-md border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ordem</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Cor Primária</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Nenhuma categoria encontrada.
                </TableCell>
              </TableRow>
            ) : (
              initialData.map((categoria) => (
                <TableRow key={categoria.id}>
                  <TableCell className="text-muted-foreground">{categoria.ordem ?? "-"}</TableCell>
                  <TableCell className="font-medium">{categoria.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{categoria.slug}</TableCell>
                  <TableCell>
                    {categoria.cor_hex ? (
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full border border-gray-200" 
                          style={{ backgroundColor: categoria.cor_hex }} 
                        />
                        <span className="text-xs text-muted-foreground font-mono">{categoria.cor_hex}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sem cor</span>
                    )}
                  </TableCell>
                  <TableCell>{statusBadge(categoria.status)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(categoria)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          <span>Editar</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(categoria.id, categoria.status)}>
                          {categoria.status === "published" ? (
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
                          onClick={() => setDeleteId(categoria.id)}
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
        <SheetContent className="sm:max-w-md overflow-y-auto w-full">
          <SheetHeader className="mb-6">
            <SheetTitle>{editingItem ? "Editar Categoria" : "Nova Categoria"}</SheetTitle>
            <SheetDescription>
              {editingItem 
                ? "Atualize os detalhes da categoria abaixo." 
                : "Preencha os detalhes para criar uma nova categoria."}
            </SheetDescription>
          </SheetHeader>
          <CategoriaForm 
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
              Esta ação não pode ser desfeita. Isto excluirá permanentemente a categoria e todos os serviços vinculados a ela poderão perder a referência.
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
