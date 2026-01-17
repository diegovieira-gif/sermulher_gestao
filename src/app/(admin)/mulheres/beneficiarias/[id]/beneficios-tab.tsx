"use client";

import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { entregaBeneficioSchema, type EntregaBeneficioFormValues } from "../schemas";
import { registrarEntrega, deletarEntrega } from "../actions";
import { Gift, Package, Trash2, Loader2, Calendar, User } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export type HistoricoEntrega = {
  id: number;
  data_entrega: string | null;
  quantidade: number | null;
  observacao?: string | null;
  beneficio?: { id: number; nome?: string | null } | null;
  user_created?: { first_name?: string | null; last_name?: string | null; email?: string | null } | null;
};

export type BeneficioOption = {
  id: number;
  nome: string;
};

interface BeneficiosTabProps {
  beneficiariaId: number;
  beneficiariaNome: string;
  beneficiosOptions: BeneficioOption[];
  historico: HistoricoEntrega[];
  canDelete?: boolean;
}

export function BeneficiosTab({
  beneficiariaId,
  beneficiariaNome,
  beneficiosOptions,
  historico,
  canDelete = true,
}: BeneficiosTabProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [historicoState, setHistoricoState] = useState<HistoricoEntrega[]>(historico);

  const form = useForm<EntregaBeneficioFormValues>({
    resolver: zodResolver(entregaBeneficioSchema),
    defaultValues: {
      beneficiaria: beneficiariaId,
      beneficio: undefined,
      data_entrega: new Date().toISOString().slice(0, 10),
      quantidade: 1,
      observacao: "",
    },
  });

  const beneficioOptionsSorted = useMemo(
    () => [...beneficiosOptions].sort((a, b) => a.nome.localeCompare(b.nome)),
    [beneficiosOptions]
  );

  const handleSubmit = (values: EntregaBeneficioFormValues) => {
    startTransition(async () => {
      const payload = { ...values, beneficiaria: beneficiariaId };

      const result = await registrarEntrega(payload);
      if (!result.success) {
        toast.error(result.error ?? "Não foi possível registrar a entrega.");
        return;
      }

      const novaEntrega = result.data as HistoricoEntrega;
      setHistoricoState((prev) => [novaEntrega, ...prev]);
      toast.success(result.message ?? "Entrega registrada");
      form.reset({
        beneficiaria: beneficiariaId,
        beneficio: undefined,
        data_entrega: new Date().toISOString().slice(0, 10),
        quantidade: 1,
        observacao: "",
      });
      setIsOpen(false);
    });
  };

  const handleDelete = async (id: number) => {
    try {
      setIsDeleting(id);
      const result = await deletarEntrega(id, beneficiariaId);
      if (!result.success) {
        toast.error(result.error ?? "Erro ao excluir entrega");
        return;
      }
      setHistoricoState((prev) => prev.filter((item) => item.id !== id));
      toast.success("Entrega removida");
    } catch (error) {
      console.error(error);
      toast.error("Falha ao excluir entrega");
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <Gift className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Beneficiária</p>
            <h3 className="text-lg font-semibold leading-tight">{beneficiariaNome}</h3>
          </div>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Package className="h-4 w-4" />
              Registrar Entrega
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Registrar nova entrega</DialogTitle>
              <DialogDescription>
                Informe o benefício entregue, a data e a quantidade.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="beneficio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Benefício *</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value ? String(field.value) : undefined}
                          onValueChange={(value) => field.onChange(Number(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o benefício" />
                          </SelectTrigger>
                          <SelectContent>
                            {beneficioOptionsSorted.map((beneficio) => (
                              <SelectItem key={beneficio.id} value={String(beneficio.id)}>
                                {beneficio.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="data_entrega"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data da entrega *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input type="date" className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quantidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            step={1}
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="observacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observação</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Detalhes adicionais (opcional)"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit" disabled={isPending} className="gap-2">
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
                    Salvar entrega
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Benefício</TableHead>
              <TableHead>Qtd</TableHead>
              <TableHead>Entregue por</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {historicoState.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                  Nenhuma entrega registrada para esta beneficiária.
                </TableCell>
              </TableRow>
            ) : (
              historicoState.map((entrega) => {
                const entregador = [
                  entrega.user_created?.first_name,
                  entrega.user_created?.last_name,
                ]
                  .filter(Boolean)
                  .join(" ") || entrega.user_created?.email || "-";

                return (
                  <TableRow key={entrega.id}>
                    <TableCell>
                      {entrega.data_entrega
                        ? new Date(entrega.data_entrega).toLocaleDateString("pt-BR")
                        : "-"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {entrega.beneficio?.nome || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{entrega.quantidade ?? 1}</Badge>
                    </TableCell>
                    <TableCell className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
{entrega.user_created 
    ? `${entrega.user_created.first_name || ''} ${entrega.user_created.last_name || ''}`.trim() || entrega.user_created.email || "Usuário do Sistema"
    : "Sistema / Importação"}
                    </TableCell>
                    <TableCell className="text-right">
                      {canDelete ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              disabled={isDeleting === entrega.id}
                            >
                              {isDeleting === entrega.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir entrega?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação removerá o registro da entrega para esta beneficiária.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => handleDelete(entrega.id)}
                                disabled={isDeleting === entrega.id}
                              >
                                Confirmar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <span className="text-muted-foreground">Sem permissão</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
