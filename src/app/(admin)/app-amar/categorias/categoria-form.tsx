"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { categoriaSchema, CategoriaFormInput, CategoriaFormValues } from "../schemas";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { createCategoria, updateCategoria } from "../actions";
import { Loader2 } from "lucide-react";

interface CategoriaFormProps {
  initialData?: CategoriaFormValues & { id?: string };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CategoriaForm({ initialData, onSuccess, onCancel }: CategoriaFormProps) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!initialData?.id;

  // Input = valores do formulário (antes da coerção do zod); Output = valores validados
  const form = useForm<CategoriaFormInput, unknown, CategoriaFormValues>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: {
      nome: initialData?.nome || "",
      slug: initialData?.slug || "",
      icone: initialData?.icone || "",
      cor_hex: initialData?.cor_hex || "",
      ordem: initialData?.ordem || 0,
      status: initialData?.status || "published",
    },
  });

  const nomeValue = form.watch("nome");

  // Gera o slug automaticamente com base no nome
  useEffect(() => {
    if (!isEditing && nomeValue) {
      if (!form.formState.dirtyFields.slug) {
        const generatedSlug = nomeValue
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "") // Remove os acentos
          .replace(/[^a-z0-9\s-]/g, "") // Remove caracteres inválidos
          .trim()
          .replace(/\s+/g, "-") // Substitui os espaços por hifens
          .replace(/-+/g, "-"); // Remove múltiplos hifens seguidos
        
        form.setValue("slug", generatedSlug, { shouldValidate: true });
      }
    }
  }, [nomeValue, isEditing, form]);

  const onSubmit = (values: CategoriaFormValues) => {
    startTransition(async () => {
      try {
        let result;
        if (isEditing && initialData.id) {
          result = await updateCategoria(initialData.id, values);
        } else {
          result = await createCategoria(values);
        }

        if (result.success) {
          toast.success(isEditing ? "Categoria atualizada com sucesso!" : "Categoria criada com sucesso!");
          if (onSuccess) onSuccess();
        } else {
          toast.error(`Erro: ${result.error}`);
        }
      } catch (error) {
        toast.error("Erro inesperado ao salvar a categoria.");
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Categoria</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Educação" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input placeholder="ex: educacao" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="icone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ícone (Nome do Lucide React)</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Book" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cor_hex"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cor (Hex)</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input type="color" className="w-12 h-10 p-1" {...field} value={field.value || "#000000"} />
                  </FormControl>
                  <Input placeholder="#FFFFFF" {...field} className="flex-1" value={field.value || ""} />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="ordem"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ordem de Exibição</FormLabel>
                <FormControl>
                  <Input type="number" {...field} value={field.value || ""} />
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
        </div>

        <div className="flex justify-end gap-2 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Atualizar" : "Cadastrar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
