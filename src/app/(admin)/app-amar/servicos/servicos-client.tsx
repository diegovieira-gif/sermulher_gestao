"use client";

import { useState, useTransition, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { deleteServico, toggleServicoStatus } from "../actions";
import { ServicoForm } from "./servico-form";

interface Servico {
  id: string;
  titulo: string;
  slug: string;
  status: string;
  categoria_id: {
    id: string;
    nome: string;
  } | string | null;
  // Campos de sistema do Directus (vêm via fields: ["*"]).
  date_created?: string | null;
  date_updated?: string | null;
}

interface ServicosClientProps {
  initialData: Servico[];
  categorias: any[];
}

export function ServicosClient({ initialData, categorias }: ServicosClientProps) {
  const [isPending, startTransition] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Servico | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredData = useMemo(() => {
    return initialData.filter((servico) => {
      if (selectedCategory === "all") return true;
      
      const catId = typeof servico.categoria_id === "object" && servico.categoria_id !== null
        ? servico.categoria_id.id
        : servico.categoria_id;
        
      return catId === selectedCategory;
    });
  }, [initialData, selectedCategory]);

  const handleDelete = async () => {
    if (!deleteId) return;

    startTransition(async () => {
      const result = await deleteServico(deleteId);
      if (result.success) {
        toast.success("Serviço excluído com sucesso.");
      } else {
        toast.error(`Erro ao excluir serviço: ${result.error}`);
      }
      setDeleteId(null);
    });
  };

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "published" ? "draft" : "published";
    startTransition(async () => {
      const result = await toggleServicoStatus(id, newStatus);
      if (result.success) {
        toast.success(`Serviço ${newStatus === "published" ? "publicado" : "ocultado"}.`);
      } else {
        toast.error(`Erro ao atualizar status: ${result.error}`);
      }
    });
  };

  const handleCreateNew = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleEdit = (servico: Servico) => {
    setEditingItem(servico);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingItem(null);
  };

  // Formata timestamps do Directus (date_created/date_updated) como data pt-BR.
  const formatData = (value?: string | null) => {
    if (!value) return "—";
    const d = new Date(value);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("pt-BR");
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-lg shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-medium">Lista de Serviços</h3>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Categorias</SelectItem>
              {categorias?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Serviço
        </Button>
      </div>

      <div className="rounded-md border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data Cadastro</TableHead>
              <TableHead>Data Atualização</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Nenhum serviço encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((servico) => (
                <TableRow key={servico.id}>
                  <TableCell className="font-medium">{servico.titulo}</TableCell>
                  <TableCell className="text-muted-foreground">{servico.slug}</TableCell>
                  <TableCell>
                    {typeof servico.categoria_id === "object" && servico.categoria_id !== null
                      ? servico.categoria_id.nome
                      : "Sem Categoria"}
                  </TableCell>
                  <TableCell>{statusBadge(servico.status)}</TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">{formatData(servico.date_created)}</TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">{formatData(servico.date_updated)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(servico)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          <span>Editar</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(servico.id, servico.status)}>
                          {servico.status === "published" ? (
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
                          onClick={() => setDeleteId(servico.id)}
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

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isto excluirá permanentemente o serviço de nossos servidores.
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

      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto w-full">
          <SheetHeader className="mb-6">
            <SheetTitle>{editingItem ? "Editar Serviço" : "Novo Serviço"}</SheetTitle>
            <SheetDescription>
              {editingItem 
                ? "Atualize os detalhes do serviço abaixo." 
                : "Preencha os dados do novo serviço que será listado vinculando a uma categoria."}
            </SheetDescription>
          </SheetHeader>
          <ServicoForm 
            initialData={editingItem as any} 
            categorias={categorias}
            onSuccess={closeForm} 
            onCancel={closeForm} 
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
