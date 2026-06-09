"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
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
import { Checkbox } from "@/components/ui/checkbox"; // Import do Checkbox
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { saveInfrator } from "./actions";
import { insertInfratorSchema, type InsertInfrator } from "./schemas";

interface InfratorFormProps {
  initialData?: any; // Alterado para any para facilitar a leitura do backend
  niveis: any[];
  statusLegais: any[];
  tiposAgressao?: any[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function InfratorForm({
  initialData,
  niveis,
  statusLegais,
  tiposAgressao = [],
  onSuccess,
  onCancel,
}: InfratorFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper para extrair IDs dos tipos de agressão na edição
  const getInitialTiposIds = () => {
    if (!initialData?.tipos_agressao_lista) return [];
    // O Directus pode retornar array de IDs ou array de objetos, tratamos ambos
    if (Array.isArray(initialData.tipos_agressao_lista)) {
      return initialData.tipos_agressao_lista
        .map((item: any) =>
          typeof item === "number"
            ? item
            : item.tipo_agressao_id?.id || item.tipo_agressao_id || item,
        )
        .filter(Boolean);
    }
    return [];
  };

  const form = useForm<InsertInfrator>({
    resolver: zodResolver(insertInfratorSchema),
    defaultValues: {
      id: initialData?.id,
      nome_completo: initialData?.nome_completo || "",
      cpf: initialData?.cpf || "",
      data_nascimento: initialData?.data_nascimento || "",
      telefone: initialData?.contato?.telefone || "",
      numero_processo: initialData?.numero_processo || "",
      nivel_id: initialData?.nivel_id?.id || initialData?.nivel_id,
      status_legal_id:
        initialData?.status_legal_id?.id || initialData?.status_legal_id,
      tipos_agressao_ids: getInitialTiposIds(), // Carrega os checkboxes marcados
    },
  });

  async function onSubmit(data: InsertInfrator) {
    setIsSubmitting(true);
    try {
      const result = await saveInfrator(data);
      if (result.success) {
        toast.success(result.message);
        if (onSuccess) onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Erro inesperado ao salvar.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Dados Pessoais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nome_completo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Completo *</FormLabel>
                <FormControl>
                  <Input placeholder="Nome do infrator" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cpf"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CPF *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Apenas números"
                    maxLength={11}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="data_nascimento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Nascimento</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="telefone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input
                    placeholder="(79) 99999-9999"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Dados do Processo / Situação */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="numero_processo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nº Processo</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Opcional"
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
            name="nivel_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nível de Risco *</FormLabel>
                <Select
                  onValueChange={(val) => field.onChange(Number(val))}
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {niveis.map((nivel) => (
                      <SelectItem key={nivel.id} value={nivel.id.toString()}>
                        {nivel.nome}
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
            name="status_legal_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status Legal *</FormLabel>
                <Select
                  onValueChange={(val) => field.onChange(Number(val))}
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {statusLegais.map((status) => (
                      <SelectItem key={status.id} value={status.id.toString()}>
                        {status.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Checkboxes de Tipos de Agressão */}
        <div className="border rounded-md p-4 bg-gray-50/50">
          <div className="mb-4">
            <p className="text-base font-semibold">
              Tipos de Agressão Identificados *
            </p>
            <p className="text-sm text-muted-foreground">
              Selecione pelo menos uma opção.
            </p>
          </div>

          <FormField
            control={form.control}
            name="tipos_agressao_ids"
            render={() => (
              <FormItem>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {tiposAgressao.map((item) => (
                    <FormField
                      key={item.id}
                      control={form.control}
                      name="tipos_agressao_ids"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={item.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(item.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([
                                        ...(field.value || []),
                                        item.id,
                                      ])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== item.id,
                                        ),
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer text-sm">
                              {item.nome}
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

        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData?.id ? "Atualizar" : "Cadastrar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
