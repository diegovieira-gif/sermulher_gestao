"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sonhoSchema, SonhoFormValues } from "../schemas";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createSonho, updateSonho } from "../actions";
import { Loader2 } from "lucide-react";

interface SonhoFormProps {
  initialData?: SonhoFormValues & { id?: number };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SonhoForm({
  initialData,
  onSuccess,
  onCancel,
}: SonhoFormProps) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!initialData?.id;

  const form = useForm<SonhoFormValues>({
    resolver: zodResolver(sonhoSchema),
    defaultValues: {
      nome: initialData?.nome || "",
      telefone: initialData?.telefone || "",
      cpf: initialData?.cpf || "",
      audio: initialData?.audio || "",
    },
  });

  const onSubmit = (values: SonhoFormValues) => {
    startTransition(async () => {
      try {
        const result =
          isEditing && initialData?.id
            ? await updateSonho(String(initialData.id), values)
            : await createSonho(values);

        if (result.success) {
          toast.success(
            isEditing
              ? "Sonho atualizado com sucesso!"
              : "Sonho criado com sucesso!",
          );
          if (onSuccess) onSuccess();
        } else {
          toast.error(`Erro: ${result.error}`);
        }
      } catch (error) {
        toast.error("Erro inesperado ao salvar o sonho.");
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Nome da pessoa" {...field} />
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
                <Input placeholder="(XX) 9XXXX-XXXX" {...field} />
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
              <FormLabel>CPF</FormLabel>
              <FormControl>
                <Input placeholder="XXX.XXX.XXX-XX" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="audio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Áudio (UUID)</FormLabel>
              <FormControl>
                <Input
                  placeholder="ID do arquivo de áudio no Directus"
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
            onClick={onCancel}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Atualizar" : "Criar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
