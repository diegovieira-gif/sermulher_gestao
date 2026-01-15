"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  insertEventoSchema,
  type Evento,
  type EventoFormValues,
  TipoEvento,
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

interface EventoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evento?: Evento | null;
}

export function EventoForm({
  open,
  onOpenChange,
  evento,
}: EventoFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EventoFormValues>({
    resolver: zodResolver(insertEventoSchema),
    defaultValues: {
      nome: "",
      tipo: TipoEvento.CAMPANHA,
      data_inicio: "",
      data_fim: "",
      descricao: "",
    },
  });

  // Atualiza o formulário quando o evento muda
  useEffect(() => {
    if (evento) {
      form.reset({
        id: evento.id,
        nome: evento.nome,
        tipo: evento.tipo,
        data_inicio: evento.data_inicio,
        data_fim: evento.data_fim,
        descricao: evento.descricao || "",
      });
    } else {
      form.reset({
        nome: "",
        tipo: TipoEvento.CAMPANHA,
        data_inicio: "",
        data_fim: "",
        descricao: "",
      });
    }
  }, [evento, form]);

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
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                    >
                      <option value={TipoEvento.CAMPANHA}>
                        {TipoEvento.CAMPANHA}
                      </option>
                      <option value={TipoEvento.CURSO}>
                        {TipoEvento.CURSO}
                      </option>
                      <option value={TipoEvento.PALESTRA}>
                        {TipoEvento.PALESTRA}
                      </option>
                      <option value={TipoEvento.MUTIRAO}>
                        {TipoEvento.MUTIRAO}
                      </option>
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
