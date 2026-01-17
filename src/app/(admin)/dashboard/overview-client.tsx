"use client";

import {
  Activity,
  Users,
  Calendar,
  AlertCircle,
  TrendingUp,
  Clock,
  HeartHandshake,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import type { DashboardStats, GlobalDashboardStats } from "./actions";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface OverviewClientProps {
  stats: GlobalDashboardStats | DashboardStats;
  userName?: string;
}

const COLORS = {
  primary: "#a855f7",
  secondary: "#ec4899",
  accent: "#d946ef",
  danger: "#ef4444",
  success: "#10b981",
  neutral: "#6b7280",
};

function isDashboardStats(stats: any): stats is DashboardStats {
  return "kpis" in stats && "atendimentosPorDia" in stats;
}

function isGlobalDashboardStats(stats: any): stats is GlobalDashboardStats {
  return "totais" in stats && "agenda" in stats && "casosCriticos" in stats;
}

export function OverviewClient({ stats, userName = "Secretaria" }: OverviewClientProps) {
  const dataAtual = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formatarDataCurta = (dataStr: string) => {
    const data = new Date(dataStr + "T00:00:00");
    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
  };

  const ehHoje = (dataStr: string) => {
    const data = new Date(dataStr + "T00:00:00");
    const hoje = new Date();
    return data.toDateString() === hoje.toDateString();
  };

  const ehAmanha = (dataStr: string) => {
    const data = new Date(dataStr + "T00:00:00");
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    return data.toDateString() === amanha.toDateString();
  };

  const getLabelDataRelativa = (dataStr: string) => {
    if (ehHoje(dataStr)) return "Hoje";
    if (ehAmanha(dataStr)) return "Amanha";
    return formatarDataCurta(dataStr);
  };

  const formatarDataAtendimento = (data: string) => {
    if (!data) return "-";
    const dataObj = new Date(data);
    return dataObj.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (isGlobalDashboardStats(stats)) {
    const { totais, agenda, casosCriticos } = stats;

    const formatarDataSessao = (data: string) => {
      const dataObj = new Date(data);
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const amanha = new Date(hoje);
      amanha.setDate(amanha.getDate() + 1);

      if (dataObj.toDateString() === hoje.toDateString()) {
        return "Hoje";
      } else if (dataObj.toDateString() === amanha.toDateString()) {
        return "Amanha";
      } else {
        return dataObj.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
        });
      }
    };

    const getPrioridadeColor = (prioridade: string, cor?: string) => {
      if (cor) return undefined;
      const prioridadeLower = prioridade?.toLowerCase() || "";
      if (
        prioridadeLower.includes("emergencia") ||
        prioridadeLower.includes("critico")
      ) {
        return "bg-red-100 text-red-800 border-red-200";
      }
      if (
        prioridadeLower.includes("urgente") ||
        prioridadeLower.includes("alto")
      ) {
        return "bg-orange-100 text-orange-800 border-orange-200";
      }
      return "bg-gray-100 text-gray-800 border-gray-200";
    };

    return (
      <div className="space-y-6 p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Ola, Gestor
          </h1>
          <p className="text-muted-foreground capitalize">{dataAtual}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Link href="/mulheres">
            <Card className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] border-l-4 border-l-purple-500 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl text-purple-900 dark:text-purple-100">
                    Gestao de Mulheres
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
                    Beneficiarias cadastradas
                  </p>
                  <Button
                    variant="ghost"
                    className="mt-4 text-purple-700 hover:text-purple-900 hover:bg-purple-100 dark:text-purple-300 dark:hover:bg-purple-900"
                  >
                    Ver todas
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>

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
                    Ver todos
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            Atencao Necessaria
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <CardTitle>Proximas Sessoes de Grupo</CardTitle>
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
                            <Badge
                              variant="outline"
                              className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                            >
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
                              Localizacao: {sessao.local}
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
                        Ver todas as sessoes
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      Nenhuma sessao agendada para os proximos 15 dias
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

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
                      const prioridadeColorClass = getPrioridadeColor(
                        caso.prioridade,
                        caso.prioridade_cor
                      );
                      const isAltaPrioridade =
                        caso.prioridade?.toLowerCase().includes("emergencia") ||
                        caso.prioridade?.toLowerCase().includes("urgente") ||
                        caso.prioridade?.toLowerCase().includes("critico") ||
                        caso.prioridade?.toLowerCase().includes("alto");

                      return (
                        <Link
                          key={caso.id}
                          href="/mulheres/atendimentos"
                          className="block"
                        >
                          <div
                            className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                              isAltaPrioridade
                                ? "border-orange-200 bg-orange-50/50 hover:bg-orange-100/50 dark:bg-orange-950/10 dark:border-orange-900 dark:hover:bg-orange-950/20"
                                : "border-border hover:bg-accent/50"
                            }`}
                          >
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
                                  className={`text-xs ${
                                    prioridadeColorClass || ""
                                  }`}
                                  style={
                                    caso.prioridade_cor && !prioridadeColorClass
                                      ? {
                                          backgroundColor:
                                            caso.prioridade_cor,
                                          color: "white",
                                          borderColor: caso.prioridade_cor,
                                        }
                                      : undefined
                                  }
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
                    <p className="text-sm">Nenhum caso em andamento</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (isDashboardStats(stats)) {
    const { kpis, atendimentosPorDia, proximosEventos, alertasMedidasProtetivas } =
      stats;

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-foreground">
            Ola, {userName}!
          </h1>
          <p className="text-sm text-muted-foreground capitalize">
            {dataAtual}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-primary hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Atendimentos (Mes)
              </CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold">
                  {kpis.totalAtendimentosMes}
                </div>
                <span className="text-xs text-muted-foreground">total</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                +{kpis.novosCasos} novos casos
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-secondary hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Mulheres Ativas
              </CardTitle>
              <Users className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {kpis.mulheresAcompanhamento}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                em acompanhamento
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-accent hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Proximos Eventos
              </CardTitle>
              <Calendar className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{proximosEventos.length}</div>
              <p className="text-xs text-muted-foreground mt-2">
                proximos 7 dias
              </p>
            </CardContent>
          </Card>

          <Card
            className={`border-l-4 ${
              kpis.demandaReprimida > 0
                ? "border-l-orange-500 bg-orange-50 dark:bg-orange-950/20"
                : "border-l-muted"
            } hover:shadow-lg transition-shadow`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pendencias
              </CardTitle>
              <AlertCircle
                className={`h-4 w-4 ${
                  kpis.demandaReprimida > 0
                    ? "text-orange-600"
                    : "text-muted-foreground"
                }`}
              />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {kpis.demandaReprimida}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                casos aguardando
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Atendimentos por Dia
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Ultimos 15 dias
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {atendimentosPorDia.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={atendimentosPorDia}
                      margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="data"
                        stroke="#9ca3af"
                        style={{ fontSize: "0.75rem" }}
                        tickFormatter={(value) => formatarDataCurta(value)}
                      />
                      <YAxis
                        stroke="#9ca3af"
                        style={{ fontSize: "0.75rem" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          border: `2px solid ${COLORS.primary}`,
                          borderRadius: "0.5rem",
                        }}
                        labelFormatter={(value) => formatarDataCurta(value)}
                        formatter={(value) => [value, "Atendimentos"]}
                      />
                      <Bar
                        dataKey="quantidade"
                        fill={COLORS.primary}
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    Sem dados de atendimentos no periodo
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-secondary" />
                  Agenda Imediata
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Proximos 7 dias
                </p>
              </CardHeader>
              <CardContent>
                {proximosEventos.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {proximosEventos.map((evento) => (
                      <div
                        key={evento.id}
                        className="flex gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-shrink-0 pt-1">
                          <Calendar className="h-4 w-4 text-secondary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {evento.titulo}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {getLabelDataRelativa(evento.data_inicio)}
                          </p>
                          {evento.tipo_id && (
                            <Badge
                              variant="secondary"
                              className="mt-2 text-xs"
                            >
                              {evento.tipo_id.nome}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
                    <Calendar className="h-8 w-8 opacity-30 mb-2" />
                    <p className="text-sm">Sem agenda para hoje</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {alertasMedidasProtetivas.length > 0 && (
          <Card className="border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                Alertas de Medidas Protetivas
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Beneficiarias com medidas protetivas cadastradas (ultimos 7 dias)
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {alertasMedidasProtetivas.map((beneficiaria) => (
                  <div
                    key={beneficiaria.id}
                    className="flex items-center justify-between p-2 bg-background rounded border border-red-200"
                  >
                    <span className="text-sm font-medium">
                      {beneficiaria.nome_completo}
                    </span>
                    <Badge variant="destructive" className="text-xs">
                      Medida Protetiva
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-2 justify-center pt-4">
          <Link href="/admin/mulheres/atendimentos">
            <button className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium transition-colors">
              Novo Atendimento
            </button>
          </Link>
          <Link href="/admin/eventos">
            <button className="px-6 py-2 rounded-lg border border-border hover:bg-muted font-medium transition-colors">
              Ver Agenda
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-8">
      <p className="text-muted-foreground">Dados do dashboard nao disponiveis</p>
    </div>
  );
}
