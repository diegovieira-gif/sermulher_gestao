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
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { saveInfrator } from "./actions";
import { insertInfratorSchema, type InsertInfrator } from "./schemas";

interface InfratorFormProps {
  initialData?: Partial<InsertInfrator>;
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
  onSuccess,
  onCancel,
}: InfratorFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InsertInfrator>({
    resolver: zodResolver(insertInfratorSchema) as any,
    defaultValues: {
      id: initialData?.id,
      nome_completo: initialData?.nome_completo || "",
      cpf: initialData?.cpf || "",
      data_nascimento: initialData?.data_nascimento
        ? new Date(initialData.data_nascimento).toISOString().split("T")[0]
        : "",
      telefone: initialData?.telefone || "",
      numero_processo: initialData?.numero_processo || "",
      nivel_id: initialData?.nivel_id || 0,
      status_legal_id: initialData?.status_legal_id || 0,
      tipos_agressao_ids: initialData?.tipos_agressao_ids || [],
    },
  });

  const onSubmit = async (data: InsertInfrator) => {
    setIsSubmitting(true);
    try {
      const result = await saveInfrator(data);
      if (result.success) {
        toast.success("Infrator salvo com sucesso!");
        if (onSuccess) onSuccess();
      } else {
        toast.error(result.error || "Erro ao salvar");
      }
    } catch (error) {
      toast.error("Erro inesperado");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="nome_completo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <Input placeholder="Nome do assistido" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="cpf"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CPF</FormLabel>
                <FormControl>
                  <Input placeholder="000.000.000-00" {...field} />
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
                <FormLabel>Data Nascimento</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    value={field.value?.toString() || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    value={field.value?.toString() || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="numero_processo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nº Processo</FormLabel>
                <FormControl>
                  <Input
                    placeholder="TJ-..."
                    {...field}
                    value={field.value?.toString() || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nivel_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nível de Risco</FormLabel>
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
                <FormLabel>Status Legal</FormLabel>
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
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData?.id ? "Atualizar" : "Cadastrar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
