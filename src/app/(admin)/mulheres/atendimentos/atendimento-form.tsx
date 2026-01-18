"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  atendimentoFormSchema,
  type AtendimentoFormValues,
  StatusAtendimento,
} from "./schemas";
import { saveAtendimento } from "./actions";
import type {
  BeneficiariaOption,
  OrigemOption,
  PrioridadeOption,
  EncaminhamentoOption,
  TipoViolenciaOption,
} from "./actions";
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
  encaminhamentosOptions: EncaminhamentoOption[];
  tiposViolenciaOptions: TipoViolenciaOption[];
  atendimento?: any | null;
}

export function AtendimentoForm({
  open,
  onOpenChange,
  beneficiariasOptions,
  origensOptions,
  prioridadesOptions,
  encaminhamentosOptions,
  tiposViolenciaOptions,
  atendimento,
}: AtendimentoFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const slugify = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

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

      const encaminhamentoId = (() => {
        if (typeof atendimento.encaminhamento_id === "object" && atendimento.encaminhamento_id !== null) {
          return atendimento.encaminhamento_id?.id;
        }
        if (typeof atendimento.encaminhamento_id === "number") {
          return atendimento.encaminhamento_id;
        }
        if (typeof atendimento.encaminhamento_rma === "string") {
          const slug = slugify(atendimento.encaminhamento_rma);
          const found = encaminhamentosOptions.find((opt) => {
            const optionSlug = slugify(opt.nome || "");
            return optionSlug === slug || optionSlug.includes(slug);
          });
          return found?.id;
        }
        return undefined;
      })();

      const tiposViolenciaIds = (() => {
        if (Array.isArray(atendimento.tipos_violencia_lista)) {
          return atendimento.tipos_violencia_lista
            .map((item: any) =>
              typeof item === "object" && item !== null ? item.id : Number(item)
            )
            .filter(Boolean);
        }

        if (Array.isArray(atendimento.tipos_violencia)) {
          return atendimento.tipos_violencia
            .map((item: any) =>
              typeof item === "object" && item !== null
                ? item.id
                : typeof item === "number"
                ? item
                : (() => {
                    const slug = slugify(String(item));
                    const match = tiposViolenciaOptions.find((opt) => slugify(opt.nome) === slug);
                    return match?.id;
                  })()
            )
            .filter(Boolean) as number[];
        }

        if (typeof atendimento.tipos_violencia === "string") {
          return atendimento.tipos_violencia
            .split(",")
            .map((v: string) => v.trim())
            .map((v: string) => {
              const slug = slugify(v);
              const match = tiposViolenciaOptions.find((opt) => slugify(opt.nome) === slug);
              return match?.id;
            })
            .filter(Boolean) as number[];
        }

        return [];
      })();

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
        encaminhamento_id: encaminhamentoId || undefined,
        tipos_violencia: tiposViolenciaIds,
      };
    }

    // Valores padrão para criação
    return {
      beneficiaria: undefined,
      origem_id: undefined,
      prioridade_id: undefined,
      status: StatusAtendimento.ABERTO,
      data_abertura: new Date().toISOString().split("T")[0],
      encaminhamento_id: undefined,
      tipos_violencia: [],
    };
  }, [atendimento, encaminhamentosOptions, tiposViolenciaOptions]);

  const form = useForm<AtendimentoFormValues>({
    resolver: zodResolver(atendimentoFormSchema) as any,
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
                name="encaminhamento_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Encaminhamento (config)</FormLabel>
                    <FormControl>
                      <Select
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        value={
                          typeof field.value === "number" || typeof field.value === "string"
                            ? field.value
                            : ""
                        }
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : undefined
                          )
                        }
                      >
                        <option value="">Selecione o encaminhamento...</option>
                        {encaminhamentosOptions.map((opt) => (
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

            {/* Card: Tipos de Violência */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="text-sm font-semibold">Tipos de Violência</h3>
              
              <FormField
                control={form.control}
                name="tipos_violencia"
                render={() => (
                  <FormItem>
                    <div className="space-y-3">
                      {tiposViolenciaOptions.map((tipo) => (
                        <FormField
                          key={tipo.id}
                          control={form.control}
                          name="tipos_violencia"
                          render={({ field }) => {
                            const isChecked =
                              Array.isArray(field.value) &&
                              field.value.includes(tipo.id);
                            return (
                              <FormItem
                                key={tipo.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={(checked: boolean) => {
                                      const currentValue = Array.isArray(field.value) ? field.value : [];
                                      const newValue = checked
                                        ? [...currentValue, tipo.id]
                                        : currentValue.filter((value) => value !== tipo.id);
                                      field.onChange(newValue);
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal capitalize">
                                  {tipo.nome}
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
