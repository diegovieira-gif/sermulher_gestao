"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  insertEventoSchema,
  type Evento,
  type EventoFormValues,
  tipoEventoEnum,
  recorrenciaEnum,
} from "./schemas";
import { saveEvento } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { todayLocalISO } from "@/lib/utils";
import { Loader2, Info } from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";

type TipoEventoOption = { id: number; nome: string; icone?: string };

interface EventoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tiposEventoOptions: TipoEventoOption[];
  evento?: Evento | null;
  onSuccess?: () => void;
}

/**
 * Valor para `<input type="date">`, no formato AAAA-MM-DD.
 *
 * As colunas data_inicio/data_fim são do tipo `date` no banco — sem hora. O
 * formulário usava `datetime-local` e convertia para ISO na gravação: a hora
 * era descartada pelo Postgres, dando a impressão de que a edição não salvava.
 * E a leitura de volta, via `new Date("2026-03-20")`, era interpretada como
 * meia-noite UTC e exibida como 21:00 do dia anterior no fuso local.
 *
 * Aqui a string é usada como está, sem passar por Date — que é justamente o que
 * introduzia o deslocamento.
 */
function formatarParaDateInput(data: string | Date | undefined | null): string {
  if (!data) return "";
  if (typeof data === "string") return data.slice(0, 10);
  try {
    return todayLocalISO(data);
  } catch {
    return "";
  }
}

export function EventoForm({
  open,
  onOpenChange,
  tiposEventoOptions,
  evento,
  onSuccess,
}: EventoFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EventoFormValues>({
    resolver: zodResolver(insertEventoSchema),
    defaultValues: {
      nome: "",
      tipo_id: undefined,
      data_inicio: "",
      data_fim: "",
      descricao: "",
      tipo: undefined,
      recorrencia: "nao_recorrente",
      local: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (evento) {
        const resolvedTipoId =
          typeof evento.tipo_id === "object" && evento.tipo_id !== null
            ? (evento.tipo_id as any).id
            : evento.tipo_id;

        form.reset({
          nome: evento.nome || "",
          tipo_id: resolvedTipoId || undefined,
          data_inicio: formatarParaDateInput(evento.data_inicio),
          data_fim: formatarParaDateInput(evento.data_fim),
          descricao: evento.descricao || "",
          tipo: evento.tipo || undefined,
          recorrencia: evento.recorrencia || "nao_recorrente",
          local: evento.local || "",
        });
      } else {
        form.reset({
          nome: "",
          tipo_id: undefined,
          data_inicio: "",
          data_fim: "",
          descricao: "",
          tipo: undefined,
          recorrencia: "nao_recorrente",
          local: "",
        });
      }
    }
  }, [evento, open, form]);

  const onSubmit = async (data: EventoFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        tipo_id: Number(data.tipo_id),
        // Enviadas como AAAA-MM-DD, que é exatamente o que a coluna `date`
        // armazena. Converter para ISO só fazia o Postgres truncar a hora.
        data_inicio: data.data_inicio.slice(0, 10),
        data_fim: data.data_fim.slice(0, 10),
        id: evento?.id, // Passa ID se for edição
      };

      const result = await saveEvento(payload);

      if (result.success) {
        toast.success(
          evento ? "Evento atualizado!" : "Evento criado com sucesso!",
        );
        onOpenChange(false);
        form.reset();
        if (onSuccess) onSuccess();
      } else {
        toast.error("Erro ao salvar: " + result.error);
      }
    } catch (error) {
      toast.error("Erro inesperado ao salvar evento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{evento ? "Editar Evento" : "Novo Evento"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Nome e Tipo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Evento</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Outubro Rosa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipo_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Evento</FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(Number(val))}
                      value={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tiposEventoOptions.map((tipo) => (
                          <SelectItem key={tipo.id} value={tipo.id.toString()}>
                            {tipo.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Datas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_inicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Início</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data_fim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fim (Término)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tipo (Categoria) e Recorrência */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria (Tipo)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tipoEventoEnum.map((tipo) => (
                          <SelectItem key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recorrencia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recorrência</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {recorrenciaEnum.map((rec) => (
                          <SelectItem key={rec.value} value={rec.value}>
                            {rec.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Local */}
            <FormField
              control={form.control}
              name="local"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Local</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Auditório A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descrição */}
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Descrição
                    <InfoTooltip text="Detalhes do evento para o público interno." />
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalhes sobre o evento..."
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Salvar Evento
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
