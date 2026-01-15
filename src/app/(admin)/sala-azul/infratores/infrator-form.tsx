"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  insertInfratorSchema,
  type Infrator,
  type InfratorFormValues,
} from "./schemas";
import type {
  NivelOption,
  StatusLegalOption,
  TipoAgressaoOption,
} from "./actions";
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
  infrator?: any | null;
  options: {
    niveis: NivelOption[];
    statusLegal: StatusLegalOption[];
    tiposAgressao: TipoAgressaoOption[];
  };
}

export function InfratorForm({
  open,
  onOpenChange,
  infrator,
  options,
}: InfratorFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InfratorFormValues>({
    resolver: zodResolver(insertInfratorSchema),
    defaultValues: {
      nome_completo: "",
      cpf: "",
      nivel_id: options.niveis[0]?.id || 0,
      status_legal_id: options.statusLegal[0]?.id || 0,
      tipos_agressao_ids: [],
    },
  });

  // Atualiza o formulário quando o infrator muda
  useEffect(() => {
    if (infrator) {
      // Normaliza tipos de agressão: converte array de objetos para array de IDs
      const tiposAgressaoIds: number[] = [];
      if (infrator.tipos_agressao_lista && Array.isArray(infrator.tipos_agressao_lista)) {
        infrator.tipos_agressao_lista.forEach((item: any) => {
          if (item?.config_tipos_agressao_id?.id) {
            tiposAgressaoIds.push(item.config_tipos_agressao_id.id);
          } else if (item?.config_tipos_agressao_id && typeof item.config_tipos_agressao_id === 'number') {
            tiposAgressaoIds.push(item.config_tipos_agressao_id);
          }
        });
      }

      form.reset({
        id: infrator.id,
        nome_completo: infrator.nome_completo || "",
        cpf: infrator.cpf || "",
        nivel_id: infrator.nivel_id?.id || infrator.nivel_id || options.niveis[0]?.id || 0,
        status_legal_id: infrator.status_legal_id?.id || infrator.status_legal_id || options.statusLegal[0]?.id || 0,
        tipos_agressao_ids: tiposAgressaoIds,
      });
    } else {
      form.reset({
        nome_completo: "",
        cpf: "",
        nivel_id: options.niveis[0]?.id || 0,
        status_legal_id: options.statusLegal[0]?.id || 0,
        tipos_agressao_ids: [],
      });
    }
  }, [infrator, form, options]);

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
                name="nivel_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Nível de Periculosidade{" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Select
                        value={field.value?.toString() || ""}
                        onChange={(e) => {
                          field.onChange(Number(e.target.value));
                        }}
                        onBlur={field.onBlur}
                        name={field.name}
                      >
                        <option value="">Selecione o nível</option>
                        {options.niveis.map((nivel) => (
                          <option key={nivel.id} value={nivel.id.toString()}>
                            {nivel.nome}
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
                name="tipos_agressao_ids"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Tipos de Agressão{" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="space-y-2 border rounded-md p-4">
                        {options.tiposAgressao.map((tipo) => (
                          <label
                            key={tipo.id}
                            className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-2 rounded-md"
                          >
                            <input
                              type="checkbox"
                              checked={field.value?.includes(tipo.id) || false}
                              onChange={(e) => {
                                const currentValue = field.value || [];
                                if (e.target.checked) {
                                  field.onChange([...currentValue, tipo.id]);
                                } else {
                                  field.onChange(
                                    currentValue.filter((v) => v !== tipo.id)
                                  );
                                }
                              }}
                              className="h-4 w-4 rounded border-gray-300"
                            />
                            <span className="text-sm">{tipo.nome}</span>
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
                name="status_legal_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Status Legal <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Select
                        value={field.value?.toString() || ""}
                        onChange={(e) => {
                          field.onChange(Number(e.target.value));
                        }}
                        onBlur={field.onBlur}
                        name={field.name}
                      >
                        <option value="">Selecione o status</option>
                        {options.statusLegal.map((status) => (
                          <option key={status.id} value={status.id.toString()}>
                            {status.nome}
                          </option>
                        ))}
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
