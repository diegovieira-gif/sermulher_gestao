"use client";

import { Users, FileText, Activity, Calendar } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { MulheresDashboardStats } from "./actions";

interface DashboardClientProps {
  stats: MulheresDashboardStats;
}

export function DashboardClient({ stats }: DashboardClientProps) {
  const { kpis, tiposViolencia, ultimosAtendimentos } = stats;

  // Cards de KPIs
  const statsCards = [
    {
      title: "Total de Beneficiárias",
      value: kpis.totalBeneficiarias.toLocaleString("pt-BR"),
      icon: Users,
      color: "bg-purple-500",
      lightColor: "bg-purple-50",
      textColor: "text-purple-600",
    },
    {
      title: "Casos Ativos",
      value: kpis.atendimentosEmAndamento.toLocaleString("pt-BR"),
      icon: Activity,
      color: "bg-pink-500",
      lightColor: "bg-pink-50",
      textColor: "text-pink-600",
    },
    {
      title: "Novos Este Mês",
      value: kpis.novosAtendimentosMes.toLocaleString("pt-BR"),
      icon: Calendar,
      color: "bg-violet-500",
      lightColor: "bg-violet-50",
      textColor: "text-violet-600",
    },
  ];

  // Função para mapear status para cores de badge
  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes("andamento")) {
      return "bg-blue-100 text-blue-800";
    }
    if (statusLower.includes("concluído") || statusLower.includes("concluido")) {
      return "bg-green-100 text-green-800";
    }
    if (statusLower.includes("aberto")) {
      return "bg-yellow-100 text-yellow-800";
    }
    if (statusLower.includes("arquivado")) {
      return "bg-gray-100 text-gray-800";
    }
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* Cards de KPIs */}
      <div className="grid gap-6 md:grid-cols-3">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="mt-2 text-3xl font-bold text-foreground">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`rounded-full p-3 ${stat.lightColor}`}>
                    <Icon className={`h-6 w-6 ${stat.textColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Gráfico: Tipos de Violência - Pie Chart (Donut) */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Tipos de Violência</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={tiposViolencia}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {tiposViolencia.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--foreground))",
                }}
                formatter={(value: number | undefined) => [
                  `${value || 0} casos`,
                  "Quantidade",
                ]}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                formatter={(value, entry: any) => (
                  <span className="text-sm text-muted-foreground">
                    {value}: {entry.payload.value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabela: Últimos Atendimentos */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Últimos Atendimentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ultimosAtendimentos.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Beneficiária</TableHead>
                    <TableHead>Tipo Atendimento</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ultimosAtendimentos.map((atendimento) => (
                    <TableRow key={atendimento.id}>
                      <TableCell>{atendimento.data}</TableCell>
                      <TableCell className="font-medium">
                        {atendimento.nomeBeneficiaria}
                      </TableCell>
                      <TableCell>{atendimento.tipoAtendimento}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(atendimento.status)}>
                          {atendimento.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 flex justify-end">
                <Link href="/mulheres/atendimentos">
                  <Button variant="outline">
                    Ver Todos
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum atendimento encontrado.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
