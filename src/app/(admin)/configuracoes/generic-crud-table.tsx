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
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { saveAuxItem, deleteAuxItem, type ConfigCollection } from "./actions";
import { Badge } from "@/components/ui/badge";

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

const createSchema = (hasColor: boolean) =>
  z.object({
    id: z.number().optional(),
    nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    status: z.string().default("published"),
    cor: hasColor ? z.string().optional() : z.string().optional(),
    peso: z.coerce.number().optional(),
  });

export function GenericCrudTable({
  collectionName,
  title,
  items,
  columns,
  hasColorField = false,
}: GenericCrudTableProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const formSchema = createSchema(hasColorField);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: { // Explicitly set default values for all fields in the schema
      nome: "",
      status: "published",
      cor: "#000000",
      peso: 1,
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  function handleEdit(item: any) {
    setSelectedItem(item);
    form.reset({
      id: item.id,
      nome: item.nome,
      // Se não tiver status no banco, assume published no form
      status: item.status || "published",
      cor: item.cor || "#000000",
      peso: item.peso || 1,
    });
    setFormOpen(true);
  }

  function handleCreate() {
    setSelectedItem(null);
    form.reset({
      nome: "",
      status: "published",
      cor: "#000000",
      peso: 1,
    });
    setFormOpen(true);
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // @ts-ignore
      const result = await saveAuxItem(collectionName, values);

      if (result.success) {
        toast.success(selectedItem ? "Item atualizado!" : "Item criado!");
        setFormOpen(false);
      } else {
        toast.error(result.error || "Erro ao salvar.");
      }
    } catch (error) {
      toast.error("Erro inesperado.");
    }
  }

  function handleDeleteClick(id: number) {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const result = await deleteAuxItem(collectionName, itemToDelete);
      if (result.success) {
        toast.success("Item excluído!");
      } else {
        toast.error("Erro ao excluir.");
      }
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <Button onClick={handleCreate} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Novo
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key}>{col.label}</TableHead>
              ))}
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 2}
                  className="text-center h-24 text-muted-foreground"
                >
                  Nenhum item encontrado.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => {
                // LÓGICA CORRIGIDA: Se status for undefined/null ou 'published', é Ativo.
                const isActive = !item.status || item.status === 'published';
                
                return (
                  <TableRow key={item.id}>
                    {columns.map((col) => (
                      <TableCell key={col.key}>
                        {col.render ? col.render(item) : item[col.key]}
                      </TableCell>
                    ))}
                    
                    {/* Coluna de Status */}
                    <TableCell>
                      <Badge 
                        variant={isActive ? 'default' : 'secondary'}
                        className={isActive ? 'bg-green-600 hover:bg-green-700' : ''}
                      >
                        {isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>

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
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedItem ? `Editar ${title}` : `Novo ${title}`}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo.
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
                      <Input placeholder="Ex: Item A" {...field} />
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
                      <FormLabel>Cor (Hex)</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input type="color" className="w-12 h-10 p-1" {...field} />
                        </FormControl>
                        <Input 
                          placeholder="#000000" 
                          {...field} 
                          className="flex-1"
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="published">Ativo</SelectItem>
                          <SelectItem value="draft">Inativo (Rascunho)</SelectItem>
                          <SelectItem value="archived">Arquivado</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
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
      {/* Dialog Delete mantido... */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
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