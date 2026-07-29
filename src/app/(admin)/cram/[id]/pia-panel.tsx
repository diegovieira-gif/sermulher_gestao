"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { addEvolucao, deleteEvolucao, savePia } from "../actions";
import { PROCEDIMENTOS_PARTICIPACAO } from "../schemas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Pactuacao = {
  id?: number;
  demanda_identificada: string;
  servico_ofertado: string;
  acao_realizada: string;
};

type EvolucaoRegistrada = {
  id: number;
  data: string;
  descricao: string;
  tecnico?: string | null;
};

type PiaFormState = {
  id?: number;
  data_abertura: string;
  status: string;
  historico_demanda: string;
  participacao: Record<string, string>;
  participacao_obs: string;
  pactuacoes: Pactuacao[];
};

const hoje = () => new Date().toISOString().slice(0, 10);

const formatarData = (valor?: string | null) => {
  if (!valor) return "—";
  const [ano, mes, dia] = valor.slice(0, 10).split("-");
  return dia && mes && ano ? `${dia}/${mes}/${ano}` : valor;
};

const texto = (valor: unknown) => (typeof valor === "string" ? valor : "");

interface PiaPanelProps {
  atendimentoId: number;
  beneficiariaId: number;
  piaInicial: Record<string, unknown> | null;
}

export function PiaPanel({ atendimentoId, beneficiariaId, piaInicial }: PiaPanelProps) {
  const router = useRouter();
  const [salvando, startSalvamento] = useTransition();
  const [registrando, startRegistro] = useTransition();

  const evolucoes = (
    Array.isArray(piaInicial?.evolucoes) ? piaInicial?.evolucoes : []
  ) as EvolucaoRegistrada[];

  const pactuacoesIniciais = (
    Array.isArray(piaInicial?.pactuacoes) ? piaInicial?.pactuacoes : []
  ) as Array<Record<string, unknown>>;

  const form = useForm<PiaFormState>({
    defaultValues: {
      id: piaInicial?.id ? Number(piaInicial.id) : undefined,
      data_abertura: texto(piaInicial?.data_abertura).slice(0, 10) || hoje(),
      status: texto(piaInicial?.status) || "Ativo",
      historico_demanda: texto(piaInicial?.historico_demanda),
      participacao:
        piaInicial?.participacao && typeof piaInicial.participacao === "object"
          ? (piaInicial.participacao as Record<string, string>)
          : {},
      participacao_obs: texto(piaInicial?.participacao_obs),
      pactuacoes: pactuacoesIniciais.map((linha) => ({
        id: Number(linha.id) || undefined,
        demanda_identificada: texto(linha.demanda_identificada),
        servico_ofertado: texto(linha.servico_ofertado),
        acao_realizada: texto(linha.acao_realizada),
      })),
    },
  });

  const pactuacoes = useFieldArray({ control: form.control, name: "pactuacoes" });

  const [novaEvolucao, setNovaEvolucao] = useState({
    data: hoje(),
    descricao: "",
    tecnico: "",
  });

  const onSubmit = (valores: PiaFormState) => {
    startSalvamento(async () => {
      const resultado = await savePia({
        ...valores,
        beneficiaria: beneficiariaId,
        cram_atendimento: atendimentoId,
      });

      if (resultado.success) {
        toast.success("Plano individual salvo.");
        router.refresh();
      } else {
        toast.error(resultado.error || "Erro ao salvar o plano.");
      }
    });
  };

  const registrarEvolucao = () => {
    const piaId = form.getValues("id");
    if (!piaId) {
      toast.error("Salve o plano individual antes de registrar evoluções.");
      return;
    }
    if (!novaEvolucao.descricao.trim()) {
      toast.error("Descreva a evolução.");
      return;
    }

    startRegistro(async () => {
      const resultado = await addEvolucao(piaId, novaEvolucao);
      if (resultado.success) {
        toast.success("Evolução registrada.");
        setNovaEvolucao({ data: hoje(), descricao: "", tecnico: "" });
        router.refresh();
      } else {
        toast.error(resultado.error || "Erro ao registrar.");
      }
    });
  };

  const removerEvolucao = (id: number) => {
    startRegistro(async () => {
      const resultado = await deleteEvolucao(id);
      if (resultado.success) {
        toast.success("Evolução removida.");
        router.refresh();
      } else {
        toast.error(resultado.error || "Erro ao remover.");
      }
    });
  };

  const participacao = form.watch("participacao") ?? {};

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-slate-700">
            Plano Individual de Atendimento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pia-data">Data de abertura</Label>
              <Input id="pia-data" type="date" {...form.register("data_abertura")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pia-status">Status</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(valor) => form.setValue("status", valor)}
              >
                <SelectTrigger id="pia-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Encerrado">Encerrado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pia-historico">Histórico da demanda</Label>
            <Textarea id="pia-historico" rows={6} {...form.register("historico_demanda")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-slate-700">
            Pactuações com a usuária
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th className="p-2">Demandas identificadas</th>
                  <th className="p-2">Serviços ofertados</th>
                  <th className="p-2">Ações realizadas</th>
                  <th className="w-12 p-2" />
                </tr>
              </thead>
              <tbody>
                {pactuacoes.fields.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-muted-foreground">
                      Nenhuma pactuação registrada.
                    </td>
                  </tr>
                )}
                {pactuacoes.fields.map((linha, indice) => (
                  <tr key={linha.id} className="border-b last:border-0">
                    <td className="p-1">
                      <Textarea
                        rows={2}
                        {...form.register(`pactuacoes.${indice}.demanda_identificada`)}
                        aria-label={`Demanda identificada ${indice + 1}`}
                      />
                    </td>
                    <td className="p-1">
                      <Textarea
                        rows={2}
                        {...form.register(`pactuacoes.${indice}.servico_ofertado`)}
                        aria-label={`Serviço ofertado ${indice + 1}`}
                      />
                    </td>
                    <td className="p-1">
                      <Textarea
                        rows={2}
                        {...form.register(`pactuacoes.${indice}.acao_realizada`)}
                        aria-label={`Ação realizada ${indice + 1}`}
                      />
                    </td>
                    <td className="p-1 text-right align-top">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => pactuacoes.remove(indice)}
                        title="Remover pactuação"
                      >
                        <Trash2 className="size-4 text-destructive" />
                        <span className="sr-only">Remover pactuação {indice + 1}</span>
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
              pactuacoes.append({
                demanda_identificada: "",
                servico_ofertado: "",
                acao_realizada: "",
              })
            }
          >
            <Plus className="mr-2 size-4" />
            Adicionar pactuação
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-slate-700">
            Formas de participação da assistida
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {PROCEDIMENTOS_PARTICIPACAO.map((procedimento) => (
            <div
              key={procedimento.key}
              className="grid grid-cols-1 items-center gap-3 border-b pb-3 last:border-0 md:grid-cols-[1fr_180px]"
            >
              <Label htmlFor={`part-${procedimento.key}`} className="font-normal">
                {procedimento.label}
              </Label>
              <Select
                value={participacao[procedimento.key] ?? ""}
                onValueChange={(valor) =>
                  form.setValue("participacao", {
                    ...form.getValues("participacao"),
                    [procedimento.key]: valor,
                  })
                }
              >
                <SelectTrigger id={`part-${procedimento.key}`}>
                  <SelectValue placeholder="Meta atingida?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sim">Sim</SelectItem>
                  <SelectItem value="Não">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
          <div className="space-y-2">
            <Label htmlFor="pia-obs">Observações</Label>
            <Textarea id="pia-obs" rows={3} {...form.register("participacao_obs")} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end border-t pt-4">
        <Button type="submit" disabled={salvando}>
          {salvando ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Save className="mr-2 size-4" />
          )}
          Salvar plano individual
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-slate-700">
            Evolução do acompanhamento técnico
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!form.watch("id") && (
            <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
              Salve o plano individual acima para habilitar o registro de evoluções.
            </p>
          )}

          <div className="grid gap-3 md:grid-cols-[140px_1fr_180px_auto] md:items-end">
            <div className="space-y-2">
              <Label htmlFor="evo-data">Data</Label>
              <Input
                id="evo-data"
                type="date"
                value={novaEvolucao.data}
                onChange={(event) =>
                  setNovaEvolucao((atual) => ({ ...atual, data: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="evo-desc">Descrição</Label>
              <Input
                id="evo-desc"
                value={novaEvolucao.descricao}
                placeholder="O que foi observado ou realizado neste acompanhamento"
                onChange={(event) =>
                  setNovaEvolucao((atual) => ({ ...atual, descricao: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="evo-tecnico">Técnico</Label>
              <Input
                id="evo-tecnico"
                value={novaEvolucao.tecnico}
                onChange={(event) =>
                  setNovaEvolucao((atual) => ({ ...atual, tecnico: event.target.value }))
                }
              />
            </div>
            <Button
              type="button"
              onClick={registrarEvolucao}
              disabled={registrando || !form.watch("id")}
            >
              {registrando ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Plus className="mr-2 size-4" />
              )}
              Registrar
            </Button>
          </div>

          <div className="divide-y rounded-md border">
            {evolucoes.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">
                Nenhuma evolução registrada.
              </p>
            ) : (
              evolucoes.map((evolucao) => (
                <div
                  key={evolucao.id}
                  className="flex items-start justify-between gap-4 p-3"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      {formatarData(evolucao.data)}
                      {evolucao.tecnico ? ` · ${evolucao.tecnico}` : ""}
                    </p>
                    <p className="whitespace-pre-wrap text-sm">{evolucao.descricao}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removerEvolucao(evolucao.id)}
                    disabled={registrando}
                    title="Remover evolução"
                  >
                    <Trash2 className="size-4 text-destructive" />
                    <span className="sr-only">Remover evolução</span>
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
