"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  insertEventoSchema,
  type Evento,
  type EventoFormValues,
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
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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
          ? evento.tipo_id?.id
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
      };
    }

    // Valores padrão para criação
    return {
      nome: "",
      tipo_id: "",
      data_inicio: "",
      data_fim: "",
      descricao: "",
    };
  }, [evento]);

  const form = useForm<EventoFormValues>({
    resolver: zodResolver(insertEventoSchema),
    defaultValues: normalizedValues,
  });

  useEffect(() => {
    form.reset(normalizedValues);
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Campanha de Doação" {...field} />
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
                  <FormLabel>Tipo</FormLabel>
                  <FormControl>
                    <Select
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      value={
                        typeof field.value === "string" ||
                        typeof field.value === "number"
                          ? field.value
                          : ""
                      }
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? Number(e.target.value) : ""
                        )
                      }
                    >
                      <option value="" disabled>
                        Selecione o tipo de evento...
                      </option>
                      {tiposEventoOptions.map((opt) => (
                        <option key={opt.id} value={opt.id.toString()}>
                          {opt.nome}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_inicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Início</FormLabel>
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
                    <FormLabel>Data de Fim</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o evento ou campanha..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Botões */}
            <div className="flex justify-end gap-4">
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
