"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  useFieldArray,
  useForm,
  type Control,
  type FieldPath,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { saveInstrumental, type BeneficiariaOption, type UbsOption } from "./actions";
import {
  BENEFICIOS_ASSISTENCIAIS,
  ENCAMINHAMENTOS_SOCIOASSISTENCIAIS,
  FAIXAS_RENDA,
  INSTITUICOES_ENCAMINHAMENTO,
  ITENS_SANEAMENTO,
  NECESSIDADES_JURIDICAS,
  NECESSIDADES_SOCIOASSISTENCIAIS,
  ORGAOS_ENCAMINHAMENTO_JURIDICO,
  PERGUNTAS_RISCO_CRAM,
  SERVICOS_FREQUENTADOS,
  SERVICO_DETALHE_KEYS,
  SITUACOES_IMOVEL,
  STATUS_INSTRUMENTAL,
  TIPOS_BUSCA,
  TIPOS_DEFICIENCIA,
  TIPOS_VIOLENCIA_INSTRUMENTAL,
  TURNOS,
  instrumentalFormSchema,
  instrumentalVazio,
  type InstrumentalFormState,
} from "./schemas";
import { BeneficiariaComboBox } from "../mulheres/atendimentos/beneficiaria-combobox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

// --- Blocos reutilizáveis ---------------------------------------------------

/**
 * Rótulo e texto de apoio para blocos que NÃO são um campo único (grupos de
 * checkbox, seções inteiras).
 *
 * `FormLabel`/`FormDescription` do shadcn chamam `useFormField` e explodem com
 * "useFormField should be used within <FormField>" quando usados fora de um
 * campo. Aqui não há campo ao qual se associar — então são elementos simples,
 * com as mesmas classes visuais dos originais.
 */
function RotuloGrupo({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 block text-sm font-medium leading-none">{children}</p>
  );
}

function TextoApoio({ children }: { children: ReactNode }) {
  return <p className="text-[0.8rem] text-muted-foreground">{children}</p>;
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-slate-700">
          {titulo}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

/**
 * Nome de qualquer campo do formulário. Os helpers abaixo normalizam o valor
 * que recebem (`string[]`, `boolean`, `string`), então o contrato real é o do
 * componente e não do tipo — usar `FieldPath` mantém a checagem dos nomes.
 */
type NomeCampo = FieldPath<InstrumentalFormState>;

/** Só as strings de um valor desconhecido — protege os grupos de checkbox. */
const apenasTextos = (valor: unknown): string[] =>
  Array.isArray(valor) ? valor.filter((item): item is string => typeof item === "string") : [];

const comoTexto = (valor: unknown): string =>
  typeof valor === "string" ? valor : "";

/** Grupo de checkboxes ligado a um campo `string[]` do formulário. */
function GrupoCheckbox({
  control,
  name,
  opcoes,
  colunas = 3,
  descricoes,
}: {
  control: Control<InstrumentalFormState>;
  name: NomeCampo;
  opcoes: readonly string[];
  colunas?: 1 | 2 | 3;
  descricoes?: Record<string, string>;
}) {
  const grid =
    colunas === 1
      ? "grid-cols-1"
      : colunas === 2
        ? "grid-cols-1 md:grid-cols-2"
        : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const selecionados = apenasTextos(field.value);
        return (
          <FormItem>
            <div className={`grid gap-2 ${grid}`}>
              {opcoes.map((opcao) => {
                const marcado = selecionados.includes(opcao);
                return (
                  <label
                    key={opcao}
                    className="flex cursor-pointer items-start gap-2 rounded-md border border-transparent p-1 hover:border-slate-200"
                  >
                    <Checkbox
                      checked={marcado}
                      onCheckedChange={(checked) => {
                        field.onChange(
                          checked
                            ? [...selecionados, opcao]
                            : selecionados.filter((item) => item !== opcao),
                        );
                      }}
                      className="mt-0.5"
                    />
                    <span className="text-sm leading-tight">
                      {opcao}
                      {descricoes?.[opcao] && (
                        <span className="block text-xs text-muted-foreground">
                          {descricoes[opcao]}
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

function CampoSimNao({
  control,
  name,
  label,
  descricao,
}: {
  control: Control<InstrumentalFormState>;
  name: NomeCampo;
  label: string;
  descricao?: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between gap-4 rounded-lg border p-3">
          <div className="space-y-0.5">
            <FormLabel className="cursor-pointer">{label}</FormLabel>
            {descricao && <FormDescription>{descricao}</FormDescription>}
          </div>
          <FormControl>
            <Switch
              checked={field.value === true}
              onCheckedChange={field.onChange}
              aria-label={label}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
}

function CampoTextoSimples({
  control,
  name,
  label,
  placeholder,
}: {
  control: Control<InstrumentalFormState>;
  name: NomeCampo;
  label: string;
  placeholder?: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              name={field.name}
              ref={field.ref}
              onBlur={field.onBlur}
              value={comoTexto(field.value)}
              placeholder={placeholder}
              onChange={(event) => field.onChange(event.target.value)}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function CampoTextoLongo({
  control,
  name,
  label,
  descricao,
  linhas = 4,
}: {
  control: Control<InstrumentalFormState>;
  name: NomeCampo;
  label: string;
  descricao?: string;
  linhas?: number;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          {descricao && <FormDescription>{descricao}</FormDescription>}
          <FormControl>
            <Textarea
              name={field.name}
              ref={field.ref}
              onBlur={field.onBlur}
              value={comoTexto(field.value)}
              rows={linhas}
              onChange={(event) => field.onChange(event.target.value)}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function CampoSelecao({
  control,
  name,
  label,
  opcoes,
  placeholder = "Selecione...",
}: {
  control: Control<InstrumentalFormState>;
  name: NomeCampo;
  label: string;
  opcoes: readonly string[];
  placeholder?: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Select
              value={comoTexto(field.value)}
              onValueChange={(valor) => field.onChange(valor)}
            >
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {opcoes.map((opcao) => (
                  <SelectItem key={opcao} value={opcao}>
                    {opcao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// --- Formulário principal ---------------------------------------------------

interface CramFormProps {
  beneficiarias: BeneficiariaOption[];
  ubs: UbsOption[];
  valoresIniciais?: InstrumentalFormState;
  /** Pré-seleciona a assistida (ex.: vindo da ficha da beneficiária). */
  beneficiariaInicial?: number;
}

export function CramForm({
  beneficiarias,
  ubs,
  valoresIniciais,
  beneficiariaInicial,
}: CramFormProps) {
  const router = useRouter();
  const [salvando, startSalvamento] = useTransition();
  const [aba, setAba] = useState("atendimento");

  const form = useForm<InstrumentalFormState>({
    resolver: zodResolver(instrumentalFormSchema),
    defaultValues:
      valoresIniciais ?? {
        ...instrumentalVazio(),
        beneficiaria: beneficiariaInicial ?? 0,
      },
  });

  const composicao = useFieldArray({
    control: form.control,
    name: "composicao_domiciliar",
  });

  const edicao = Boolean(valoresIniciais?.id);

  const onSubmit = (valores: InstrumentalFormState) => {
    startSalvamento(async () => {
      const resultado = await saveInstrumental(valores);
      if (resultado.success) {
        toast.success(
          edicao ? "Instrumental atualizado." : "Instrumental registrado com sucesso.",
        );
        router.push(`/cram/${resultado.id}`);
        router.refresh();
      } else {
        toast.error(resultado.error || "Erro ao salvar.");
      }
    });
  };

  const onInvalid = () => {
    toast.error("Verifique os campos obrigatórios na aba Atendimento.");
    setAba("atendimento");
  };

  const servicosSelecionados = form.watch("servicos_frequenta") ?? [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6">
        <Tabs value={aba} onValueChange={setAba}>
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="atendimento">Atendimento</TabsTrigger>
            <TabsTrigger value="socioassistencial">I · Socioassistencial</TabsTrigger>
            <TabsTrigger value="juridico">II · Jurídico</TabsTrigger>
            <TabsTrigger value="psicologico">III · Psicológico</TabsTrigger>
          </TabsList>

          {/* ---------------- ABA 1: Atendimento ---------------- */}
          <TabsContent value="atendimento" className="space-y-4 pt-4">
            <Secao titulo="Identificação do atendimento">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="beneficiaria"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Assistida *</FormLabel>
                      <FormDescription>
                        Os dados pessoais vêm do prontuário em Gestão de Mulheres. Se a
                        assistida ainda não estiver cadastrada, cadastre-a antes.
                      </FormDescription>
                      <FormControl>
                        <BeneficiariaComboBox
                          options={beneficiarias}
                          value={field.value || undefined}
                          onValueChange={(valor) => field.onChange(valor ?? 0)}
                          placeholder="Buscar por nome ou CPF..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="data_atendimento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data do atendimento *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <CampoSelecao
                  control={form.control}
                  name="turno"
                  label="Turno"
                  opcoes={TURNOS}
                />

                <CampoTextoSimples
                  control={form.control}
                  name="responsavel_atendimento"
                  label="Responsável pelo atendimento"
                  placeholder="Nome do técnico"
                />

                <CampoSelecao
                  control={form.control}
                  name="status"
                  label="Status do instrumental"
                  opcoes={STATUS_INSTRUMENTAL}
                />
              </div>
            </Secao>

            <Secao titulo="1. Busca pelo serviço">
              <div className="grid gap-4 md:grid-cols-2">
                <CampoSelecao
                  control={form.control}
                  name="busca_tipo"
                  label="Como chegou ao serviço"
                  opcoes={TIPOS_BUSCA}
                />
                <CampoSelecao
                  control={form.control}
                  name="busca_encaminhada_por"
                  label="Se encaminhada, por instituição de"
                  opcoes={INSTITUICOES_ENCAMINHAMENTO}
                />
                <CampoTextoSimples
                  control={form.control}
                  name="busca_encaminhada_outra"
                  label="Outra instituição — qual?"
                />
                <CampoTextoSimples
                  control={form.control}
                  name="busca_como_soube"
                  label="Se espontânea, como soube do serviço?"
                />
              </div>

              <CampoTextoLongo
                control={form.control}
                name="servico_buscado"
                label="Qual serviço buscado?"
                linhas={2}
              />

              <CampoSimNao
                control={form.control}
                name="possui_medida_protetiva"
                label="Possui Medida Protetiva?"
              />
            </Secao>

            <Secao titulo="Documentação pessoal complementar">
              <TextoApoio>
                CPF e CadÚnico ficam no prontuário da assistida. Aqui registramos apenas o
                que o instrumental pede a mais.
              </TextoApoio>
              <div className="grid gap-4 md:grid-cols-2">
                <CampoTextoSimples control={form.control} name="rg" label="RG" />
                <CampoTextoSimples
                  control={form.control}
                  name="cartao_sus"
                  label="Cartão SUS"
                />
              </div>
            </Secao>
          </TabsContent>

          {/* ---------------- ABA 2: Parte I ---------------- */}
          <TabsContent value="socioassistencial" className="space-y-4 pt-4">
            <Secao titulo="Situação habitacional">
              <div className="grid gap-4 md:grid-cols-2">
                <CampoSelecao
                  control={form.control}
                  name="imovel_situacao"
                  label="Qual a situação do imóvel?"
                  opcoes={SITUACOES_IMOVEL}
                />
                <CampoTextoSimples
                  control={form.control}
                  name="imovel_situacao_outro"
                  label="Outro — qual?"
                />
              </div>
              <div>
                <RotuloGrupo>Possui saneamento básico?</RotuloGrupo>
                <GrupoCheckbox
                  control={form.control}
                  name="saneamento"
                  opcoes={ITENS_SANEAMENTO}
                />
              </div>
            </Secao>

            <Secao titulo="Pessoa com deficiência">
              <CampoSimNao
                control={form.control}
                name="possui_deficiencia"
                label="Possui alguma deficiência?"
              />
              <GrupoCheckbox
                control={form.control}
                name="deficiencia_tipos"
                opcoes={TIPOS_DEFICIENCIA}
                colunas={2}
              />
            </Secao>

            <Secao titulo="Saúde">
              <CampoSimNao
                control={form.control}
                name="saude_problema"
                label="Possui problema de saúde?"
              />
              <CampoTextoSimples
                control={form.control}
                name="saude_problema_qual"
                label="Qual?"
              />

              <CampoSimNao control={form.control} name="fuma" label="Fuma?" />
              <div className="grid gap-4 md:grid-cols-2">
                <CampoTextoSimples
                  control={form.control}
                  name="fuma_tempo"
                  label="Há quanto tempo?"
                />
                <CampoTextoSimples
                  control={form.control}
                  name="fuma_frequencia"
                  label="Frequência"
                />
              </div>

              <CampoSimNao
                control={form.control}
                name="usa_drogas"
                label="Faz uso de drogas?"
              />
              <div className="grid gap-4 md:grid-cols-3">
                <CampoTextoSimples
                  control={form.control}
                  name="drogas_qual"
                  label="Qual?"
                />
                <CampoTextoSimples
                  control={form.control}
                  name="drogas_tempo"
                  label="Há quanto tempo?"
                />
                <CampoTextoSimples
                  control={form.control}
                  name="drogas_frequencia"
                  label="Frequência"
                />
              </div>

              <CampoSimNao
                control={form.control}
                name="uso_abusivo_alcool"
                label="Faz uso abusivo de bebida alcoólica?"
              />
              <div className="grid gap-4 md:grid-cols-2">
                <CampoTextoSimples
                  control={form.control}
                  name="alcool_tempo"
                  label="Há quanto tempo?"
                />
                <FormField
                  control={form.control}
                  name="ubs_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidade de saúde que frequenta</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value ? String(field.value) : ""}
                          onValueChange={(valor) =>
                            field.onChange(valor ? Number(valor) : null)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {ubs.map((unidade) => (
                              <SelectItem key={unidade.id} value={String(unidade.id)}>
                                {unidade.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </Secao>

            <Secao titulo="Trabalho, renda e benefícios socioassistenciais">
              <div className="grid gap-4 md:grid-cols-2">
                <CampoTextoSimples
                  control={form.control}
                  name="profissao_ocupacao"
                  label="Profissão / Ocupação"
                />
                <CampoSelecao
                  control={form.control}
                  name="faixa_renda"
                  label="Renda"
                  opcoes={FAIXAS_RENDA}
                />
              </div>

              <CampoSimNao
                control={form.control}
                name="recebe_beneficio"
                label="Recebe algum benefício assistencial?"
              />
              <GrupoCheckbox
                control={form.control}
                name="beneficios"
                opcoes={BENEFICIOS_ASSISTENCIAIS}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <CampoTextoSimples
                  control={form.control}
                  name="beneficios_outro"
                  label="Outro benefício — qual?"
                />
                <CampoTextoSimples
                  control={form.control}
                  name="cartao_cmais_quando"
                  label="Cartão Cmais — quando?"
                />
              </div>

              <div>
                <RotuloGrupo>Qual a maior necessidade socioassistencial?</RotuloGrupo>
                <GrupoCheckbox
                  control={form.control}
                  name="necessidades_socioassistenciais"
                  opcoes={NECESSIDADES_SOCIOASSISTENCIAIS}
                  colunas={1}
                />
              </div>
              <CampoTextoSimples
                control={form.control}
                name="necessidades_socioassistenciais_outro"
                label="Outros — especifique"
              />
            </Secao>

            <Secao titulo="Composição domiciliar">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                      <th className="p-2">Nome</th>
                      <th className="p-2">Parentesco</th>
                      <th className="w-20 p-2">Idade</th>
                      <th className="p-2">Escolaridade</th>
                      <th className="p-2">Ocupação / Renda</th>
                      <th className="p-2">Benefício</th>
                      <th className="w-12 p-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {composicao.fields.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="p-4 text-center text-muted-foreground"
                        >
                          Nenhum membro registrado.
                        </td>
                      </tr>
                    )}
                    {composicao.fields.map((linha, indice) => (
                      <tr key={linha.id} className="border-b last:border-0">
                        <td className="p-1">
                          <Input
                            {...form.register(`composicao_domiciliar.${indice}.nome`)}
                            aria-label={`Nome do membro ${indice + 1}`}
                          />
                        </td>
                        <td className="p-1">
                          <Input
                            {...form.register(
                              `composicao_domiciliar.${indice}.parentesco`,
                            )}
                            aria-label={`Parentesco do membro ${indice + 1}`}
                          />
                        </td>
                        <td className="p-1">
                          <Input
                            type="number"
                            min={0}
                            {...form.register(`composicao_domiciliar.${indice}.idade`, {
                              setValueAs: (v) => (v === "" ? null : Number(v)),
                            })}
                            aria-label={`Idade do membro ${indice + 1}`}
                          />
                        </td>
                        <td className="p-1">
                          <Input
                            {...form.register(
                              `composicao_domiciliar.${indice}.escolaridade`,
                            )}
                            aria-label={`Escolaridade do membro ${indice + 1}`}
                          />
                        </td>
                        <td className="p-1">
                          <Input
                            {...form.register(
                              `composicao_domiciliar.${indice}.ocupacao_renda`,
                            )}
                            aria-label={`Ocupação e renda do membro ${indice + 1}`}
                          />
                        </td>
                        <td className="p-1">
                          <Input
                            {...form.register(
                              `composicao_domiciliar.${indice}.beneficio_assistencial`,
                            )}
                            aria-label={`Benefício do membro ${indice + 1}`}
                          />
                        </td>
                        <td className="p-1 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => composicao.remove(indice)}
                            title="Remover linha"
                          >
                            <Trash2 className="size-4 text-destructive" />
                            <span className="sr-only">Remover membro {indice + 1}</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  composicao.append({
                    nome: "",
                    parentesco: "",
                    idade: null,
                    escolaridade: "",
                    ocupacao_renda: "",
                    beneficio_assistencial: "",
                  })
                }
              >
                <Plus className="mr-2 size-4" />
                Adicionar membro
              </Button>
            </Secao>

            <Secao titulo="Outro endereço para localização">
              <div className="grid gap-4 md:grid-cols-2">
                <CampoTextoSimples
                  control={form.control}
                  name="contato_alternativo_nome"
                  label="Nome"
                />
                <CampoTextoSimples
                  control={form.control}
                  name="contato_alternativo_telefone"
                  label="Telefone"
                />
              </div>
              <CampoTextoLongo
                control={form.control}
                name="contato_alternativo_endereco"
                label="Endereço"
                linhas={2}
              />
            </Secao>

            <Secao titulo="Serviços que frequenta ou utiliza">
              <GrupoCheckbox
                control={form.control}
                name="servicos_frequenta"
                opcoes={SERVICOS_FREQUENTADOS}
                colunas={2}
              />
              {servicosSelecionados.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                  {SERVICOS_FREQUENTADOS.filter((servico) =>
                    servicosSelecionados.includes(servico),
                  ).map((servico) => {
                    const chave = SERVICO_DETALHE_KEYS[servico];
                    return (
                      <FormField
                        key={servico}
                        control={form.control}
                        name={`servicos_frequenta_detalhes.${chave}`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{servico} — qual?</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ?? ""}
                                onChange={(event) => field.onChange(event.target.value)}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    );
                  })}
                </div>
              )}
            </Secao>

            <Secao titulo="Caracterização da violência">
              <GrupoCheckbox
                control={form.control}
                name="tipos_violencia"
                opcoes={TIPOS_VIOLENCIA_INSTRUMENTAL.map((t) => t.valor)}
                colunas={2}
                descricoes={Object.fromEntries(
                  TIPOS_VIOLENCIA_INSTRUMENTAL.map((t) => [t.valor, t.descricao]),
                )}
              />
            </Secao>

            <Secao titulo="Identificação do(a) autor(a) de violência">
              <div className="grid gap-4 md:grid-cols-2">
                <CampoTextoSimples
                  control={form.control}
                  name="autor_nome"
                  label="Nome"
                />
                <CampoTextoSimples
                  control={form.control}
                  name="autor_naturalidade"
                  label="Naturalidade"
                />
                <FormField
                  control={form.control}
                  name="autor_idade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Idade</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          value={field.value ?? ""}
                          onChange={(event) =>
                            field.onChange(
                              event.target.value === "" ? null : Number(event.target.value),
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <CampoTextoSimples
                  control={form.control}
                  name="autor_sexo"
                  label="Sexo"
                />
                <CampoTextoSimples
                  control={form.control}
                  name="autor_raca"
                  label="Raça"
                />
                <CampoTextoSimples
                  control={form.control}
                  name="autor_relacao_vitima"
                  label="Relação com a vítima"
                />
              </div>
              <CampoTextoLongo
                control={form.control}
                name="autor_endereco"
                label="Endereço"
                linhas={2}
              />
            </Secao>

            <Secao titulo="Encaminhamento socioassistencial após o atendimento">
              <CampoSimNao
                control={form.control}
                name="encaminhamento_socio"
                label="A assistida foi encaminhada para algum equipamento socioassistencial?"
              />
              <GrupoCheckbox
                control={form.control}
                name="encaminhamento_socio_destinos"
                opcoes={ENCAMINHAMENTOS_SOCIOASSISTENCIAIS}
              />
              <CampoTextoSimples
                control={form.control}
                name="encaminhamento_socio_outro"
                label="Outros — qual?"
              />
            </Secao>
          </TabsContent>

          {/* ---------------- ABA 3: Parte II ---------------- */}
          <TabsContent value="juridico" className="space-y-4 pt-4">
            <Secao titulo="Qual a maior necessidade de orientação jurídica?">
              <GrupoCheckbox
                control={form.control}
                name="necessidades_juridicas"
                opcoes={NECESSIDADES_JURIDICAS}
                colunas={1}
              />
            </Secao>

            <Secao titulo="Boletim de ocorrência e medida protetiva">
              <CampoSimNao
                control={form.control}
                name="bo_realizado"
                label="Realizou o Boletim de Ocorrência?"
              />
              <CampoSimNao
                control={form.control}
                name="bo_realizado_por_nos"
                label="Caso não tenha realizado, foi realizado por nós durante o atendimento?"
              />
              <CampoSimNao
                control={form.control}
                name="solicitou_medida_protetiva"
                label="Solicitou Medida Protetiva?"
              />
            </Secao>

            <Secao titulo="Órgão para o qual a assistida foi encaminhada">
              <GrupoCheckbox
                control={form.control}
                name="encaminhamento_juridico"
                opcoes={ORGAOS_ENCAMINHAMENTO_JURIDICO}
                colunas={2}
              />
              <CampoTextoSimples
                control={form.control}
                name="encaminhamento_juridico_outro"
                label="Outro — qual?"
              />
            </Secao>
          </TabsContent>

          {/* ---------------- ABA 4: Parte III ---------------- */}
          <TabsContent value="psicologico" className="space-y-4 pt-4">
            <Card className="border-red-200 bg-red-50/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-red-800">
                  Avaliação de risco
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {PERGUNTAS_RISCO_CRAM.map((pergunta) => (
                  <FormField
                    key={pergunta.key}
                    control={form.control}
                    name={`risco.${pergunta.key}`}
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-1 items-center gap-3 border-b border-red-100 pb-3 last:border-0 md:grid-cols-[2fr_220px]">
                        <FormLabel className="text-sm font-medium leading-snug">
                          {pergunta.label}
                        </FormLabel>
                        <FormControl>
                          <Select
                            value={field.value ?? ""}
                            onValueChange={(valor) => field.onChange(valor)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                              {pergunta.opcoes.map((opcao) => (
                                <SelectItem key={opcao} value={opcao}>
                                  {opcao}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                ))}
              </CardContent>
            </Card>

            <Secao titulo="Resumo da situação enfrentada — espaço psicóloga">
              <CampoTextoLongo
                control={form.control}
                name="resumo_psicologa"
                label="Resumo técnico"
                linhas={10}
              />
            </Secao>

            <Secao titulo="Observações gerais">
              <CampoTextoLongo
                control={form.control}
                name="observacoes"
                label="Observações"
                linhas={4}
              />
            </Secao>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/cram")}
            disabled={salvando}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={salvando}>
            {salvando ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Save className="mr-2 size-4" />
            )}
            {edicao ? "Salvar alterações" : "Registrar atendimento"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
