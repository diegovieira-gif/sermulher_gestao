"use client";

import { HeartHandshake, Users, Calendar, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import type { GlobalDashboardStats } from "./actions";

interface OverviewClientProps {
  stats: GlobalDashboardStats;
}

export function OverviewClient({ stats }: OverviewClientProps) {
  const { totais, agenda, casosCriticos } = stats;

  // Formata a data atual
  const dataAtual = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Formata data da sessão
  const formatarDataSessao = (data: string) => {
    const dataObj = new Date(data);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    if (dataObj.toDateString() === hoje.toDateString()) {
      return "Hoje";
    } else if (dataObj.toDateString() === amanha.toDateString()) {
      return "Amanhã";
    } else {
      return dataObj.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      });
    }
  };

  // Formata data de abertura do atendimento
  const formatarDataAtendimento = (data: string) => {
    if (!data) return "-";
    const dataObj = new Date(data);
    return dataObj.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Cor do badge de prioridade (usa cor do DB se disponível, senão usa cores padrão)
  const getPrioridadeColor = (prioridade: string, cor?: string) => {
    // Se tiver cor do banco, usa inline style
    if (cor) {
      return undefined; // Retorna undefined para usar style inline
    }
    // Senão, usa cores padrão por nome
    const prioridadeLower = prioridade?.toLowerCase() || "";
    if (prioridadeLower.includes("emergência") || prioridadeLower.includes("emergencia") || prioridadeLower.includes("crítico") || prioridadeLower.includes("critico")) {
      return "bg-red-100 text-red-800 border-red-200";
    }
    if (prioridadeLower.includes("urgente") || prioridadeLower.includes("alto")) {
      return "bg-orange-100 text-orange-800 border-orange-200";
    }
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header: Saudação e Data */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Olá, Gestor
        </h1>
        <p className="text-muted-foreground capitalize">{dataAtual}</p>
      </div>

      {/* Cards de Navegação Grandes */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Card: Gestão de Mulheres */}
        <Link href="/mulheres">
          <Card className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] border-l-4 border-l-purple-500 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl text-purple-900 dark:text-purple-100">
                  Gestão de Mulheres
                </CardTitle>
                <div className="rounded-full bg-purple-500 p-3">
                  <HeartHandshake className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-4xl font-bold text-purple-900 dark:text-purple-100">
                  {totais.beneficiarias.toLocaleString("pt-BR")}
                </p>
                <p className="text-sm text-muted-foreground">
                  Beneficiárias cadastradas
                </p>
                <Button
                  variant="ghost"
                  className="mt-4 text-purple-700 hover:text-purple-900 hover:bg-purple-100 dark:text-purple-300 dark:hover:bg-purple-900"
                >
                  Ver todas →
                </Button>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Card: Sala Azul */}
        <Link href="/sala-azul">
          <Card className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl text-blue-900 dark:text-blue-100">
                  Sala Azul
                </CardTitle>
                <div className="rounded-full bg-blue-500 p-3">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-4xl font-bold text-blue-900 dark:text-blue-100">
                  {totais.infratores.toLocaleString("pt-BR")}
                </p>
                <p className="text-sm text-muted-foreground">
                  Infratores cadastrados
                </p>
                <Button
                  variant="ghost"
                  className="mt-4 text-blue-700 hover:text-blue-900 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900"
                >
                  Ver todos →
                </Button>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Seção: Atenção Necessária */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold text-foreground mb-4">
          Atenção Necessária
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Coluna Esquerda: Agenda */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <CardTitle>Próximas Sessões de Grupo</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {agenda.length > 0 ? (
                <div className="space-y-3">
                  {agenda.map((sessao) => (
                    <div
                      key={sessao.id}
                      className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            {formatarDataSessao(sessao.data)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground font-medium mb-1">
                          {sessao.tema}
                        </p>
                        <div className="space-y-0.5">
                          {sessao.nome_ciclo && (
                            <p className="text-xs text-foreground font-medium">
                              {sessao.nome_ciclo}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            📍 {sessao.local}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Link href="/sala-azul/ciclos">
                    <Button
                      variant="outline"
                      className="w-full mt-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      Ver todas as sessões
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    Nenhuma sessão agendada para os próximos 15 dias
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Coluna Direita: Alertas */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <CardTitle>Casos em Andamento (Mulheres)</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {casosCriticos.length > 0 ? (
                <div className="space-y-3">
                  {casosCriticos.map((caso) => {
                    const prioridadeColorClass = getPrioridadeColor(caso.prioridade, caso.prioridade_cor);
                    const isAltaPrioridade = caso.prioridade?.toLowerCase().includes("emergência") || 
                                            caso.prioridade?.toLowerCase().includes("emergencia") ||
                                            caso.prioridade?.toLowerCase().includes("urgente") ||
                                            caso.prioridade?.toLowerCase().includes("crítico") ||
                                            caso.prioridade?.toLowerCase().includes("critico") ||
                                            caso.prioridade?.toLowerCase().includes("alto");
                    
                    return (
                      <Link
                        key={caso.id}
                        href="/mulheres/atendimentos"
                        className="block"
                      >
                        <div className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                          isAltaPrioridade 
                            ? "border-orange-200 bg-orange-50/50 hover:bg-orange-100/50 dark:bg-orange-950/10 dark:border-orange-900 dark:hover:bg-orange-950/20"
                            : "border-border hover:bg-accent/50"
                        }`}>
                          <div className="flex-shrink-0 mt-0.5">
                            {isAltaPrioridade ? (
                              <AlertTriangle className="h-4 w-4 text-orange-600" />
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                className={`text-xs ${prioridadeColorClass || ""}`}
                                style={caso.prioridade_cor && !prioridadeColorClass ? {
                                  backgroundColor: caso.prioridade_cor,
                                  color: "white",
                                  borderColor: caso.prioridade_cor,
                                } : undefined}
                              >
                                {caso.prioridade}
                              </Badge>
                              <p className="text-xs text-muted-foreground">
                                {formatarDataAtendimento(caso.data_abertura)}
                              </p>
                            </div>
                            <p className="text-sm font-medium text-foreground">
                              {caso.beneficiaria_nome}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Status: {caso.status}
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                  <Link href="/mulheres/atendimentos">
                    <Button
                      variant="outline"
                      className="w-full mt-2 text-orange-600 border-orange-200 hover:bg-orange-50"
                    >
                      Ver todos os atendimentos
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    Nenhum caso em andamento
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
