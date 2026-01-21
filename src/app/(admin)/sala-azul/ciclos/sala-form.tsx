"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  insertSalaSchema,
  type SalaFormValues, // Tipo do Formulário (Front)
  StatusSala,
} from "./schemas";
import { SalaAzulDB } from "@/types/database"; // Tipo do Banco (Back) - IMPORTADO DO CATÁLOGO
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
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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
  // AQUI ESTAVA O ERRO: O componente recebe o tipo do BANCO, não do Schema
  sala?: SalaAzulDB | null; 
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
      nome: "",
      data_inicio: "",
      data_fim: "",
      status: StatusSala.PLANEJADA,
      local_id: 0,
      facilitador: "",
    },
  });

  // MAPEAMENTO INTELIGENTE: Banco (snake_case) -> Formulário (camelCase/simples)
  useEffect(() => {
    if (sala) {
      form.reset({
        id: sala.id,
        nome: sala.nome_ciclo, // Agora o TS sabe que 'nome_ciclo' existe em SalaAzulDB
        data_inicio: sala.data_inicio,
        data_fim: sala.data_termino, // Agora o TS sabe que 'data_termino' existe
        status: sala.status as StatusSala || StatusSala.PLANEJADA,
        
        // Lógica segura para extrair IDs de relacionamentos que podem vir como Objetos ou IDs
        local_id: typeof sala.local_id === 'object' && sala.local_id !== null 
          ? sala.local_id.id 
          : (sala.local_id as number) || 0,
          
        facilitador: typeof sala.responsavel_tecnico === 'object' && sala.responsavel_tecnico !== null
          ? sala.responsavel_tecnico.id
          : (sala.responsavel_tecnico as string) || "",
      });
    } else {
      form.reset({
        nome: "",
        data_inicio: "",
        data_fim: "",
        status: StatusSala.PLANEJADA,
        local_id: 0,
        facilitador: "",
      });
    }
  }, [sala, form]);

  async function onSubmit(data: SalaFormValues) {
    setIsSubmitting(true);
    try {
      const result = await saveSala(data);
      if (result.success) {
        toast.success(result.message);
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Erro inesperado ao salvar.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{sala ? "Editar Ciclo" : "Novo Ciclo"}</DialogTitle>
          <DialogDescription>
            Preencha os dados do ciclo da Sala Azul.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Ciclo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Ciclo 2024.1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_inicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Início</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data_fim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Término</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="local_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Local</FormLabel>
                    <div className="relative">
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={field.value}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                        >
                            <option value={0}>Selecione um local</option>
                            {locais.map((local) => (
                            <option key={local.id} value={local.id}>
                                {local.nome}
                            </option>
                            ))}
                        </select>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="facilitador"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facilitador (Técnico)</FormLabel>
                    <div className="relative">
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={field.value}
                            onChange={field.onChange}
                        >
                            <option value="">Selecione um técnico</option>
                            {responsaveis.map((resp) => (
                            <option key={resp.id} value={resp.id}>
                                {resp.first_name} {resp.last_name}
                            </option>
                            ))}
                        </select>
                    </div>
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
                  <div className="relative">
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={field.value}
                        onChange={field.onChange}
                    >
                      <option value={StatusSala.PLANEJADA}>Planejada</option>
                      <option value={StatusSala.EM_ANDAMENTO}>Em Andamento</option>
                      <option value={StatusSala.FINALIZADA}>Finalizada</option>
                    </select>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4 pt-4">
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
