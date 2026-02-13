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
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";

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

const RISCO_OPTIONS = ["Sim", "Não", "Não se aplica"];

const PERGUNTAS_RISCO = [
  { key: "violencia_aumentando", label: "A violência está aumentando?" },
  { key: "filhos_com_agressor", label: "Possui filhos com o agressor?" },
  { key: "conflito_guarda", label: "Há conflito sobre guarda dos filhos?" },
  { key: "tentou_separar", label: "Tentou se separar recentemente?" },
  { key: "agressor_persegue", label: "O agressor persegue a vítima?" },
  { key: "agressor_armas", label: "O agressor possui armas de fogo?" },
  { key: "agressor_drogas", label: "O agressor faz uso de drogas/álcool?" },
  { key: "agressor_ameaca_morte", label: "O agressor ameaçou de morte?" },
];

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
        typeof atendimento.beneficiaria === "object" &&
          atendimento.beneficiaria !== null
          ? atendimento.beneficiaria?.id
          : atendimento.beneficiaria;

      const origemId =
        typeof atendimento.origem_id === "object" &&
          atendimento.origem_id !== null
          ? atendimento.origem_id?.id
          : atendimento.origem_id;

      const prioridadeId =
        typeof atendimento.prioridade_id === "object" &&
          atendimento.prioridade_id !== null
          ? atendimento.prioridade_id?.id
          : atendimento.prioridade_id;

      const encaminhamentoId = (() => {
        if (
          typeof atendimento.encaminhamento_id === "object" &&
          atendimento.encaminhamento_id !== null
        ) {
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
        // Para M2M do Directus, a estrutura é: [{ config_tipos_agressao_id: { id, nome } }]
        if (Array.isArray(atendimento.tipos_violencia_lista)) {
          return atendimento.tipos_violencia_lista
            .map((item: any) => {
              // Estrutura M2M do Directus (junction table)
              if (item?.config_tipos_agressao_id) {
                return typeof item.config_tipos_agressao_id === "object"
                  ? item.config_tipos_agressao_id.id
                  : item.config_tipos_agressao_id;
              }
              // Fallback: item simples
              return typeof item === "object" && item !== null
                ? item.id
                : Number(item);
            })
            .filter(Boolean) as number[];
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
                    const match = tiposViolenciaOptions.find(
                      (opt) => slugify(opt.nome) === slug,
                    );
                    return match?.id;
                  })(),
            )
            .filter(Boolean) as number[];
        }

        if (typeof atendimento.tipos_violencia === "string") {
          return atendimento.tipos_violencia
            .split(",")
            .map((v: string) => v.trim())
            .map((v: string) => {
              const slug = slugify(v);
              const match = tiposViolenciaOptions.find(
                (opt) => slugify(opt.nome) === slug,
              );
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
        data_abertura:
          dataAberturaFormatted || new Date().toISOString().split("T")[0],
        encaminhamento_id: encaminhamentoId || undefined,
        tipos_violencia: tiposViolenciaIds,
        medida_protetiva: atendimento.medida_protetiva || false,
        gestante_puerpera: atendimento.gestante_puerpera || false,
        boletim_ocorrencia: atendimento.boletim_ocorrencia || undefined,
        necessidades_sociais: atendimento.necessidades_sociais || undefined,
        necessidades_juridicas: atendimento.necessidades_juridicas || undefined,
        avaliacao_risco: atendimento.avaliacao_risco || {},
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
      medida_protetiva: false,
      gestante_puerpera: false,
      boletim_ocorrencia: undefined,
      necessidades_sociais: undefined,
      necessidades_juridicas: undefined,
      avaliacao_risco: {},
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-full">
        <DialogHeader>
          <DialogTitle>
            {atendimento ? "Editar Atendimento" : "Novo Atendimento"}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados do atendimento abaixo.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="triagem" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="triagem">Triagem Inicial</TabsTrigger>
                <TabsTrigger value="socioassistencial">
                  Socioassistencial
                </TabsTrigger>
                <TabsTrigger value="juridico">Jurídico</TabsTrigger>
                <TabsTrigger value="risco">Avaliação de Risco</TabsTrigger>
              </TabsList>

              {/* ABA 1: TRIAGEM INICIAL */}
              <TabsContent value="triagem" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="beneficiaria"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Beneficiária *
                          <InfoTooltip text="Selecione a mulher assistida." />
                        </FormLabel>
                        <FormControl>
                          <BeneficiariaComboBox
                            options={beneficiariasOptions}
                            value={field.value}
                            onValueChange={(value) => field.onChange(value)}
                            placeholder="Buscar beneficiária..."
                          />
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
                              value={field.value ? String(field.value) : ""}
                              onValueChange={(val) =>
                                field.onChange(val ? Number(val) : undefined)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                              <SelectContent>
                                {origensOptions.map((opt) => (
                                  <SelectItem key={opt.id} value={String(opt.id)}>
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

                    <FormField
                      control={form.control}
                      name="prioridade_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prioridade</FormLabel>
                          <FormControl>
                            <Select
                              value={field.value ? String(field.value) : ""}
                              onValueChange={(val) =>
                                field.onChange(val ? Number(val) : undefined)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                              <SelectContent>
                                {prioridadesOptions.map((opt) => (
                                  <SelectItem key={opt.id} value={String(opt.id)}>
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
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="data_abertura"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Abertura</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} value={field.value ?? ""} />
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
                              value={field.value || StatusAtendimento.ABERTO}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.values(StatusAtendimento).map((status) => (
                                  <SelectItem key={status} value={status}>
                                    {status}
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

                  <FormField
                    control={form.control}
                    name="encaminhamento_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Encaminhamento</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value ? String(field.value) : ""}
                            onValueChange={(val) =>
                              field.onChange(val ? Number(val) : undefined)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                              {encaminhamentosOptions.map((opt) => (
                                <SelectItem key={opt.id} value={String(opt.id)}>
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
                </div>
              </TabsContent>

              {/* ABA 2: SOCIOASSISTENCIAL */}
              <TabsContent value="socioassistencial" className="space-y-4 pt-4">
                <div className="border rounded-lg p-4 space-y-4">
                  <FormField
                    control={form.control}
                    name="gestante_puerpera"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Gestante ou Puérpera?</FormLabel>
                          <FormDescription>
                            Indique se a assistida está gestante ou em puerpério.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="necessidades_sociais"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Necessidades Sociais</FormLabel>
                        <FormDescription>
                          Descreva necessidades como Cesta Básica, Encaminhamento CRAS, Bolsa Família, etc.
                        </FormDescription>
                        <FormControl>
                          <Textarea
                            placeholder="Descreva as necessidades sociais identificadas..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* ABA 3: JURÍDICO */}
              <TabsContent value="juridico" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="boletim_ocorrencia"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Boletim de Ocorrência</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value || "Não"}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Sim">Sim</SelectItem>
                              <SelectItem value="Não">Não</SelectItem>
                              <SelectItem value="Deseja realizar">
                                Deseja realizar
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="medida_protetiva"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 mt-8 md:mt-0 lg:mt-0">
                        <div className="space-y-0.5">
                          <FormLabel>Possui Medida Protetiva?</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="border rounded-lg p-4 space-y-4">
                  <h3 className="text-sm font-semibold mb-2">Tipos de Violência</h3>
                  <FormField
                    control={form.control}
                    name="tipos_violencia"
                    render={() => (
                      <FormItem>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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
                                          const currentValue = Array.isArray(
                                            field.value,
                                          )
                                            ? field.value
                                            : [];
                                          const newValue = checked
                                            ? [...currentValue, tipo.id]
                                            : currentValue.filter(
                                              (value) => value !== tipo.id,
                                            );
                                          field.onChange(newValue);
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal capitalize cursor-pointer">
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

                <FormField
                  control={form.control}
                  name="necessidades_juridicas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Necessidades Jurídicas</FormLabel>
                      <FormDescription>
                        Descreva necessidades como Divórcio, Guarda, Pensão, etc.
                      </FormDescription>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva as demandas jurídicas..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* ABA 4: AVALIAÇÃO DE RISCO */}
              <TabsContent value="risco" className="space-y-4 pt-4">
                <div className="border rounded-lg p-4 bg-red-50/50">
                  <h3 className="text-md font-semibold text-red-800 mb-4 flex items-center gap-2">
                    Mapeamento de Risco
                  </h3>
                  <div className="space-y-4">
                    {PERGUNTAS_RISCO.map((pergunta) => (
                      <FormField
                        key={pergunta.key}
                        control={form.control}
                        name={`avaliacao_risco.${pergunta.key}`}
                        render={({ field }) => (
                          <FormItem className="grid grid-cols-1 md:grid-cols-[2fr_1fr] items-center gap-4 border-b border-red-100 pb-2 last:border-0">
                            <FormLabel className="text-sm font-medium">
                              {pergunta.label}
                            </FormLabel>
                            <FormControl>
                              <Select
                                value={field.value || "Não se aplica"}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {RISCO_OPTIONS.map((opt) => (
                                    <SelectItem key={opt} value={opt}>
                                      {opt}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

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
                {atendimento ? "Atualizar Atendimento" : "Criar Atendimento"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
