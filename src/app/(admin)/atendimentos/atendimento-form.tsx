"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  OrigemAtendimento,
  PrioridadeAtendimento,
  upsertAtendimentoSchema,
  type UpsertAtendimentoInput,
} from "./schemas";
import { saveAtendimento } from "./actions";
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
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type BeneficiariaOption = { id: number; nome_completo: string };

interface AtendimentoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: BeneficiariaOption[];
  atendimento?: any | null;
}

export function AtendimentoForm({
  open,
  onOpenChange,
  options,
  atendimento,
}: AtendimentoFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UpsertAtendimentoInput>({
    resolver: zodResolver(upsertAtendimentoSchema),
    defaultValues: {
      id: undefined,
      beneficiaria: "",
      origem: OrigemAtendimento.RECEPCAO,
      prioridade: PrioridadeAtendimento.NORMAL,
      observacao_inicial: "",
    },
  });

  useEffect(() => {
    if (atendimento) {
      form.reset({
        id: atendimento.id,
        beneficiaria: atendimento?.beneficiaria?.id ?? atendimento?.beneficiaria ?? "",
        origem: atendimento.origem ?? OrigemAtendimento.RECEPCAO,
        prioridade: atendimento.prioridade ?? PrioridadeAtendimento.NORMAL,
        observacao_inicial: atendimento.observacao_inicial ?? "",
      });
      return;
    }

    form.reset({
      id: undefined,
      beneficiaria: "",
      origem: OrigemAtendimento.RECEPCAO,
      prioridade: PrioridadeAtendimento.NORMAL,
      observacao_inicial: "",
    });
  }, [atendimento, form]);

  const onSubmit = async (data: UpsertAtendimentoInput) => {
    setIsSubmitting(true);
    try {
      const result = await saveAtendimento(data);

      if (result.success) {
        toast.success(result.message);
        onOpenChange(false);
        form.reset();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Erro ao salvar atendimento");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {atendimento ? "Editar Atendimento" : "Novo Atendimento"}
          </DialogTitle>
          <DialogDescription>
            Vincule uma beneficiária a um novo caso.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="beneficiaria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beneficiária</FormLabel>
                  <FormControl>
                    <Select
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      value={
                        typeof field.value === "string" ||
                        typeof field.value === "number"
                          ? field.value
                          : ""
                      }
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    >
                      <option value="" disabled>
                        Selecione uma beneficiária...
                      </option>
                      {options.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.nome_completo}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="origem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origem</FormLabel>
                    <FormControl>
                      <Select {...field}>
                        {Object.values(OrigemAtendimento).map((o) => (
                          <option key={o} value={o}>
                            {o}
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
                name="prioridade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade</FormLabel>
                    <FormControl>
                      <Select {...field}>
                        {Object.values(PrioridadeAtendimento).map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="observacao_inicial"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observação</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o caso brevemente (opcional)..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                {atendimento ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

