"use client";

import { UnifiedDashboardStats } from "./actions";
import { Activity, GraduationCap, Users, Calendar } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  stats: UnifiedDashboardStats;
}

export function UnifiedDashboardClient({ stats }: Props) {
  const { atendimentos, escola, agenda } = stats;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Painel de Controle
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Indicadores unificados de todos os módulos do sistema
        </p>
      </div>

      {/* Seção 1: KPIs - Grid Responsivo de 4 Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Atendimentos do Mês */}
        <KPICard
          icon={<Activity className="h-6 w-6 text-pink-600" />}
          title="Atendimentos"
          value={atendimentos.totalMes}
          subtitle="este mês"
          bgColor="bg-pink-50 dark:bg-pink-950"
          iconBgColor="bg-pink-100 dark:bg-pink-900"
        />

        {/* Card 2: Alunas Ativas */}
        <KPICard
          icon={<GraduationCap className="h-6 w-6 text-blue-600" />}
          title="Alunas Ativas"
          value={escola.alunasCursando}
          subtitle="matriculadas"
          bgColor="bg-blue-50 dark:bg-blue-950"
          iconBgColor="bg-blue-100 dark:bg-blue-900"
        />

        {/* Card 3: Turmas Abertas */}
        <KPICard
          icon={<Users className="h-6 w-6 text-green-600" />}
          title="Turmas Abertas"
          value={escola.turmasAbertas}
          subtitle="em andamento"
          bgColor="bg-green-50 dark:bg-green-950"
          iconBgColor="bg-green-100 dark:bg-green-900"
        />

        {/* Card 4: Próximo Evento */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Próximo Evento
                </span>
              </div>
              {agenda.proximoEvento ? (
                <div className="mt-3">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {agenda.proximoEvento.titulo}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(agenda.proximoEvento.data).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  {agenda.proximoEvento.local && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      📍 {agenda.proximoEvento.local}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-3">
                  Nenhum evento agendado
                </p>
              )}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {agenda.eventosMes} evento(s) este mês
            </span>
          </div>
        </div>
      </div>

      {/* Seção 2: Gráfico de Evolução */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Evolução de Atendimentos
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Últimos 6 meses
          </p>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={atendimentos.evolucaoMeses}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis
                dataKey="name"
                className="text-xs text-gray-600 dark:text-gray-400"
                tick={{ fill: "currentColor" }}
              />
              <YAxis
                className="text-xs text-gray-600 dark:text-gray-400"
                tick={{ fill: "currentColor" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgb(255, 255, 255)",
                  border: "1px solid rgb(229, 231, 235)",
                  borderRadius: "0.5rem",
                }}
                labelStyle={{ color: "rgb(17, 24, 39)", fontWeight: 600 }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#ec4899"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorTotal)"
                name="Atendimentos"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Seção 3: Cards Informativos Adicionais */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Card de Resumo da Escola */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-white dark:bg-blue-950 shadow-sm">
              <GraduationCap className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                Escola da Mulher
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Capacitação em andamento
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {escola.alunasCursando}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">Alunas cursando</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {escola.turmasAbertas}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">Turmas ativas</p>
            </div>
          </div>
        </div>

        {/* Card de Resumo RMA */}
        <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900 rounded-xl shadow-sm border border-pink-200 dark:border-pink-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-white dark:bg-pink-950 shadow-sm">
              <Activity className="h-8 w-8 text-pink-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-pink-900 dark:text-pink-100">
                Rede Mulher Atendida
              </h3>
              <p className="text-sm text-pink-700 dark:text-pink-300">
                Atendimentos realizados
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold text-pink-900 dark:text-pink-100">
                {atendimentos.totalMes}
              </p>
              <p className="text-xs text-pink-700 dark:text-pink-300">Neste mês</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-pink-900 dark:text-pink-100">
                {atendimentos.evolucaoMeses.reduce((sum, mes) => sum + mes.total, 0)}
              </p>
              <p className="text-xs text-pink-700 dark:text-pink-300">Últimos 6 meses</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ======= COMPONENTE AUXILIAR: KPI CARD =======

interface KPICardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  subtitle: string;
  bgColor: string;
  iconBgColor: string;
}

function KPICard({ icon, title, value, subtitle, bgColor, iconBgColor }: KPICardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className={`inline-flex p-3 rounded-xl ${iconBgColor} mb-4`}>
            {icon}
          </div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}
