'use client';

import { useState, useEffect } from 'react';
import { Users, FileText, AlertTriangle, Calendar } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { directus } from '@/lib/directus';
import { aggregate } from '@directus/sdk';

interface DashboardStats {
  totalBeneficiarias: number;
  totalAtendimentos: number;
  totalInfratores: number;
  eventosAtivos: number;
}

// Dados mock para o gráfico de barras
const attendanceData = [
  { month: 'Ago', atendimentos: 145 },
  { month: 'Set', atendimentos: 178 },
  { month: 'Out', atendimentos: 165 },
  { month: 'Nov', atendimentos: 198 },
  { month: 'Dez', atendimentos: 210 },
  { month: 'Jan', atendimentos: 187 },
];

// Dados mock para o gráfico de pizza
const sectorData = [
  { name: 'Jurídico', value: 450, color: '#9333ea' },
  { name: 'Psicológico', value: 380, color: '#f97316' },
  { name: 'Social', value: 404, color: '#3b82f6' },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        setError(null);

        // Buscar contagem de beneficiárias
        const beneficiariasCount = await directus.request(
          aggregate('beneficiarias', {
            aggregate: { count: '*' },
          })
        );

        // Buscar contagem de atendimentos
        const atendimentosCount = await directus.request(
          aggregate('atendimentos', {
            aggregate: { count: '*' },
          })
        );

        // Buscar contagem de infratores (Sala Azul)
        const infratoresCount = await directus.request(
          aggregate('infratores', {
            aggregate: { count: '*' },
          })
        );

        setStats({
          totalBeneficiarias: Number(beneficiariasCount[0]?.count || 0),
          totalAtendimentos: Number(atendimentosCount[0]?.count || 0),
          totalInfratores: Number(infratoresCount[0]?.count || 0),
          eventosAtivos: 12, // Mock - implementar quando tiver collection de eventos
        });
      } catch (err) {
        console.error('Erro ao buscar estatísticas:', err);
        setError('Erro ao carregar dados do dashboard');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600"></div>
          <p className="mt-4 text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  const statsCards = [
    {
      title: 'Mulheres Atendidas',
      value: stats?.totalBeneficiarias.toLocaleString('pt-BR') || '0',
      icon: Users,
      color: 'bg-purple-500',
      lightColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      title: 'Atendimentos',
      value: stats?.totalAtendimentos.toLocaleString('pt-BR') || '0',
      icon: FileText,
      color: 'bg-orange-500',
      lightColor: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
    {
      title: 'Participantes Sala Azul',
      value: stats?.totalInfratores.toLocaleString('pt-BR') || '0',
      icon: AlertTriangle,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Eventos Ativos',
      value: stats?.eventosAtivos.toLocaleString('pt-BR') || '0',
      icon: Calendar,
      color: 'bg-green-500',
      lightColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <div className={`rounded-full p-3 ${stat.lightColor}`}>
                  <Icon className={`h-6 w-6 ${stat.textColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bar Chart - Evolução de Atendimentos */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Evolução de Atendimentos
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="month"
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="atendimentos" fill="#9333ea" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - Distribuição por Setor */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Distribuição por Setor
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sectorData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {sectorData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                formatter={(value, entry: any) => (
                  <span className="text-sm text-gray-600">
                    {value}: {entry.payload.value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
