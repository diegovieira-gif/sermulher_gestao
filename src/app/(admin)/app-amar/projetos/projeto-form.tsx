"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { projetoSchema, ProjetoFormInput, ProjetoFormValues } from "../schemas";
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
  initialData?: ProjetoFormValues & { id?: number };
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

  // Input = valores do formulário (antes da coerção do zod); Output = valores validados
  const form = useForm<ProjetoFormInput, unknown, ProjetoFormValues>({
    resolver: zodResolver(projetoSchema),
    defaultValues: {
      status: initialData?.status || "draft",
      ordem: initialData?.ordem ?? undefined,
      titulo: initialData?.titulo || "",
      descricao: initialData?.descricao || "",
      imagem_capa: initialData?.imagem_capa || "",
      link_destino: initialData?.link_destino || "",
      tipo_link: initialData?.tipo_link || "",
      link_imagem: initialData?.link_imagem || "",
    },
  });

  const onSubmit = (values: ProjetoFormValues) => {
    startTransition(async () => {
      try {
        const result =
          isEditing && initialData?.id
            ? await updateProjeto(String(initialData.id), values)
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="titulo"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
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
            name="ordem"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ordem</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Ex: 1"
                    value={field.value != null ? String(field.value) : ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                      )
                    }
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  value={field.value || ""}
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
                <Input
                  placeholder="UUID da imagem no Directus"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="link_destino"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Link de Destino</FormLabel>
                <FormControl>
                  <Input
                    placeholder="URL de destino"
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
            name="tipo_link"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Link</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: externo, interno"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="link_imagem"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link da Imagem</FormLabel>
              <FormControl>
                <Input
                  placeholder="URL da imagem"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
