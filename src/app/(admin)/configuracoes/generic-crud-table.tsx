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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { saveAuxItem, deleteAuxItem, type ConfigCollection } from "./actions";
import { Loader2 } from "lucide-react";

interface GenericCrudTableProps {
  collectionName: ConfigCollection;
  title: string;
  items: any[];
  columns: Array<{
    key: string;
    label: string;
    render?: (item: any) => React.ReactNode;
  }>;
  hasColorField?: boolean;
}

// Schema dinâmico baseado em se tem campo de cor
const createSchema = (hasColorField: boolean) => {
  const baseSchema = {
    nome: z.string().min(1, "Nome é obrigatório"),
  };

  if (hasColorField) {
    return z.object({
      ...baseSchema,
      cor: z.string().optional(),
    });
  }

  return z.object(baseSchema);
};

export function GenericCrudTable({
  collectionName,
  title,
  items,
  columns,
  hasColorField = false,
}: GenericCrudTableProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schema = createSchema(hasColorField);
  type FormValues = z.infer<typeof schema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: "",
      ...(hasColorField && { cor: "" }),
    },
  });

  const handleNew = () => {
    setSelectedItem(null);
    form.reset({
      nome: "",
      ...(hasColorField && { cor: "" }),
    });
    setFormOpen(true);
  };

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    form.reset({
      nome: item.nome || "",
      ...(hasColorField && { cor: item.cor || "" }),
    });
    setFormOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    try {
      const result = await deleteAuxItem(collectionName, itemToDelete);

      if (result.success) {
        toast.success(result.message);
        setDeleteDialogOpen(false);
        setItemToDelete(null);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Erro ao excluir item");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);

    try {
      // Preserva campos adicionais do item original (como "ativo", "nivel", "peso", "icone")
      const additionalFields = selectedItem
        ? Object.keys(selectedItem).reduce((acc, key) => {
            if (key !== "id" && key !== "nome" && key !== "cor") {
              acc[key] = selectedItem[key];
            }
            return acc;
          }, {} as Record<string, any>)
        : {};

      const result = await saveAuxItem(collectionName, {
        ...data,
        ...additionalFields,
        ...(selectedItem && { id: selectedItem.id }),
      });

      if (result.success) {
        toast.success(result.message);
        setFormOpen(false);
        form.reset();
        setSelectedItem(null);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Erro ao salvar item");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-muted-foreground">
            Gerencie os itens de {title.toLowerCase()}
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Novo
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key}>{col.label}</TableHead>
              ))}
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  className="text-center text-muted-foreground"
                >
                  Nenhum item cadastrado
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      {col.render
                        ? col.render(item)
                        : item[col.key] || "-"}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(item.id)}
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

      {/* Dialog de Formulário */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedItem ? `Editar ${title}` : `Novo ${title}`}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo para {selectedItem ? "atualizar" : "criar"} o item.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o nome" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {hasColorField && (
                <FormField
                  control={form.control}
                  name="cor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            className="w-20 h-9"
                            {...field}
                            value={field.value || "#000000"}
                          />
                          <Input
                            placeholder="#000000"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {selectedItem ? "Atualizar" : "Cadastrar"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O item será excluído permanentemente.
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
