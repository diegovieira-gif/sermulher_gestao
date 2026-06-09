"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  beneficiariaSchema,
  type Beneficiaria,
  type BeneficiariaFormValues,
} from "./schemas";
import { saveBeneficiaria } from "./actions";
import { BAIRROS_ARACAJU } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";

interface FormOption {
  id: number;
  nome: string;
}

interface BeneficiariaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  beneficiaria?: Beneficiaria | null;
  formOptions?: {
    racas: FormOption[];
    estadosCivis: FormOption[];
    escolaridades: FormOption[];
    situacoesTrabalho: FormOption[];
    bairros: FormOption[];
  };
}

export function BeneficiariaForm({
  open,
  onOpenChange,
  beneficiaria,
  formOptions,
}: BeneficiariaFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BeneficiariaFormValues>({
    resolver: zodResolver(beneficiariaSchema),
    defaultValues: {
      nome_completo: "",
      nome_social: "",
      cpf: "",
      data_nascimento: "",
      raca_cor_id: undefined,
      estado_civil_id: undefined,
      quantidade_filhos: 0,
      telefone: "",
      email: "",
      contato: {
        melhor_turno_contato: null,
      },
      endereco: {
        logradouro: "",
        numero: "",
        bairro: "",
        cidade: "",
      },
      numero_cad_unico: "",
      escolaridade_id: undefined,
      situacao_trabalho_id: undefined,
      perfil_socioeconomico: "",
      recebe_bolsa_familia: false,
      recebe_bpc: false,
      possui_medida_protetiva: false,
    },
  });

  // Helper local para parsear campos JSON que podem vir como string
  const safeJsonParse = (val: any) => {
    if (typeof val === "string") {
      try {
        return JSON.parse(val);
      } catch {
        return null;
      }
    }
    return val;
  };

  // Atualiza o formulário quando a beneficiária muda
  useEffect(() => {
    if (beneficiaria) {
      const parsedContato = safeJsonParse(beneficiaria.contato);
      const parsedEndereco = safeJsonParse(beneficiaria.endereco);

      // Normaliza os dados do Directus para o formulário
      const normalizedData: BeneficiariaFormValues = {
        ...beneficiaria,
        // Garante que telefone e email sejam strings
        telefone: beneficiaria.telefone || "",
        email: beneficiaria.email || "",
        nome_social: beneficiaria.nome_social || "",
        raca_cor_id: beneficiaria.raca_cor_id,
        estado_civil_id: beneficiaria.estado_civil_id,
        quantidade_filhos: beneficiaria.quantidade_filhos || 0,
        // melhor_turno_contato agora fica dentro de contato
        contato: {
          melhor_turno_contato:
            parsedContato?.melhor_turno_contato || null,
        },
        numero_cad_unico: beneficiaria.numero_cad_unico || "",
        escolaridade_id: beneficiaria.escolaridade_id,
        situacao_trabalho_id: beneficiaria.situacao_trabalho_id,
        endereco: parsedEndereco || {
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
        nome_social: "",
        cpf: "",
        data_nascimento: "",
        raca_cor_id: undefined,
        estado_civil_id: undefined,
        quantidade_filhos: 0,
        telefone: "",
        email: "",
        contato: {
          melhor_turno_contato: null,
        },
        endereco: {
          logradouro: "",
          numero: "",
          bairro: "",
          cidade: "",
        },
        numero_cad_unico: "",
        escolaridade_id: undefined,
        situacao_trabalho_id: undefined,
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
        router.refresh();
        onOpenChange(false);
        form.reset();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Erro ao salvar beneficiária");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {beneficiaria ? "Editar Beneficiária" : "Nova Beneficiária"}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados da beneficiária abaixo.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, (err) => console.log("❌ RHF VALIDATION ERRORS:", err))} className="space-y-6">
            <Tabs defaultValue="dados-pessoais" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="dados-pessoais">Dados Pessoais</TabsTrigger>
                <TabsTrigger value="endereco-contato">
                  Endereço e Contato
                </TabsTrigger>
                <TabsTrigger value="dados-sociais">Dados Sociais</TabsTrigger>
              </TabsList>

              {/* Aba: Dados Pessoais */}
              <TabsContent value="dados-pessoais" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nome_completo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Nome Completo *
                          <InfoTooltip text="Nome completo conforme documentos oficiais." />
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Maria Silva" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nome_social"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Nome Social
                          <InfoTooltip text="Nome pelo qual a beneficiária prefere ser chamada." />
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Nome Social" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          CPF
                          <InfoTooltip text="Cadastro de Pessoa Física." />
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="000.000.000-00"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "");
                              field.onChange(value.slice(0, 11));
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
                        <FormLabel>
                          Data de Nascimento *
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quantidade_filhos"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Qtd. Filhos</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            {...field}
                            value={field.value !== null && field.value !== undefined ? Number(field.value) : 0}
                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="raca_cor_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Raça/Cor</FormLabel>
                        <Select
                          onValueChange={(val) => field.onChange(Number(val))}
                          value={field.value ? String(field.value) : undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {formOptions?.racas?.map((item) => (
                              <SelectItem key={item.id} value={String(item.id)}>
                                {item.nome}
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
                    name="estado_civil_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado Civil</FormLabel>
                        <Select
                          onValueChange={(val) => field.onChange(Number(val))}
                          value={field.value ? String(field.value) : undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {formOptions?.estadosCivis?.map((item) => (
                              <SelectItem key={item.id} value={String(item.id)}>
                                {item.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                </div>
              </TabsContent>

              {/* Aba: Endereço e Contato */}
              <TabsContent value="endereco-contato" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Contato</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="telefone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input placeholder="(79) 99999-9999" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="email@exemplo.com" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contato.melhor_turno_contato"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Melhor Turno</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || undefined}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Manhã">Manhã</SelectItem>
                              <SelectItem value="Tarde">Tarde</SelectItem>
                            </SelectContent>
                          </Select>
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
                          <Input placeholder="Rua das Flores" {...field} value={field.value || ""} />
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
                            <Input placeholder="123" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endereco.bairro"
                      render={({ field }) => {
                        // Usa opções do servidor se existirem, senão usa constante local
                        const serverBairros = formOptions?.bairros?.map(b => b.nome) || [];
                        const optionsToUse = serverBairros.length > 0 ? serverBairros : BAIRROS_ARACAJU;

                        const bairroOptions: ComboboxOption[] = optionsToUse.map(
                          (bairro) => ({
                            value: bairro,
                            label: bairro,
                          }),
                        );

                        return (
                          <FormItem>
                            <FormLabel>Bairro *</FormLabel>
                            <FormControl>
                              <Combobox
                                options={bairroOptions}
                                value={field.value || ""}
                                onValueChange={field.onChange}
                                placeholder="Selecione"
                                searchPlaceholder="Buscar..."
                                emptyMessage="Nada encontrado"
                                allowCreate={true}
                                onCreateOption={(newBairro) => {
                                  field.onChange(newBairro);
                                  toast.info(`Bairro "${newBairro}" adicionado`);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />

                    <FormField
                      control={form.control}
                      name="endereco.cidade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cidade *</FormLabel>
                          <FormControl>
                            <Input placeholder="Aracaju" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Aba: Dados Sociais */}
              <TabsContent value="dados-sociais" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="numero_cad_unico"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Número CadÚnico (NIS)
                          <InfoTooltip text="Número de Identificação Social." />
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="00000000000" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Espaço vazio para alinhar grid se necessário */}
                  <div className="hidden md:block"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="escolaridade_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Escolaridade</FormLabel>
                        <Select
                          onValueChange={(val) => field.onChange(Number(val))}
                          value={field.value ? String(field.value) : undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {formOptions?.escolaridades?.map((item) => (
                              <SelectItem key={item.id} value={String(item.id)}>
                                {item.nome}
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
                    name="situacao_trabalho_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Situação de Trabalho</FormLabel>
                        <Select
                          onValueChange={(val) => field.onChange(Number(val))}
                          value={field.value ? String(field.value) : undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {formOptions?.situacoesTrabalho?.map((item) => (
                              <SelectItem key={item.id} value={String(item.id)}>
                                {item.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                      <FormLabel>
                        Observações / Perfil Socioeconômico
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Informações adicionais..."
                          className="min-h-[100px]"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="border rounded-lg p-4 space-y-4">
                  <h3 className="text-sm font-semibold">Benefícios e Proteção</h3>

                  <FormField
                    control={form.control}
                    name="recebe_bolsa_familia"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Recebe Bolsa Família</FormLabel>
                        </div>
                        <FormControl>
                          <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="recebe_bpc"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Recebe BPC</FormLabel>
                        </div>
                        <FormControl>
                          <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="possui_medida_protetiva"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Possui Medida Protetiva</FormLabel>
                        </div>
                        <FormControl>
                          <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                        </FormControl>
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
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {beneficiaria ? "Atualizar" : "Cadastrar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
