"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  upsertAtendimentoSchema,
  type UpsertAtendimentoInput,
} from "./schemas";
import { saveAtendimento } from "./actions";
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
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type BeneficiariaOption = { id: number; nome_completo: string };
type OrigemOption = { id: number; nome: string };
type PrioridadeOption = { id: number; nome: string; cor?: string };

interface AtendimentoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  beneficiariasOptions: BeneficiariaOption[];
  origensOptions: OrigemOption[];
  prioridadesOptions: PrioridadeOption[];
  atendimento?: any | null;
}

export function AtendimentoForm({
  open,
  onOpenChange,
  beneficiariasOptions,
  origensOptions,
  prioridadesOptions,
  atendimento,
}: AtendimentoFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // LÓGICA DE NORMALIZAÇÃO: Converte objetos de relacionamento em IDs e formata data
  const normalizedValues = useMemo(() => {
    if (atendimento) {
      // Se origem_id for objeto (vindo do get), pega o ID. Se for valor, mantém.
      const origemId =
        typeof atendimento.origem_id === "object" && atendimento.origem_id !== null
          ? atendimento.origem_id?.id
          : atendimento.origem_id;

      const prioridadeId =
        typeof atendimento.prioridade_id === "object" && atendimento.prioridade_id !== null
          ? atendimento.prioridade_id?.id
          : atendimento.prioridade_id;

      const beneficiariaId =
        typeof atendimento.beneficiaria === "object" && atendimento.beneficiaria !== null
          ? atendimento.beneficiaria?.id
          : atendimento.beneficiaria;

      // Formata data para YYYY-MM-DD que o input date aceita
      // Usa split string simples para evitar problemas de timezone
      let dataAberturaFormatted = "";
      if (atendimento.data_abertura) {
        // Se já vier como YYYY-MM-DD, usa diretamente
        // Se vier como ISO completo (com T), pega apenas a parte da data
        const dateStr = String(atendimento.data_abertura);
        if (dateStr.includes('T')) {
          dataAberturaFormatted = dateStr.split('T')[0];
        } else if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // Já está no formato YYYY-MM-DD
          dataAberturaFormatted = dateStr;
        }
      }

      return {
        id: atendimento.id,
        beneficiaria: beneficiariaId ?? "",
        origem_id: origemId ?? "",
        prioridade_id: prioridadeId ?? "",
        data_abertura: dataAberturaFormatted,
        observacao_inicial: atendimento.observacao_inicial ?? "",
        status: atendimento.status,
      };
    }

    // Valores padrão para criação
    return {
      id: undefined,
      beneficiaria: "",
      origem_id: "",
      prioridade_id: "",
      data_abertura: new Date().toISOString().split("T")[0], // Hoje como padrão
      observacao_inicial: "",
    };
  }, [atendimento]);

  const form = useForm<UpsertAtendimentoInput>({
    resolver: zodResolver(upsertAtendimentoSchema),
    defaultValues: normalizedValues,
  });

  useEffect(() => {
    form.reset(normalizedValues);
  }, [normalizedValues, form]);

  const onSubmit = async (data: UpsertAtendimentoInput) => {
    setIsSubmitting(true);
    try {
      const result = await saveAtendimento(data);

      if (result.success) {
        toast.success(result.message);
        onOpenChange(false);
        form.reset();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Erro ao salvar atendimento");
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
            {atendimento ? "Editar Atendimento" : "Novo Atendimento"}
          </DialogTitle>
          <DialogDescription>
            Vincule uma beneficiária a um novo caso.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="data_abertura"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data do Atendimento</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="beneficiaria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beneficiária</FormLabel>
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
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    >
                      <option value="" disabled>
                        Selecione uma beneficiária...
                      </option>
                      {beneficiariasOptions.map((opt) => (
                        <option key={opt.id} value={opt.id.toString()}>
                          {opt.nome_completo}
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
                name="origem_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origem</FormLabel>
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
                          Selecione a origem...
                        </option>
                        {origensOptions.map((opt) => (
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

              <FormField
                control={form.control}
                name="prioridade_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade</FormLabel>
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
                          Selecione a prioridade...
                        </option>
                        {prioridadesOptions.map((opt) => (
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
            </div>

            <FormField
              control={form.control}
              name="observacao_inicial"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observação</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o caso brevemente (opcional)..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                {atendimento ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

