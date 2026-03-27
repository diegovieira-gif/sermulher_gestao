"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cursoSchema, CursoFormValues } from "../schemas";
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
import { createCurso, updateCurso } from "../actions";
import { Loader2 } from "lucide-react";

interface Categoria {
  id: string;
  nome: string;
}

interface CursoFormProps {
  initialData?:
    | (CursoFormValues & { id?: string; categoria?: any })
    | undefined;
  categorias: Categoria[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CursoForm({
  initialData,
  categorias,
  onSuccess,
  onCancel,
}: CursoFormProps) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!initialData?.id;

  type CursoFormInput = z.input<typeof cursoSchema>;

  const initialCategoria =
    typeof initialData?.categoria === "object"
      ? initialData?.categoria?.id || ""
      : initialData?.categoria || "";

  const form = useForm<CursoFormInput, any, CursoFormValues>({
    resolver: zodResolver(cursoSchema),
    defaultValues: {
      status: initialData?.status || "draft",
      titulo: initialData?.titulo || "",
      descricao: initialData?.descricao || "",
      categoria: initialCategoria,
      imagem_capa: initialData?.imagem_capa || "",
      carga_horaria: initialData?.carga_horaria ?? 0,
      instrutor: initialData?.instrutor || "",
      user_created: initialData?.user_created || "",
      date_created: initialData?.date_created || "",
    },
  });

  const onSubmit = (values: CursoFormValues) => {
    startTransition(async () => {
      try {
        const result =
          isEditing && initialData?.id
            ? await updateCurso(initialData.id, values)
            : await createCurso(values);

        if (result.success) {
          toast.success(
            isEditing
              ? "Curso atualizado com sucesso!"
              : "Curso criado com sucesso!",
          );
          if (onSuccess) onSuccess();
        } else {
          toast.error(`Erro: ${result.error}`);
        }
      } catch (error) {
        toast.error("Erro inesperado ao salvar o curso.");
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
                  <Input
                    placeholder="Ex: Curso de empreendedorismo"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="instrutor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instrutor</FormLabel>
                <FormControl>
                  <Input placeholder="Nome do instrutor" {...field} />
                </FormControl>
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
                  placeholder="Descreva o curso"
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="categoria"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categorias.map((categoria) => (
                      <SelectItem key={categoria.id} value={categoria.id}>
                        {categoria.nome}
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
            name="carga_horaria"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Carga Horária</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Ex: 40"
                    value={field.value != null ? String(field.value) : ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
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
