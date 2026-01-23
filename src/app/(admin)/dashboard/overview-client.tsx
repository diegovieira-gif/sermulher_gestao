"use client";

import {
  Activity,
  Users,
  Calendar,
  AlertCircle,
  TrendingUp,
  Clock,
  ArrowRight,
  HeartHandshake,
  ShieldAlert,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { DashboardStats } from "./actions";
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
  stats: DashboardStats;
  userName?: string;
}

const COLORS = {
  primary: "#a855f7", // Purple
  secondary: "#ec4899", // Pink
  accent: "#d946ef", // Fuchsia
};

export function OverviewClient({
  stats,
  userName = "Gestão",
}: OverviewClientProps) {
  // 1. Proteção contra dados vazios
  if (!stats) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground bg-gray-50 rounded-lg border border-dashed">
        <p>Aguardando dados...</p>
      </div>
    );
  }

  // 2. Extração segura dos dados com fallbacks
  const {
    kpis = {
      totalAtendimentosMes: 0,
      novosCasos: 0,
      mulheresAcompanhamento: 0,
      demandaReprimida: 0,
    },
    atendimentosPorDia = [],
    proximosEventos = [],
  } = stats;

  const dataAtual = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formatarDataCurta = (dataStr: string) => {
    if (!dataStr) return "--/--";
    const data = new Date(dataStr + "T00:00:00"); // Fix timezone issue
    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
  };

  const getLabelDataRelativa = (dataStr: string) => {
    if (!dataStr) return "";
    const data = new Date(dataStr);
    const hoje = new Date();
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);

    if (data.toDateString() === hoje.toDateString()) return "Hoje";
    if (data.toDateString() === amanha.toDateString()) return "Amanhã";
    return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Olá, {userName}!
        </h1>
        <p className="text-sm text-gray-500 capitalize font-medium">
          {dataAtual}
        </p>
      </div>

      {/* Cards de KPIs */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 */}
        <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Atendimentos (Mês)
            </CardTitle>
            <Activity className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {kpis.totalAtendimentosMes}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              <span className="text-green-600 font-medium">
                +{kpis.novosCasos}
              </span>{" "}
              novos casos
            </p>
          </CardContent>
        </Card>

        {/* KPI 2 */}
        <Card className="border-l-4 border-l-pink-500 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Mulheres Ativas
            </CardTitle>
            <Users className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {kpis.mulheresAcompanhamento}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              em acompanhamento regular
            </p>
          </CardContent>
        </Card>

        {/* KPI 3 */}
        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Eventos
            </CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {proximosEventos.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">agendados p/ 7 dias</p>
          </CardContent>
        </Card>

        {/* KPI 4 */}
        <Card
          className={`border-l-4 shadow-sm hover:shadow-md transition-all ${kpis.demandaReprimida > 0 ? "border-l-orange-500 bg-orange-50/30" : "border-l-gray-300"}`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pendências
            </CardTitle>
            <AlertCircle
              className={`h-4 w-4 ${kpis.demandaReprimida > 0 ? "text-orange-500" : "text-gray-400"}`}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {kpis.demandaReprimida}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              casos aguardando triagem
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos e Listas */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Coluna Principal: Gráfico */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="h-[400px] flex flex-col shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <CardTitle>Fluxo de Atendimentos</CardTitle>
              </div>
              <p className="text-sm text-gray-500">
                Volume diário nos últimos 30 dias
              </p>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
              {atendimentosPorDia.length > 0 ? (
                <div className="w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={atendimentosPorDia}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e5e7eb"
                      />
                      <XAxis
                        dataKey="data"
                        stroke="#9ca3af"
                        fontSize={11}
                        tickFormatter={(value) => formatarDataCurta(value)}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                      />
                      <YAxis
                        stroke="#9ca3af"
                        fontSize={11}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: "#f9fafb" }}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                        labelFormatter={(value) => formatarDataCurta(value)}
                      />
                      <Bar
                        dataKey="quantidade"
                        fill={COLORS.primary}
                        radius={[4, 4, 0, 0]}
                        barSize={32}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-lg">
                  Sem dados para exibir no período
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna Lateral: Agenda e Ações */}
        <div className="space-y-6">
          <Card className="h-[400px] flex flex-col shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-pink-500" />
                <CardTitle>Agenda Rápida</CardTitle>
              </div>
              <p className="text-sm text-gray-500">Próximos compromissos</p>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {proximosEventos.length > 0 ? (
                <div className="space-y-3">
                  {proximosEventos.map((evento) => (
                    <div
                      key={evento.id}
                      className="group flex gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-purple-100 hover:shadow-sm transition-all"
                    >
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-2 h-2 rounded-full bg-pink-500 ring-4 ring-pink-50" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate group-hover:text-purple-700 transition-colors">
                          {evento.titulo}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] font-semibold text-gray-500 bg-white px-1.5 py-0.5 rounded border border-gray-200 uppercase tracking-wide">
                            {getLabelDataRelativa(evento.data_inicio)}
                          </span>
                          {evento.tipo_id && (
                            <span className="text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 truncate max-w-[100px]">
                              {evento.tipo_id.nome}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <Calendar className="h-10 w-10 text-gray-200 mb-3" />
                  <p className="text-sm text-gray-500">Nenhum evento próximo</p>
                </div>
              )}
            </CardContent>
            <div className="p-4 border-t bg-gray-50/50 rounded-b-xl">
              <Link href="/eventos" className="w-full">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 text-gray-600 hover:text-purple-700"
                >
                  Ver agenda completa <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </Card>

          {/* Atalhos */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/mulheres/atendimentos">
              <Button className="w-full bg-purple-600 hover:bg-purple-700 shadow-sm h-auto py-3 flex-col gap-1">
                <HeartHandshake className="h-5 w-5" />
                <span className="text-xs font-normal">Novo Atendimento</span>
              </Button>
            </Link>
            <Link href="/sala-azul">
              <Button
                variant="outline"
                className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 shadow-sm h-auto py-3 flex-col gap-1"
              >
                <ShieldAlert className="h-5 w-5" />
                <span className="text-xs font-normal">Sala Azul</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
