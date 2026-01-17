"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  atendimentoFormSchema, 
  type AtendimentoFormValues, 
  StatusAtendimento,
  EncaminhamentoRMA,
  tiposViolenciaDisponiveis,
} from "./schemas";
import { saveAtendimento } from "./actions";
import type { BeneficiariaOption, OrigemOption, PrioridadeOption } from "./actions";
import { BeneficiariaComboBox } from "./beneficiaria-combobox";
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
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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

  // Normaliza os dados do Directus para o formulário
  const normalizedValues = useMemo(() => {
    if (atendimento) {
      const beneficiariaId =
        typeof atendimento.beneficiaria === "object" && atendimento.beneficiaria !== null
          ? atendimento.beneficiaria?.id
          : atendimento.beneficiaria;

      const origemId =
        typeof atendimento.origem_id === "object" && atendimento.origem_id !== null
          ? atendimento.origem_id?.id
          : atendimento.origem_id;

      const prioridadeId =
        typeof atendimento.prioridade_id === "object" && atendimento.prioridade_id !== null
          ? atendimento.prioridade_id?.id
          : atendimento.prioridade_id;

      // Formata data para YYYY-MM-DD
      let dataAberturaFormatted = "";
      if (atendimento.data_abertura) {
        const dateStr = String(atendimento.data_abertura);
        if (dateStr.includes("T")) {
          dataAberturaFormatted = dateStr.split("T")[0];
        } else if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          dataAberturaFormatted = dateStr;
        }
      }

      return {
        id: atendimento.id,
        beneficiaria: beneficiariaId || undefined,
        origem_id: origemId || undefined,
        prioridade_id: prioridadeId || undefined,
        status: atendimento.status || StatusAtendimento.ABERTO,
        data_abertura: dataAberturaFormatted || new Date().toISOString().split("T")[0],
        encaminhamento_rma: atendimento.encaminhamento_rma || undefined,
        tipos_violencia: Array.isArray(atendimento.tipos_violencia) 
          ? atendimento.tipos_violencia 
          : atendimento.tipos_violencia 
            ? atendimento.tipos_violencia.split(",").map((v: string) => v.trim()) 
            : [],
      };
    }

    // Valores padrão para criação
    return {
      beneficiaria: undefined,
      origem_id: undefined,
      prioridade_id: undefined,
      status: StatusAtendimento.ABERTO,
      data_abertura: new Date().toISOString().split("T")[0],
      encaminhamento_rma: undefined,
      tipos_violencia: [],
    };
  }, [atendimento]);

  const form = useForm<AtendimentoFormValues>({
    resolver: zodResolver(atendimentoFormSchema),
    defaultValues: normalizedValues,
  });

  useEffect(() => {
    form.reset(normalizedValues);
  }, [normalizedValues, form]);

  const onSubmit = async (data: AtendimentoFormValues) => {
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
            Registre um novo atendimento para uma beneficiária.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Card: Quem é a vítima? */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="text-sm font-semibold">Quem é a vítima?</h3>
              
              <FormField
                control={form.control}
                name="beneficiaria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beneficiária *</FormLabel>
                    <FormControl>
                      <BeneficiariaComboBox
                        options={beneficiariasOptions}
                        value={field.value}
                        onValueChange={(value) => field.onChange(value)}
                        placeholder="Buscar beneficiária por nome ou CPF..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Card: Dados da Triagem */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="text-sm font-semibold">Dados da Triagem</h3>
              
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
                              e.target.value ? Number(e.target.value) : undefined
                            )
                          }
                        >
                          <option value="">Selecione a origem...</option>
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
                              e.target.value ? Number(e.target.value) : undefined
                            )
                          }
                        >
                          <option value="">Selecione a prioridade...</option>
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="data_abertura"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Abertura</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <Select
                          name={field.name}
                          ref={field.ref}
                          onBlur={field.onBlur}
                          value={field.value || StatusAtendimento.ABERTO}
                          onChange={(e) => field.onChange(e.target.value)}
                        >
                          {Object.values(StatusAtendimento).map((status) => (
                            <option key={status} value={status}>
                              {status}
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
                name="encaminhamento_rma"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Encaminhamento RMA</FormLabel>
                    <FormControl>
                      <Select
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value || undefined)}
                      >
                        <option value="">Selecione o encaminhamento...</option>
                        <option value={EncaminhamentoRMA.CRAS}>CRAS - Centro de Referência de Assistência Social</option>
                        <option value={EncaminhamentoRMA.CREAS}>CREAS - Centro de Referência Especializado de Assistência Social</option>
                        <option value={EncaminhamentoRMA.SAUDE}>Saúde</option>
                        <option value={EncaminhamentoRMA.EDUCACAO}>Educação</option>
                        <option value={EncaminhamentoRMA.TERCEIRO_SETOR}>Terceiro Setor</option>
                        <option value={EncaminhamentoRMA.CASA_ABRIGO}>Casa Abrigo</option>
                        <option value={EncaminhamentoRMA.DELEGACIA}>Delegacia</option>
                        <option value={EncaminhamentoRMA.NENHUM}>Nenhum</option>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Card: Tipos de Violência */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="text-sm font-semibold">Tipos de Violência</h3>
              
              <FormField
                control={form.control}
                name="tipos_violencia"
                render={() => (
                  <FormItem>
                    <div className="space-y-3">
                      {tiposViolenciaDisponiveis.map((tipo) => (
                        <FormField
                          key={tipo}
                          control={form.control}
                          name="tipos_violencia"
                          render={({ field }) => {
                            const isChecked = Array.isArray(field.value) && field.value.includes(tipo);
                            return (
                              <FormItem
                                key={tipo}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={(checked: boolean) => {
                                      const currentValue = Array.isArray(field.value) ? field.value : [];
                                      const newValue = checked
                                        ? [...currentValue, tipo]
                                        : currentValue.filter((value) => value !== tipo);
                                      field.onChange(newValue);
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal capitalize">
                                  {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-4 pt-4 border-t">
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
