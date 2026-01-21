"use client";

import { useState } from "react";
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

  // --- NORMALIZAÇÃO DOS DADOS ---
  // Converte o formato complexo do Directus para o formato simples do Form
  const defaultValues: Partial<InfratorFormValues> = infrator
    ? {
        ...infrator,
        // Extrai o ID dos objetos Many-to-One
        nivel_id: infrator.nivel_id?.id || infrator.nivel_id,
        status_legal_id: infrator.status_legal_id?.id || infrator.status_legal_id,
        // Extrai o telefone do JSON
        telefone: infrator.contato?.telefone || "",
        // Se for array de números (que é o que o log mostrou), usa direto.
        // Se for array de objetos (caso o Directus mude de ideia), extrai o ID.
        tipos_agressao_ids: Array.isArray(infrator.tipos_agressao_lista)
          ? infrator.tipos_agressao_lista.map((item: any) =>
              typeof item === 'number' ? item : (item.tipo_agressao_id?.id || item.id)
            )
          : [],
      }
    : {
        // Valores padrão para cadastro novo
        nome_completo: "",
        cpf: "",
        data_nascimento: "",
        telefone: "",
        numero_processo: "",
        tipos_agressao_ids: [],
        nivel_id: undefined,
        status_legal_id: undefined,
      };

  const form = useForm<InfratorFormValues>({
    resolver: zodResolver(insertInfratorSchema),
    values: defaultValues as InfratorFormValues, // Use 'values' para reagir a mudanças no 'infrator'
  });

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

              <FormField
                control={form.control}
                name="data_nascimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Nascimento</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                        value={field.value || ''} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="(00) 00000-0000"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="numero_processo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número do Processo</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0000000-00.0000.0.00.0000"
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
                      <select
                        value={field.value?.toString() || ""}
                        onChange={(e) => {
                          field.onChange(Number(e.target.value));
                        }}
                        onBlur={field.onBlur}
                        name={field.name}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Selecione o nível</option>
                        {options.niveis.map((nivel) => (
                          <option key={nivel.id} value={nivel.id.toString()}>
                            {nivel.nome}
                          </option>
                        ))}
                      </select>
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
                      <select
                        value={field.value?.toString() || ""}
                        onChange={(e) => {
                          field.onChange(Number(e.target.value));
                        }}
                        onBlur={field.onBlur}
                        name={field.name}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Selecione o status</option>
                        {options.statusLegal.map((status) => (
                          <option key={status.id} value={status.id.toString()}>
                            {status.nome}
                          </option>
                        ))}
                      </select>
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
