"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  insertSalaSchema,
  type Sala,
  type SalaFormValues,
  StatusSala,
} from "./schemas";
import { saveSala } from "./actions";
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Calendar, MapPin, Users } from "lucide-react";

interface LocalOption {
  id: number;
  nome: string;
}

interface ResponsavelOption {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

interface SalaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sala?: Sala | null;
  locais: LocalOption[];
  responsaveis: ResponsavelOption[];
}

export function SalaForm({
  open,
  onOpenChange,
  sala,
  locais,
  responsaveis,
}: SalaFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SalaFormValues>({
    resolver: zodResolver(insertSalaSchema),
    defaultValues: {
      nome_ciclo: "",
      data_inicio: "",
      data_termino: "",
      status: StatusSala.PLANEJADA,
      local_id: undefined,
      responsavel_tecnico: "",
    },
  });

  // Atualiza o formulário quando a sala muda
  useEffect(() => {
    if (sala) {
      // Trata local_id: se vier como objeto do Directus, extrai o ID
      const localId = sala?.local_id?.id || undefined;

      // Trata responsável: se vier como objeto do Directus, extrai o ID (UUID)
      const responsavelId =
        typeof sala.responsavel_tecnico === "object" &&
        sala.responsavel_tecnico !== null
          ? sala.responsavel_tecnico.id
          : sala.responsavel_tecnico;

      form.reset({
        id: sala.id,
        nome_ciclo: sala.nome_ciclo,
        data_inicio: sala.data_inicio,
        data_termino: sala.data_termino,
        status: sala.status,
        local_id: localId,
        responsavel_tecnico: responsavelId || "",
      });
    } else {
      form.reset({
        nome_ciclo: "",
        data_inicio: "",
        data_termino: "",
        status: StatusSala.PLANEJADA,
        local_id: undefined,
        responsavel_tecnico: "",
      });
    }
  }, [sala, form]);

  const onSubmit = async (data: SalaFormValues) => {
    setIsSubmitting(true);

    try {
      const result = await saveSala(data);

      if (result.success) {
        toast.success(result.message);
        onOpenChange(false);
        form.reset();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Erro ao salvar ciclo");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para formatar nome do responsável
  const formatNomeResponsavel = (responsavel: ResponsavelOption): string => {
    const firstName = responsavel.first_name || "";
    const lastName = responsavel.last_name || "";
    return `${firstName} ${lastName}`.trim() || "Sem nome";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {sala ? "Editar Ciclo" : "Novo Ciclo"}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados do ciclo abaixo. Campos marcados com * são
            obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Nome do Ciclo */}
            <FormField
              control={form.control}
              name="nome_ciclo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Nome do Ciclo <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Ciclo 2024 - Janeiro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Datas */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_inicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Data de Início <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data_termino"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Data de Término{" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Local e Responsável */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="local_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Local <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Select
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        value={field.value?.toString() || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value ? Number(value) : undefined);
                        }}
                      >
                        <option value="">Selecione um local</option>
                        {locais.map((local) => (
                          <option key={local.id} value={local.id.toString()}>
                            {local.nome}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="responsavel_tecnico"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Responsável Técnico{" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Select
                        value={field.value || ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                      >
                        <option value="">Selecione um responsável</option>
                        {responsaveis.map((responsavel) => (
                          <option key={responsavel.id} value={responsavel.id}>
                            {formatNomeResponsavel(responsavel)}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Status <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                    >
                      <option value={StatusSala.PLANEJADA}>
                        {StatusSala.PLANEJADA}
                      </option>
                      <option value={StatusSala.EM_ANDAMENTO}>
                        {StatusSala.EM_ANDAMENTO}
                      </option>
                      <option value={StatusSala.FINALIZADA}>
                        {StatusSala.FINALIZADA}
                      </option>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Botões */}
            <div className="flex justify-end gap-4">
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
                {sala ? "Atualizar" : "Cadastrar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
