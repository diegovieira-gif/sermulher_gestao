"use client";

import {
  Activity,
  Users,
  Calendar,
  TrendingUp,
  Clock,
  ArrowRight,
  HeartHandshake,
  ShieldAlert,
  ShieldCheck,
  Wallet,
  Landmark,
  Baby,
  GraduationCap,
  UserCheck,
  BookOpen,
  Repeat,
  Send,
  Gift,
  Inbox,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

// Paleta de acentos para os cards de indicadores.
type Tone =
  | "violet"
  | "fuchsia"
  | "sky"
  | "amber"
  | "emerald"
  | "rose"
  | "indigo"
  | "cyan"
  | "teal"
  | "orange";

const TONE: Record<Tone, { bar: string; chip: string; icon: string }> = {
  violet: { bar: "bg-violet-500", chip: "bg-violet-500/10", icon: "text-violet-600" },
  fuchsia: { bar: "bg-fuchsia-500", chip: "bg-fuchsia-500/10", icon: "text-fuchsia-600" },
  sky: { bar: "bg-sky-500", chip: "bg-sky-500/10", icon: "text-sky-600" },
  amber: { bar: "bg-amber-500", chip: "bg-amber-500/10", icon: "text-amber-600" },
  emerald: { bar: "bg-emerald-500", chip: "bg-emerald-500/10", icon: "text-emerald-600" },
  rose: { bar: "bg-rose-500", chip: "bg-rose-500/10", icon: "text-rose-600" },
  indigo: { bar: "bg-indigo-500", chip: "bg-indigo-500/10", icon: "text-indigo-600" },
  cyan: { bar: "bg-cyan-500", chip: "bg-cyan-500/10", icon: "text-cyan-600" },
  teal: { bar: "bg-teal-500", chip: "bg-teal-500/10", icon: "text-teal-600" },
  orange: { bar: "bg-orange-500", chip: "bg-orange-500/10", icon: "text-orange-600" },
};

interface KpiDef {
  label: string;
  value: number;
  hint?: string;
  icon: LucideIcon;
  tone: Tone;
  href?: string;
}

function KpiCard({ kpi }: { kpi: KpiDef }) {
  const tone = TONE[kpi.tone];
  const Icon = kpi.icon;
  const valor = kpi.value.toLocaleString("pt-BR");

  const inner = (
    <div className="group relative flex h-full items-start gap-3 overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <span className={`absolute inset-y-0 left-0 w-1 ${tone.bar}`} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-muted-foreground">
          {kpi.label}
        </p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
          {valor}
        </p>
        {kpi.hint && (
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {kpi.hint}
          </p>
        )}
      </div>
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone.chip}`}
      >
        <Icon className={`h-5 w-5 ${tone.icon}`} />
      </span>
    </div>
  );

  return kpi.href ? (
    <Link href={kpi.href} className="block h-full">
      {inner}
    </Link>
  ) : (
    inner
  );
}

function KpiGroup({ title, items }: { title: string; items: KpiDef[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((k) => (
          <KpiCard key={k.label} kpi={k} />
        ))}
      </div>
    </section>
  );
}

export function OverviewClient({
  stats,
  userName = "Gestão",
}: OverviewClientProps) {
  if (!stats) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground bg-gray-50 rounded-lg border border-dashed">
        <p>Aguardando dados...</p>
      </div>
    );
  }

  const {
    atendimentosPorDia = [],
    proximosEventos = [],
  } = stats;

  const ind = stats.indicadores;

  const grupos: { title: string; items: KpiDef[] }[] = [
    {
      title: "Visão Geral",
      items: [
        {
          label: "Total de Beneficiárias",
          value: ind.totalBeneficiarias,
          hint: "cadastradas no sistema",
          icon: Users,
          tone: "violet",
          href: "/mulheres/beneficiarias",
        },
        {
          label: "Atendimentos (Mês)",
          value: ind.atendimentosMes,
          hint: "registrados neste mês",
          icon: Activity,
          tone: "fuchsia",
          href: "/mulheres/atendimentos",
        },
        {
          label: "Eventos Próximos",
          value: ind.eventosProximos,
          hint: "na agenda",
          icon: Calendar,
          tone: "sky",
          href: "/eventos",
        },
        {
          label: "Demandas em Aberto",
          value: ind.demandasAbertas,
          hint: "aguardando providência",
          icon: Inbox,
          tone: "amber",
          href: "/tramitacoes",
        },
      ],
    },
    {
      title: "Perfil das Beneficiárias",
      items: [
        {
          label: "Com Medida Protetiva",
          value: ind.comMedidaProtetiva,
          hint: "em vigência",
          icon: ShieldCheck,
          tone: "rose",
        },
        {
          label: "Recebem Bolsa Família",
          value: ind.bolsaFamilia,
          hint: "benefício social",
          icon: Wallet,
          tone: "emerald",
        },
        {
          label: "Recebem BPC",
          value: ind.bpc,
          hint: "benefício de prestação continuada",
          icon: Landmark,
          tone: "teal",
        },
        {
          label: "Mães (com filhos)",
          value: ind.comFilhos,
          hint: "possuem filhos",
          icon: Baby,
          tone: "orange",
        },
      ],
    },
    {
      title: "Escola da Mulher",
      items: [
        {
          label: "Turmas Ativas",
          value: ind.turmasAtivas,
          hint: "em andamento",
          icon: GraduationCap,
          tone: "indigo",
          href: "/escola/turmas",
        },
        {
          label: "Alunas Matriculadas",
          value: ind.alunasMatriculadas,
          hint: "cursando",
          icon: UserCheck,
          tone: "violet",
          href: "/escola/matriculas",
        },
        {
          label: "Cursos Disponíveis",
          value: ind.cursosDisponiveis,
          hint: "no catálogo",
          icon: BookOpen,
          tone: "sky",
          href: "/escola/cursos",
        },
      ],
    },
    {
      title: "Sala Azul & Encaminhamentos",
      items: [
        {
          label: "Infratores Monitorados",
          value: ind.infratores,
          hint: "acompanhados",
          icon: ShieldAlert,
          tone: "indigo",
          href: "/sala-azul/infratores",
        },
        {
          label: "Ciclos Reflexivos",
          value: ind.ciclosReflexivos,
          hint: "ativos",
          icon: Repeat,
          tone: "cyan",
          href: "/sala-azul/ciclos",
        },
        {
          label: "Encaminhamentos (Mês)",
          value: ind.encaminhamentosMes,
          hint: "tramitações recebidas",
          icon: Send,
          tone: "fuchsia",
          href: "/tramitacoes",
        },
        {
          label: "Benefícios Entregues (Mês)",
          value: ind.beneficiosMes,
          hint: "no mês corrente",
          icon: Gift,
          tone: "emerald",
        },
      ],
    },
  ];

  const dataAtual = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formatarDataCurta = (dataStr: string) => {
    if (!dataStr) return "--/--";
    const data = new Date(dataStr + "T00:00:00");
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
      <div className="flex flex-col gap-1 mb-4">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          Olá, {userName}!
        </h1>
        <p className="text-sm text-muted-foreground capitalize font-medium">
          {dataAtual}
        </p>
      </div>

      {/* Indicadores agrupados */}
      <div className="space-y-6">
        {grupos.map((g) => (
          <KpiGroup key={g.title} title={g.title} items={g.items} />
        ))}
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
