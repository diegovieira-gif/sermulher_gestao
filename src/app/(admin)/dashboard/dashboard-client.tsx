"use client";

import { Activity, Users, Calendar, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardStats } from "./actions";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DashboardClientProps {
  stats: DashboardStats;
}

export function DashboardClient({ stats }: DashboardClientProps) {
  const { kpis, atendimentosPorDia, proximosEventos } = stats;

  // Formatar data para o gráfico
  const chartData = atendimentosPorDia.map(item => ({
    ...item,
    label: new Date(item.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral dos indicadores e atividades recentes.</p>
      </div>

      {/* KPIs Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atendimentos (Mês)</CardTitle>
            <Activity className="h-4 w-4 text-pink-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalAtendimentosMes}</div>
            <p className="text-xs text-muted-foreground">Registros no período atual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mulheres Ativas</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.mulheresAcompanhamento}</div>
            <p className="text-xs text-muted-foreground">Em acompanhamento escolar/social</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos Eventos</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{proximosEventos.length}</div>
            <p className="text-xs text-muted-foreground">Agendados para breve</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendências</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.demandaReprimida}</div>
            <p className="text-xs text-muted-foreground">Casos aguardando ação</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico e Lista */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Evolução de Atendimentos</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="label" 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `${value}`} 
                    />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="quantidade" fill="#ec4899" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Sem dados suficientes para o gráfico
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Agenda Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {proximosEventos.length > 0 ? (
                proximosEventos.map((evento) => (
                  <div key={evento.id} className="flex items-center">
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">{evento.titulo}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{new Date(evento.data_inicio).toLocaleDateString('pt-BR')}</span>
                        {evento.tipo_id && (
                          <Badge variant="secondary" className="text-[10px] h-5">
                            {evento.tipo_id.nome}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum evento próximo encontrado.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
