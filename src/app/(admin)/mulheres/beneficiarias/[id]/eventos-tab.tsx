"use client";

import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  participacaoEventoSchema,
  type ParticipacaoEventoFormInput,
  type ParticipacaoEventoFormValues,
} from "../schemas";
import { registrarParticipacaoEvento, deletarParticipacaoEvento } from "../actions";
import { CalendarDays, Plus, Trash2, Loader2, Calendar, User } from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export type HistoricoParticipacaoEvento = {
  id: number;
  data_participacao: string | null;
  observacao?: string | null;
  evento?: { id: number; nome?: string | null } | null;
  user_created?: { first_name?: string | null; last_name?: string | null; email?: string | null } | null;
};

export type EventoOption = {
  id: number;
  nome: string;
};

interface EventosTabProps {
  beneficiariaId: number;
  beneficiariaNome: string;
  eventosOptions: EventoOption[];
  historico: HistoricoParticipacaoEvento[];
  canDelete?: boolean;
}

export function EventosTab({
  beneficiariaId,
  beneficiariaNome,
  eventosOptions,
  historico,
  canDelete = true,
}: EventosTabProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [historicoState, setHistoricoState] = useState<HistoricoParticipacaoEvento[]>(historico);

  const form = useForm<ParticipacaoEventoFormInput, any, ParticipacaoEventoFormValues>({
    resolver: zodResolver(participacaoEventoSchema),
    defaultValues: {
      beneficiaria: beneficiariaId,
      evento: undefined,
      data_participacao: new Date().toISOString().slice(0, 10),
      observacao: "",
    },
  });

  const eventoOptionsSorted = useMemo(
    () => [...eventosOptions].sort((a, b) => (a.nome || "").localeCompare(b.nome || "")),
    [eventosOptions],
  );

  const handleSubmit = (values: ParticipacaoEventoFormValues) => {
    startTransition(async () => {
      const payload = { ...values, beneficiaria: beneficiariaId };

      const result = await registrarParticipacaoEvento(payload);
      if (!result.success) {
        toast.error(result.error ?? "Não foi possível registrar a participação.");
        return;
      }

      const novaParticipacao = result.data as HistoricoParticipacaoEvento;
      setHistoricoState((prev) => [novaParticipacao, ...prev]);
      toast.success(result.message ?? "Participação registrada");
      form.reset({
        beneficiaria: beneficiariaId,
        evento: undefined,
        data_participacao: new Date().toISOString().slice(0, 10),
        observacao: "",
      });
      setIsOpen(false);
    });
  };

  const handleDelete = async (id: number) => {
    try {
      setIsDeleting(id);
      const result = await deletarParticipacaoEvento(id, beneficiariaId);
      if (!result.success) {
        toast.error(result.error ?? "Erro ao excluir participação");
        return;
      }
      setHistoricoState((prev) => prev.filter((item) => item.id !== id));
      toast.success("Participação removida");
    } catch (error) {
      console.error(error);
      toast.error("Falha ao excluir participação");
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Beneficiária</p>
            <h3 className="text-lg font-semibold leading-tight">{beneficiariaNome}</h3>
          </div>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Registrar Participação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Registrar participação em evento</DialogTitle>
              <DialogDescription>
                Informe o evento/campanha e a data da participação.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="evento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Evento *
                        <InfoTooltip text="Evento ou campanha do qual a beneficiária participou." />
                      </FormLabel>
                      <FormControl>
                        <Select
                          value={field.value ? String(field.value) : undefined}
                          onValueChange={(value) => field.onChange(Number(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o evento" />
                          </SelectTrigger>
                          <SelectContent>
                            {eventoOptionsSorted.map((evento) => (
                              <SelectItem key={evento.id} value={String(evento.id)}>
                                {evento.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="data_participacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data da participação *</FormLabel>
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
                  name="observacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observação</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Detalhes adicionais (opcional)"
                          className="resize-none"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit" disabled={isPending} className="gap-2">
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Salvar participação
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
              <TableHead>
                Data
                <InfoTooltip text="Data em que a beneficiária participou do evento." />
              </TableHead>
              <TableHead>
                Evento
                <InfoTooltip text="Evento ou campanha." />
              </TableHead>
              <TableHead>Observação</TableHead>
              <TableHead>
                Registrado por
                <InfoTooltip text="Profissional que registrou a participação." />
              </TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {historicoState.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                  Nenhuma participação em evento registrada para esta beneficiária.
                </TableCell>
              </TableRow>
            ) : (
              historicoState.map((participacao) => (
                <TableRow key={participacao.id}>
                  <TableCell>
                    {participacao.data_participacao
                      ? new Date(participacao.data_participacao).toLocaleDateString("pt-BR")
                      : "-"}
                  </TableCell>
                  <TableCell className="font-medium">
                    {participacao.evento?.nome || "-"}
                  </TableCell>
                  <TableCell className="max-w-[16rem] truncate text-muted-foreground">
                    {participacao.observacao || "-"}
                  </TableCell>
                  <TableCell className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {participacao.user_created
                      ? `${participacao.user_created.first_name || ""} ${participacao.user_created.last_name || ""}`.trim() || participacao.user_created.email || "Usuário do Sistema"
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
                            disabled={isDeleting === participacao.id}
                          >
                            {isDeleting === participacao.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir participação?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação removerá o registro da participação neste evento.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => handleDelete(participacao.id)}
                              disabled={isDeleting === participacao.id}
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
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
