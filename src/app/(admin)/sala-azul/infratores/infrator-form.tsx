"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  insertInfratorSchema,
  type Infrator,
  type InfratorFormValues,
  NivelPericulosidade,
  StatusLegal,
  TIPOS_AGRESSAO,
} from "./schemas";
import { saveInfrator } from "./actions";
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
import { Loader2, AlertTriangle, ShieldAlert } from "lucide-react";

interface InfratorFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  infrator?: Infrator | null;
}

export function InfratorForm({
  open,
  onOpenChange,
  infrator,
}: InfratorFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InfratorFormValues>({
    resolver: zodResolver(insertInfratorSchema),
    defaultValues: {
      nome_completo: "",
      cpf: "",
      nivel_periculosidade: NivelPericulosidade.BAIXO,
      tipo_agressao: [],
      status_legal: StatusLegal.EM_CUMPRIMENTO,
    },
  });

  // Atualiza o formulário quando o infrator muda
  useEffect(() => {
    if (infrator) {
      // Se tipo_agressao vier como string CSV do Directus, converte para array
      const tipoAgressaoArray =
        typeof infrator.tipo_agressao === "string"
          ? infrator.tipo_agressao.split(",").map((t) => t.trim())
          : Array.isArray(infrator.tipo_agressao)
          ? infrator.tipo_agressao
          : [];

      form.reset({
        id: infrator.id,
        nome_completo: infrator.nome_completo,
        cpf: infrator.cpf,
        nivel_periculosidade: infrator.nivel_periculosidade,
        tipo_agressao: tipoAgressaoArray,
        status_legal: infrator.status_legal,
      });
    } else {
      form.reset({
        nome_completo: "",
        cpf: "",
        nivel_periculosidade: NivelPericulosidade.BAIXO,
        tipo_agressao: [],
        status_legal: StatusLegal.EM_CUMPRIMENTO,
      });
    }
  }, [infrator, form]);

  const onSubmit = async (data: InfratorFormValues) => {
    setIsSubmitting(true);

    try {
      const result = await saveInfrator(data);

      if (result.success) {
        toast.success(result.message);
        onOpenChange(false);
        form.reset();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Erro ao salvar infrator");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {infrator ? (
              <>
                <ShieldAlert className="h-5 w-5 text-destructive" />
                Editar Infrator
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Novo Infrator
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados do infrator abaixo. Campos marcados com * são
            obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Dados Pessoais */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Dados Pessoais</h3>

              <FormField
                control={form.control}
                name="nome_completo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Nome Completo <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="João Silva" {...field} />
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
                    <FormLabel>
                      CPF <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="12345678901"
                        maxLength={11}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Informações de Risco */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Informações de Risco</h3>

              <FormField
                control={form.control}
                name="nivel_periculosidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Nível de Periculosidade{" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                      >
                        <option value={NivelPericulosidade.BAIXO}>
                          {NivelPericulosidade.BAIXO}
                        </option>
                        <option value={NivelPericulosidade.MEDIO}>
                          {NivelPericulosidade.MEDIO}
                        </option>
                        <option value={NivelPericulosidade.ALTO}>
                          {NivelPericulosidade.ALTO}
                        </option>
                        <option value={NivelPericulosidade.CRITICO}>
                          {NivelPericulosidade.CRITICO}
                        </option>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipo_agressao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Tipos de Agressão{" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="space-y-2 border rounded-md p-4">
                        {TIPOS_AGRESSAO.map((tipo) => (
                          <label
                            key={tipo}
                            className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-2 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={field.value?.includes(tipo) || false}
                              onChange={(e) => {
                                const currentValue = field.value || [];
                                if (e.target.checked) {
                                  field.onChange([...currentValue, tipo]);
                                } else {
                                  field.onChange(
                                    currentValue.filter((v) => v !== tipo)
                                  );
                                }
                              }}
                              className="h-4 w-4 rounded border-gray-300"
                            />
                            <span className="text-sm">{tipo}</span>
                          </label>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Status Legal */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Status Legal</h3>

              <FormField
                control={form.control}
                name="status_legal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Status Legal <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                      >
                        <option value={StatusLegal.EM_CUMPRIMENTO}>
                          {StatusLegal.EM_CUMPRIMENTO}
                        </option>
                        <option value={StatusLegal.CONCLUIDO}>
                          {StatusLegal.CONCLUIDO}
                        </option>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                {infrator ? "Atualizar" : "Cadastrar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
