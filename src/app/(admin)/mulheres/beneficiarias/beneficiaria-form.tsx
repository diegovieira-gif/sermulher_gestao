"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { beneficiariaSchema, type Beneficiaria, type BeneficiariaFormValues } from "./schemas";
import { saveBeneficiaria } from "./actions";
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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface BeneficiariaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  beneficiaria?: Beneficiaria | null;
}

export function BeneficiariaForm({
  open,
  onOpenChange,
  beneficiaria,
}: BeneficiariaFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BeneficiariaFormValues>({
    resolver: zodResolver(beneficiariaSchema),
    defaultValues: {
      nome_completo: "",
      cpf: "",
      data_nascimento: "",
      contato: {
        telefone: "",
        email: "",
      },
      endereco: {
        logradouro: "",
        numero: "",
        bairro: "",
        cidade: "",
      },
      perfil_socioeconomico: "",
      recebe_bolsa_familia: false,
      recebe_bpc: false,
      possui_medida_protetiva: false,
    },
  });

  // Atualiza o formulário quando a beneficiária muda
  useEffect(() => {
    if (beneficiaria) {
      // Normaliza os dados do Directus para o formulário
      const normalizedData: BeneficiariaFormValues = {
        ...beneficiaria,
        // Garante que contato e endereco sejam objetos
        contato: beneficiaria.contato || { telefone: "", email: "" },
        endereco: beneficiaria.endereco || {
          logradouro: "",
          numero: "",
          bairro: "",
          cidade: "",
        },
        // Formata CPF se existir (remove formatação para exibição)
        cpf: beneficiaria.cpf || "",
        perfil_socioeconomico: beneficiaria.perfil_socioeconomico || "",
        recebe_bolsa_familia: beneficiaria.recebe_bolsa_familia || false,
        recebe_bpc: beneficiaria.recebe_bpc || false,
        possui_medida_protetiva: beneficiaria.possui_medida_protetiva || false,
      };
      form.reset(normalizedData);
    } else {
      form.reset({
        nome_completo: "",
        cpf: "",
        data_nascimento: "",
        contato: {
          telefone: "",
          email: "",
        },
        endereco: {
          logradouro: "",
          numero: "",
          bairro: "",
          cidade: "",
        },
        perfil_socioeconomico: "",
        recebe_bolsa_familia: false,
        recebe_bpc: false,
        possui_medida_protetiva: false,
      });
    }
  }, [beneficiaria, form]);

  const onSubmit = async (data: BeneficiariaFormValues) => {
    setIsSubmitting(true);

    try {
      const result = await saveBeneficiaria(data);

      if (result.success) {
        toast.success(result.message);
        onOpenChange(false);
        form.reset();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Erro ao salvar beneficiária");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {beneficiaria ? "Editar Beneficiária" : "Nova Beneficiária"}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados da beneficiária abaixo.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="dados-pessoais" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="dados-pessoais">Dados Pessoais</TabsTrigger>
                <TabsTrigger value="endereco-contato">Endereço e Contato</TabsTrigger>
                <TabsTrigger value="dados-sociais">Dados Sociais</TabsTrigger>
              </TabsList>

              {/* Aba: Dados Pessoais */}
              <TabsContent value="dados-pessoais" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="nome_completo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo *</FormLabel>
                      <FormControl>
                        <Input placeholder="Maria Silva" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="000.000.000-00"
                            {...field}
                            onChange={(e) => {
                              // Remove caracteres não numéricos
                              const value = e.target.value.replace(/\D/g, "");
                              // Limita a 11 dígitos
                              const limited = value.slice(0, 11);
                              field.onChange(limited);
                            }}
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
                        <FormLabel>Data de Nascimento *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="perfil_socioeconomico"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Perfil Socioeconômico</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Informações sobre a situação socioeconômica da beneficiária..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Aba: Endereço e Contato */}
              <TabsContent value="endereco-contato" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Contato</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contato.telefone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone *</FormLabel>
                          <FormControl>
                            <Input placeholder="(11) 98765-4321" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contato.email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="maria@email.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Endereço</h3>
                  
                  <FormField
                    control={form.control}
                    name="endereco.logradouro"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logradouro *</FormLabel>
                        <FormControl>
                          <Input placeholder="Rua das Flores" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="endereco.numero"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número *</FormLabel>
                          <FormControl>
                            <Input placeholder="123" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endereco.bairro"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bairro *</FormLabel>
                          <FormControl>
                            <Input placeholder="Centro" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endereco.cidade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cidade *</FormLabel>
                          <FormControl>
                            <Input placeholder="São Paulo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Aba: Dados Sociais e Proteção */}
              <TabsContent value="dados-sociais" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Dados Sociais e Proteção</h3>
                  
                  <FormField
                    control={form.control}
                    name="recebe_bolsa_familia"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Recebe Bolsa Família
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="recebe_bpc"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Recebe BPC (Benefício de Prestação Continuada)
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="possui_medida_protetiva"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Possui Medida Protetiva
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
            </Tabs>

            {/* Botões */}
            <div className="flex justify-end gap-4 pt-4 border-t">
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
                {beneficiaria ? "Atualizar" : "Cadastrar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
