"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  insertEventoSchema,
  type Evento,
  type EventoFormValues,
  tipoEventoEnum,
  statusEventoEnum,
  recorrenciaEnum,
} from "./schemas";
import { saveEvento } from "./actions";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";

type TipoEventoOption = { id: number; nome: string; icone?: string };

interface EventoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tiposEventoOptions: TipoEventoOption[];
  evento?: Evento | null;
}

export function EventoForm({
  open,
  onOpenChange,
  tiposEventoOptions,
  evento,
}: EventoFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // LÓGICA DE NORMALIZAÇÃO: Converte objetos de relacionamento em IDs e formata datas
  const normalizedValues = useMemo(() => {
    if (evento) {
      // Se tipo_id for objeto (vindo do get), pega o ID. Se for valor, mantém.
      const tipoId =
        typeof evento.tipo_id === "object" && evento.tipo_id !== null
          ? (evento.tipo_id as any)?.id
          : evento.tipo_id;

      // Formata datas para YYYY-MM-DD que o input date aceita
      let dataInicioFormatted = "";
      if (evento.data_inicio) {
        const dateStr = String(evento.data_inicio);
        if (dateStr.includes('T')) {
          dataInicioFormatted = dateStr.split('T')[0];
        } else if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          dataInicioFormatted = dateStr;
        }
      }

      let dataFimFormatted = "";
      if (evento.data_fim) {
        const dateStr = String(evento.data_fim);
        if (dateStr.includes('T')) {
          dataFimFormatted = dateStr.split('T')[0];
        } else if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          dataFimFormatted = dateStr;
        }
      }

      return {
        id: evento.id,
        nome: evento.nome,
        tipo_id: tipoId ?? "",
        data_inicio: dataInicioFormatted,
        data_fim: dataFimFormatted,
        descricao: evento.descricao || "",
        recorrencia: evento.recorrencia || "nao_recorrente",
        publico_alvo: evento.publico_alvo || "",
        tipo: evento.tipo || "evento",
        status: evento.status || "planejado",
        local: evento.local || "",
      };
    }

    // Valores padrão para criação
    return {
      nome: "",
      tipo_id: "",
      data_inicio: "",
      data_fim: "",
      descricao: "",
      recorrencia: "nao_recorrente",
      publico_alvo: "",
      tipo: "evento",
      status: "planejado",
      local: "",
    };
  }, [evento]);

  const form = useForm<EventoFormValues>({
    resolver: zodResolver(insertEventoSchema) as any,
    defaultValues: normalizedValues as any,
  });

  useEffect(() => {
    form.reset(normalizedValues as any);
  }, [normalizedValues, form]);

  const onSubmit = async (data: EventoFormValues) => {
    setIsSubmitting(true);

    try {
      const result = await saveEvento(data);

      if (result.success) {
        toast.success(result.message);
        onOpenChange(false);
        form.reset();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Erro ao salvar evento");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {evento ? "Editar Evento/Campanha" : "Novo Evento/Campanha"}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados do evento ou campanha abaixo.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Título */}
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Título *
                    <InfoTooltip text="Nome ou título identificador do evento ou campanha." />
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Campanha de Doação" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Primeira linha: 2 colunas */}
            <div className="grid grid-cols-2 gap-4">
              {/* Tipo de evento (da tabela config_tipos_evento) */}
              <FormField
                control={form.control}
                name="tipo_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Evento *</FormLabel>
                    <FormControl>
                      <Select
                        value={
                          typeof field.value === "string" ||
                          typeof field.value === "number"
                            ? String(field.value)
                            : ""
                        }
                        onValueChange={(value) =>
                          field.onChange(value ? Number(value) : "")
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione o tipo..." />
                        </SelectTrigger>
                        <SelectContent>
                          {tiposEventoOptions.map((opt) => (
                            <SelectItem
                              key={opt.id}
                              value={opt.id.toString()}
                            >
                              {opt.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Status
                      <InfoTooltip text="Situação atual do evento (Planejado, Em Andamento, Concluído, Cancelado)." />
                    </FormLabel>
                    <FormControl>
                      <Select
                        value={field.value || "planejado"}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione o status..." />
                        </SelectTrigger>
                        <SelectContent>
                          {statusEventoEnum.map((option) => (
                            <SelectItem
                              key={option.value}
                              value={option.value}
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Segunda linha: 2 colunas */}
            <div className="grid grid-cols-2 gap-4">
              {/* Data Inicial */}
              <FormField
                control={form.control}
                name="data_inicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Início *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Data Final */}
              <FormField
                control={form.control}
                name="data_fim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Data de Fim *
                      <InfoTooltip text="Data e hora de término do evento." />
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Terceira linha: 2 colunas */}
            <div className="grid grid-cols-2 gap-4">
              {/* Recorrência */}
              <FormField
                control={form.control}
                name="recorrencia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Recorrência
                      <InfoTooltip text="Define se o evento se repete (Diário, Semanal, Mensal) ou não." />
                    </FormLabel>
                    <FormControl>
                      <Select
                        value={field.value || "nao_recorrente"}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione a recorrência..." />
                        </SelectTrigger>
                        <SelectContent>
                          {recorrenciaEnum.map((option) => (
                            <SelectItem
                              key={option.value}
                              value={option.value}
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Local */}
              <FormField
                control={form.control}
                name="local"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Local
                      <InfoTooltip text="Local físico onde o evento será realizado." />
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Centro de Referência"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Quarta linha: 2 colunas */}
            <div className="grid grid-cols-2 gap-4">
              {/* Categoria de Tipo (campanha, evento, etc) */}
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Categoria
                      <InfoTooltip text="Classificação geral do evento (Evento, Campanha, etc)." />
                    </FormLabel>
                    <FormControl>
                      <Select
                        value={field.value || "evento"}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione a categoria..." />
                        </SelectTrigger>
                        <SelectContent>
                          {tipoEventoEnum.map((option) => (
                            <SelectItem
                              key={option.value}
                              value={option.value}
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Público Alvo */}
              <FormField
                control={form.control}
                name="publico_alvo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Público Alvo
                      <InfoTooltip text="Grupo de pessoas para quem o evento é direcionado." />
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Mulheres, Famílias..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Descrição (full width) */}
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Descrição
                    <InfoTooltip text="Descrição detalhada do evento, objetivos e informações relevantes." />
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o evento ou campanha em detalhes..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Botões */}
            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {evento ? "Atualizar" : "Cadastrar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
