"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Clock, Building2, User, Scale, Heart, Shield, Stethoscope, Printer } from "lucide-react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import {
  getTramitacoes,
  saveTramitacao,
  getSetores,
  type TramitacaoWithRelations,
  type SetorOption,
} from "./actions";
import { TipoDemanda, StatusEtapa } from "./schemas";

// Tipos de demanda disponíveis (usando enum do schema)
const TIPOS_DEMANDA = [
  { value: TipoDemanda.JURIDICA, label: "Jurídica", icon: Scale },
  { value: TipoDemanda.TERAPIA, label: "Terapia", icon: Heart },
  { value: TipoDemanda.MEDIDA_PROTETIVA, label: "Medida Protetiva", icon: Shield },
  { value: TipoDemanda.EXAME, label: "Exame", icon: Stethoscope },
];

// Status de etapa disponíveis (usando enum do schema)
const STATUS_ETAPA = [
  { value: StatusEtapa.AGUARDANDO, label: "Aguardando" },
  { value: StatusEtapa.EM_ATENDIMENTO, label: "Em atendimento" },
  { value: StatusEtapa.FINALIZADO, label: "Finalizado" },
];

// Schema de validação do formulário
const tramitacaoFormSchema = z.object({
  tipo_demanda: z.string().min(1, "Selecione o tipo de demanda"),
  setor_responsavel: z.string().optional(),
  relato_tecnico: z.string().min(1, "O relato técnico é obrigatório"),
  status_etapa: z.string().optional(),
});

type TramitacaoFormValues = z.infer<typeof tramitacaoFormSchema>;

interface TramitacoesClientProps {
  atendimentoId: number;
  initialTramitacoes: TramitacaoWithRelations[];
  setores: SetorOption[];
}

export function TramitacoesClient({
  atendimentoId,
  initialTramitacoes,
  setores,
}: TramitacoesClientProps) {
  const [tramitacoes, setTramitacoes] = useState<TramitacaoWithRelations[]>(
    initialTramitacoes
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<TramitacaoFormValues>({
    resolver: zodResolver(tramitacaoFormSchema),
    defaultValues: {
      tipo_demanda: "",
      setor_responsavel: "",
      relato_tecnico: "",
      status_etapa: StatusEtapa.AGUARDANDO,
    },
  });

  // Função para recarregar tramitações
  const reloadTramitacoes = async () => {
    setIsLoading(true);
    try {
      const result = await getTramitacoes(atendimentoId);
      if (result.success) {
        setTramitacoes(result.data);
      }
    } catch (error) {
      console.error("Erro ao recarregar tramitações:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para formatar data
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  // Função para formatar apenas data (sem hora)
  const formatDateOnly = (dateString: string | null | undefined): string => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pt-BR");
    } catch {
      return dateString;
    }
  };

  // Função para obter nome do usuário responsável
  const getUsuarioNome = (usuario: TramitacaoWithRelations["usuario_responsavel"]): string => {
    if (!usuario) return "Não informado";
    const firstName = usuario.first_name || "";
    const lastName = usuario.last_name || "";
    return `${firstName} ${lastName}`.trim() || "Usuário não identificado";
  };

  // Função para obter badge variant baseado no status
  const getStatusBadgeVariant = (status: string | null): "secondary" | "warning" | "success" => {
    if (!status) return "secondary";
    if (status === "Finalizado") return "success";
    if (status === "Em atendimento") return "warning";
    return "secondary";
  };

  // Função para obter ícone baseado no tipo de demanda
  const getTipoDemandaIcon = (tipo: string | null) => {
    if (!tipo) return Clock;
    const tipoEntry = TIPOS_DEMANDA.find(t => t.value === tipo);
    return tipoEntry?.icon || Clock;
  };

  // Função para renderizar relato técnico (com quebra de linha)
  const renderRelatoTecnico = (relato: string | null): React.ReactNode => {
    if (!relato) return <span className="text-muted-foreground italic">Sem relato</span>;
    
    // Se contém HTML (rich text), renderiza com dangerouslySetInnerHTML
    if (relato.includes("<") && relato.includes(">")) {
      return (
        <div 
          className="prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: relato }}
        />
      );
    }
    
    // Caso contrário, quebra por linhas
    return (
      <div className="whitespace-pre-wrap text-sm">
        {relato.split("\n").map((line, i) => (
          <div key={i}>{line || "\u00A0"}</div>
        ))}
      </div>
    );
  };

  const onSubmit = async (values: TramitacaoFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await saveTramitacao({
        atendimento_pai: atendimentoId,
        tipo_demanda: values.tipo_demanda,
        setor_responsavel: values.setor_responsavel
          ? Number(values.setor_responsavel)
          : undefined,
        relato_tecnico: values.relato_tecnico,
        status_etapa: values.status_etapa || undefined,
        data_recebimento: new Date().toISOString(),
      });

      if (result.success) {
        toast.success(result.message);
        form.reset();
        setDialogOpen(false);
        // Recarrega as tramitações
        await reloadTramitacoes();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("Erro ao salvar tramitação:", error);
      toast.error("Erro ao salvar tramitação. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Evolução do Caso</h2>
          <p className="text-muted-foreground">
            Histórico de tramitações e evoluções do atendimento
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/mulheres/atendimentos/${atendimentoId}/relatorio`} target="_blank">
            <Button variant="outline">
              <Printer className="mr-2 h-4 w-4" />
              Imprimir Relatório
            </Button>
          </Link>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Tramitação
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : tramitacoes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Nenhuma tramitação registrada ainda. Clique em "Nova Tramitação" para começar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tramitacoes.map((tramitacao, index) => (
            <Card key={tramitacao.id} className="relative">
              {/* Linha vertical da timeline (exceto no último item) */}
              {index < tramitacoes.length - 1 && (
                <div className="absolute left-8 top-16 bottom-0 w-0.5 bg-border" />
              )}
              
              <CardHeader className="pb-3">
                <div className="flex items-start gap-4">
                  {/* Ícone de timeline baseado no tipo de demanda */}
                  {(() => {
                    const IconComponent = getTipoDemandaIcon(tramitacao.tipo_demanda);
                    return (
                      <div className="relative z-10 mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <IconComponent className="h-4 w-4" />
                      </div>
                    );
                  })()}
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <CardTitle className="text-lg">
                        {tramitacao.tipo_demanda || "Tramitação"}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatDateOnly(tramitacao.data_recebimento)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      {tramitacao.setor_responsavel && (
                        <Badge variant="outline" className="gap-1">
                          <Building2 className="h-3 w-3" />
                          {tramitacao.setor_responsavel.nome}
                        </Badge>
                      )}
                      {tramitacao.status_etapa && (
                        <Badge variant={getStatusBadgeVariant(tramitacao.status_etapa)}>
                          {tramitacao.status_etapa}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pl-16 space-y-3">
                <div className="rounded-lg bg-muted/50 p-4">
                  {renderRelatoTecnico(tramitacao.relato_tecnico)}
                </div>
                
                {tramitacao.usuario_responsavel && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>Registrado por: {getUsuarioNome(tramitacao.usuario_responsavel)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para Nova Tramitação */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Tramitação</DialogTitle>
            <DialogDescription>
              Registre uma nova evolução ou tramitação para este atendimento.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="tipo_demanda"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Tipo de Demanda *
                      <InfoTooltip text="Classificação do tipo de demanda ou solicitação do atendimento." />
                    </FormLabel>
                    <FormControl>
                      <Select
                        value={field.value || ""}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo de demanda" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPOS_DEMANDA.map((tipo) => (
                            <SelectItem key={tipo.value} value={tipo.value}>
                              {tipo.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="setor_responsavel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Setor Responsável
                      <InfoTooltip text="Setor ou equipe responsável pelo acompanhamento desta etapa." />
                    </FormLabel>
                    <FormControl>
                      <Select
                        value={field.value || ""}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Nenhum" />
                        </SelectTrigger>
                        <SelectContent>
                          {setores.map((setor) => (
                            <SelectItem key={setor.id} value={String(setor.id)}>
                              {setor.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status_etapa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Status da Etapa
                      <InfoTooltip text="Situação atual da etapa de tramitação (Em Análise, Em Andamento, Concluída, etc)." />
                    </FormLabel>
                    <FormControl>
                      <Select
                        value={field.value || ""}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_ETAPA.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="relato_tecnico"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relato Técnico *</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Descreva a evolução, o atendimento realizado, ou a tramitação..."
                        className="min-h-[150px]"
                        rows={6}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Registrar Tramitação"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}