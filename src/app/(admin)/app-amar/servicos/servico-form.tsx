"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { servicoSchema, ServicoFormValues } from "../schemas";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createServico, updateServico } from "../actions";
import { Loader2 } from "lucide-react";

interface Categoria {
  id: string;
  nome: string;
}

interface ServicoFormProps {
  initialData?: ServicoFormValues & { id?: string; categoria_id?: any };
  categorias: Categoria[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ServicoForm({
  initialData,
  categorias,
  onSuccess,
  onCancel,
}: ServicoFormProps) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!initialData?.id;

  const form = useForm<ServicoFormValues>({
    resolver: zodResolver(servicoSchema),
    defaultValues: {
      titulo: initialData?.titulo || "",
      slug: initialData?.slug || "",
      descricao_curta: initialData?.descricao_curta || "",
      documentos_necessarios: initialData?.documentos_necessarios || "",
      endereco_mapa: initialData?.endereco_mapa || "",
      horario_atendimento: initialData?.horario_atendimento || "",
      link_externo_acao: initialData?.link_externo_acao || "",
      sobre: initialData?.sobre || "",
      categoria_id:
        typeof initialData?.categoria_id === "object"
          ? initialData?.categoria_id?.id
          : initialData?.categoria_id || "",
      status: initialData?.status || "published",
    },
  });

  const tituloValue = form.watch("titulo");

  useEffect(() => {
    if (!isEditing && tituloValue) {
      if (!form.formState.dirtyFields.slug) {
        const generatedSlug = tituloValue
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9\s-]/g, "")
          .trim()
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-");

        form.setValue("slug", generatedSlug, { shouldValidate: true });
      }
    }
  }, [tituloValue, isEditing, form]);

  const onSubmit = (values: ServicoFormValues) => {
    startTransition(async () => {
      try {
        let result;
        if (isEditing && initialData.id) {
          result = await updateServico(initialData.id, values);
        } else {
          result = await createServico(values);
        }

        if (result.success) {
          toast.success(
            isEditing
              ? "Serviço atualizado com sucesso!"
              : "Serviço criado com sucesso!",
          );
          if (onSuccess) onSuccess();
        } else {
          toast.error(`Erro: ${result.error}`);
        }
      } catch (error) {
        toast.error("Erro inesperado ao salvar o serviço.");
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
                <FormLabel>Título do Serviço</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Atendimento Psicológico" {...field} />
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
                  <Input placeholder="ex: atendimento-psicologico" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="categoria_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria Relacionada</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categorias.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.nome}
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
          name="descricao_curta"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição Curta</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Resumo do serviço (máximo 255 caracteres)"
                  className="resize-none"
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
          name="documentos_necessarios"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Documentos Necessários</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={`Ex:\n- RG e CPF\n- Comprovante de Residência`}
                  className="min-h-[120px]"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground mt-1">
                Você pode usar formatação Markdown (*itálico*, **negrito**,
                listas com -).
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="endereco_mapa"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Link do Mapa / Endereço</FormLabel>
                <FormControl>
                  <Input
                    placeholder="URL externa"
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
            name="horario_atendimento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Horário de Atendimento</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: Seg a Sex, 08h às 17h"
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
            name="link_externo_acao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Link de Ação Externo</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: URL de agendamento"
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
          name="sobre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sobre</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Informações adicionais sobre o serviço"
                  className="min-h-[100px]"
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
