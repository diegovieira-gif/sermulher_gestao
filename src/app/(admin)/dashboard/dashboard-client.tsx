"use client";

import { OverviewClient } from "./overview-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, ShieldAlert, Activity } from "lucide-react";

interface DashboardStats {
  totalAtendimentos: number;
  totalAlunas: number;
  totalInfratores: number;
  growthAtendimentos?: string;
  growthAlunas?: string;
  growthInfratores?: string;
}

interface DashboardClientProps {
  stats: DashboardStats;
}

export default function DashboardClient({ stats }: DashboardClientProps) {
  return (
    <div className="space-y-4">
      {/* Cards de KPI (Indicadores Principais) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Mulheres Atendidas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Mulheres Atendidas
            </CardTitle>
            <Users className="h-4 w-4 text-pink-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAtendimentos}</div>
            <p className="text-xs text-muted-foreground">
              {stats.growthAtendimentos} em relação ao mês anterior
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Alunas Matriculadas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Alunas Matriculadas
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAlunas}</div>
            <p className="text-xs text-muted-foreground">
              {stats.growthAlunas} novas matrículas
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Homens em Grupos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Homens (Sala Azul)
            </CardTitle>
            <ShieldAlert className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInfratores}</div>
            <p className="text-xs text-muted-foreground">
              Participantes ativos
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Taxa de Resolução (Exemplo Calculado) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Eficiência Geral
            </CardTitle>
            <Activity className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.5%</div>
            <p className="text-xs text-muted-foreground">
              Taxa de resposta a chamados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos Detalhados */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Visão Geral de Atendimentos</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <OverviewClient />
          </CardContent>
        </Card>

        {/* Você pode adicionar um card de "Atividades Recentes" aqui no futuro */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Acesso Rápido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                Selecione um módulo para começar:
              </p>
              {/* Botões ou Links rápidos podem vir aqui */}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
