"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { projetoSchema, ProjetoFormValues } from "../schemas";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createProjeto, updateProjeto } from "../actions";
import { Loader2 } from "lucide-react";

interface ProjetoFormProps {
  initialData?: ProjetoFormValues & { id?: string };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProjetoForm({
  initialData,
  onSuccess,
  onCancel,
}: ProjetoFormProps) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!initialData?.id;

  const form = useForm<ProjetoFormValues>({
    resolver: zodResolver(projetoSchema),
    defaultValues: {
      status: initialData?.status || "draft",
      titulo: initialData?.titulo || "",
      descricao: initialData?.descricao || "",
      conteudo: initialData?.conteudo || "",
      imagem_capa: initialData?.imagem_capa || "",
      user_created: initialData?.user_created || "",
      date_created: initialData?.date_created || "",
    },
  });

  const onSubmit = (values: ProjetoFormValues) => {
    startTransition(async () => {
      try {
        const result =
          isEditing && initialData?.id
            ? await updateProjeto(initialData.id, values)
            : await createProjeto(values);

        if (result.success) {
          toast.success(
            isEditing
              ? "Projeto atualizado com sucesso!"
              : "Projeto criado com sucesso!",
          );
          if (onSuccess) onSuccess();
        } else {
          toast.error(`Erro: ${result.error}`);
        }
      } catch (error) {
        toast.error("Erro inesperado ao salvar o projeto.");
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="titulo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Projeto Acolher" {...field} />
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
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="published">Publicado</SelectItem>
                    <SelectItem value="draft">Rascunho</SelectItem>
                  </SelectContent>
                </Select>
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
                  placeholder="Resumo do projeto"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="conteudo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Conteúdo</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Conteúdo completo do projeto"
                  className="min-h-[160px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imagem_capa"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Imagem de Capa (UUID)</FormLabel>
              <FormControl>
                <Input placeholder="UUID da imagem no Directus" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="user_created"
            render={({ field }) => (
              <FormItem>
                <FormLabel>User Created</FormLabel>
                <FormControl>
                  <Input placeholder="UUID do usuário criador" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date_created"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date Created</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isPending}
            >
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Atualizar" : "Salvar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
