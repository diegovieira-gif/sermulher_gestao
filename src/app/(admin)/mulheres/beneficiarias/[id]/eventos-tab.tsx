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
import { CalendarDays, Plus, Trash2, Loader2, Calendar, User, AlertTriangle } from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { toast } from "sonner";
import {
  formatDateDisplay,
  nomeDeQuemRegistrou,
  todayLocalISO,
} from "@/lib/utils";
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
  FormDescription,
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
  data_inicio?: string | null;
  data_fim?: string | null;
};

/** Só a parte AAAA-MM-DD, ignorando hora e fuso. */
const soData = (valor?: string | null): string =>
  typeof valor === "string" && valor.length >= 10 ? valor.slice(0, 10) : "";

/**
 * Data sugerida ao escolher um evento.
 *
 * Se hoje está dentro do período do evento, hoje é a resposta mais provável
 * (registro feito durante a ação). Fora dele, o início do evento é o palpite
 * razoável — melhor que "hoje", que ficaria fora do período.
 */
export function dataSugeridaParaEvento(
  evento: EventoOption | undefined,
  hoje: string,
): string {
  const inicio = soData(evento?.data_inicio);
  const fim = soData(evento?.data_fim) || inicio;
  if (!inicio) return hoje;
  // Comparação lexicográfica funciona em AAAA-MM-DD.
  if (hoje >= inicio && hoje <= fim) return hoje;
  return inicio;
}

/** A data informada está fora do período do evento? */
export function foraDoPeriodo(
  evento: EventoOption | undefined,
  data: string,
): boolean {
  const inicio = soData(evento?.data_inicio);
  const fim = soData(evento?.data_fim) || inicio;
  if (!inicio || !data) return false;
  return data < inicio || data > fim;
}

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
      data_participacao: todayLocalISO(),
      observacao: "",
    },
  });

  const eventoOptionsSorted = useMemo(
    () => [...eventosOptions].sort((a, b) => (a.nome || "").localeCompare(b.nome || "")),
    [eventosOptions],
  );

  // Evento escolhido no formulário, para sugerir a data e avisar quando ela
  // cair fora do período em que o evento aconteceu.
  const eventoIdSelecionado = form.watch("evento");
  const eventoSelecionado = useMemo(
    () => eventosOptions.find((e) => e.id === Number(eventoIdSelecionado)),
    [eventosOptions, eventoIdSelecionado],
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
        data_participacao: todayLocalISO(),
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
                          onValueChange={(value) => {
                            const id = Number(value);
                            field.onChange(id);
                            // Sugere uma data coerente com o período do evento.
                            // Sem isto o campo ficava em "hoje", frequentemente
                            // fora do período em que o evento aconteceu.
                            const evento = eventosOptions.find((e) => e.id === id);
                            form.setValue(
                              "data_participacao",
                              dataSugeridaParaEvento(evento, todayLocalISO()),
                              { shouldValidate: true },
                            );
                          }}
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
                      {eventoSelecionado?.data_inicio && (
                        <FormDescription>
                          Período do evento:{" "}
                          {formatDateDisplay(eventoSelecionado.data_inicio)}
                          {eventoSelecionado.data_fim &&
                          eventoSelecionado.data_fim.slice(0, 10) !==
                            eventoSelecionado.data_inicio.slice(0, 10)
                            ? ` a ${formatDateDisplay(eventoSelecionado.data_fim)}`
                            : ""}
                        </FormDescription>
                      )}
                      {/* Aviso, não bloqueio: registrar fora do período pode ser
                          legítimo (reposição, atendimento posterior). Quem sabe
                          é a técnica — o sistema só sinaliza o provável engano. */}
                      {foraDoPeriodo(eventoSelecionado, field.value || "") && (
                        <p className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          Esta data está fora do período do evento. Confirme se
                          está correta.
                        </p>
                      )}
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
                      ? formatDateDisplay(participacao.data_participacao)
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
                    {nomeDeQuemRegistrou(participacao.user_created)}
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
