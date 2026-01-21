"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  insertInfratorSchema,
  type InfratorFormValues,
} from "../schemas";
import type {
  NivelOption,
  StatusLegalOption,
  TipoAgressaoOption,
} from "../actions";
import { saveInfrator } from "../actions";
import { Button } from "@/components/ui/button";
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
import { Loader2, ShieldAlert, ArrowLeft, ExternalLink } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface InfratorDetailsClientProps {
  infrator: any;
  historico: Array<{
    participacao_id: number;
    sala_id: number;
    nome_ciclo: string;
    data_inicio: string | null;
    data_termino: string | null;
    status_ciclo: string;
    status_participacao: string;
    frequencia_percentual: number;
    total_sessoes: number;
    presencas: number;
  }>;
  options: {
    niveis: NivelOption[];
    statusLegal: StatusLegalOption[];
    tiposAgressao: TipoAgressaoOption[];
  };
}

export function InfratorDetailsClient({
  infrator,
  historico,
  options,
}: InfratorDetailsClientProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Normalização dos dados
  const defaultValues: Partial<InfratorFormValues> = {
    ...infrator,
    nivel_id: infrator.nivel_id?.id || infrator.nivel_id,
    status_legal_id: infrator.status_legal_id?.id || infrator.status_legal_id,
    telefone: infrator.contato?.telefone || "",
    tipos_agressao_ids: Array.isArray(infrator.tipos_agressao_lista)
      ? infrator.tipos_agressao_lista.map((item: any) =>
          typeof item === "number" ? item : item.tipo_agressao_id?.id || item.id
        )
      : [],
  };

  const form = useForm<InfratorFormValues>({
    resolver: zodResolver(insertInfratorSchema),
    values: defaultValues as InfratorFormValues,
  });

  const onSubmit = async (data: InfratorFormValues) => {
    setIsSubmitting(true);

    try {
      const result = await saveInfrator({ ...data, id: infrator.id } as any);

      if (result.success) {
        toast.success(result.message);
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

  // Função para formatar data
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pt-BR");
    } catch {
      return dateString;
    }
  };

  // Função para formatar período
  const formatPeriodo = (
    dataInicio: string | null,
    dataTermino: string | null
  ): string => {
    const inicio = formatDate(dataInicio);
    const termino = formatDate(dataTermino);
    if (inicio === "-" && termino === "-") return "-";
    if (inicio === "-") return `Até ${termino}`;
    if (termino === "-") return `Desde ${inicio}`;
    return `${inicio} - ${termino}`;
  };

  // Função para obter cor do badge de status
  const getStatusColor = (status: string): string => {
    switch (status) {
      case "Em Andamento":
        return "bg-blue-500";
      case "Finalizada":
        return "bg-green-500";
      case "Planejada":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  // Função para obter cor do badge de frequência
  const getFrequenciaColor = (frequencia: number): string => {
    if (frequencia >= 80) return "bg-green-500";
    if (frequencia >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/sala-azul/infratores">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ShieldAlert className="h-8 w-8 text-destructive" />
              {infrator.nome_completo}
            </h1>
            <p className="text-muted-foreground">
              CPF: {infrator.cpf} | Processo: {infrator.numero_processo || "-"}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="dados" className="w-full">
        <TabsList>
          <TabsTrigger value="dados">Dados Pessoais</TabsTrigger>
          <TabsTrigger value="historico">Histórico de Ciclos</TabsTrigger>
        </TabsList>

        {/* Aba 1: Dados Pessoais */}
        <TabsContent value="dados" className="mt-6">
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
                        <Input placeholder="(00) 00000-0000" {...field} />
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
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Atualizar
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>

        {/* Aba 2: Histórico de Ciclos */}
        <TabsContent value="historico" className="mt-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Histórico de Participações
              </h3>
              <p className="text-sm text-muted-foreground">
                Lista de todos os ciclos em que este infrator participou ou está
                participando.
              </p>
            </div>

            {historico.length === 0 ? (
              <div className="border rounded-lg p-8 text-center text-muted-foreground">
                <p>Nenhuma participação registrada.</p>
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome do Ciclo</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Situação</TableHead>
                      <TableHead>Status Participação</TableHead>
                      <TableHead>Frequência</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historico.map((item) => (
                      <TableRow key={item.participacao_id}>
                        <TableCell className="font-medium">
                          {item.nome_ciclo}
                        </TableCell>
                        <TableCell>
                          {formatPeriodo(item.data_inicio, item.data_termino)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${getStatusColor(
                              item.status_ciclo
                            )} text-white`}
                          >
                            {item.status_ciclo}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {item.status_participacao}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={`${getFrequenciaColor(
                                item.frequencia_percentual
                              )} text-white`}
                            >
                              {item.frequencia_percentual}%
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              ({item.presencas}/{item.total_sessoes} sessões)
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link
                            href={`/sala-azul/ciclos/${item.sala_id}`}
                            target="_blank"
                          >
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
