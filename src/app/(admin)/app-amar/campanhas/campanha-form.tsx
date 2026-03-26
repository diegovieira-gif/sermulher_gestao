"use client";

import { useState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { campanhaSchema, CampanhaFormValues } from "../schemas";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { createCampanha, updateCampanha } from "../actions";
import { Loader2 } from "lucide-react";

interface CampanhaFormProps {
  initialData?: CampanhaFormValues & { id?: string };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CampanhaForm({ initialData, onSuccess, onCancel }: CampanhaFormProps) {
  const [isPending, startTransition] = useTransition();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const isEditing = !!initialData?.id;

  const form = useForm<CampanhaFormValues>({
    resolver: zodResolver(campanhaSchema),
    defaultValues: {
      titulo: initialData?.titulo || "",
      url_instagram: initialData?.url_instagram || "",
      status: initialData?.status || "published",
    },
  });

  const watchUrl = form.watch("url_instagram");

  useEffect(() => {
    if (watchUrl && watchUrl.includes("instagram.com")) {
      try {
        const urlObj = new URL(watchUrl);
        urlObj.search = ""; // Limpa parâmetros extras (ex: ?igsh=...)
        let base = urlObj.toString();
        if (base.endsWith("/")) {
          base = base.slice(0, -1);
        }
        setPreviewUrl(`${base}/embed/`);
      } catch (e) {
        setPreviewUrl(null);
      }
    } else {
      setPreviewUrl(null);
    }
  }, [watchUrl]);

  const onSubmit = (values: CampanhaFormValues) => {
    startTransition(async () => {
      try {
        let result;
        if (isEditing && initialData.id) {
          result = await updateCampanha(initialData.id, values);
        } else {
          result = await createCampanha(values);
        }

        if (result.success) {
          toast.success(isEditing ? "Campanha atualizada com sucesso!" : "Campanha criada com sucesso!");
          if (onSuccess) onSuccess();
        } else {
          toast.error(`Erro: ${result.error}`);
        }
      } catch (error) {
        toast.error("Erro inesperado ao salvar a campanha.");
      }
    });
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="flex-1">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título da Campanha</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Agosto Lilás" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="url_instagram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link da Postagem no Instagram</FormLabel>
                  <FormControl>
                    <Input placeholder="https://www.instagram.com/p/..." {...field} />
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

            <div className="flex justify-end gap-2 pt-4">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
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
      </div>

      {previewUrl && (
        <div className="w-full md:w-[320px] bg-slate-50 border rounded-lg p-4 flex flex-col items-center justify-center">
          <p className="text-sm font-medium text-slate-500 mb-2">Pré-visualização</p>
          {/* @ts-expect-error: React requires lowercase for this attribute but TS types still expect camelCase */}
          <iframe
            src={previewUrl}
            className="w-[300px] h-[400px] border-none overflow-hidden rounded-md"
            scrolling="no"
            allowtransparency="true"
            allow="encrypted-media"
          ></iframe>
        </div>
      )}
    </div>
  );
}
