'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FileText,
  Users,
  Shield,
  Calendar,
  TrendingUp,
  Heart,
  GraduationCap,
  Building2,
  Stethoscope,
  Home,
  Scale,
  AlertTriangle,
  Printer,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { DadosRMA } from './actions';

interface RMAClientProps {
  dados: DadosRMA;
  mesInicial: number;
  anoInicial: number;
}

const MESES = [
  { value: '1', label: 'Janeiro' },
  { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },
  { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

// Gera anos dos últimos 5 anos até o próximo ano
const ANOS = Array.from({ length: 6 }, (_, i) => {
  const ano = new Date().getFullYear() - 4 + i;
  return { value: ano.toString(), label: ano.toString() };
});

const CORES_ENCAMINHAMENTOS = [
  '#9333ea', // cras - roxo
  '#a855f7', // creas - roxo claro
  '#10b981', // saude - verde
  '#3b82f6', // educacao - azul
  '#f59e0b', // terceiro_setor - amarelo
  '#ef4444', // casa_abrigo - vermelho
  '#6366f1', // delegacia - índigo
  '#9ca3af', // nenhum - cinza
];

const CORES_VIOLENCIA = [
  '#ec4899', // fisica - rosa
  '#8b5cf6', // psicologica - roxo
  '#ef4444', // sexual - vermelho
  '#f59e0b', // patrimonial - amarelo
  '#6366f1', // moral - índigo
];

export function RMAClient({ dados, mesInicial, anoInicial }: RMAClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mes, setMes] = useState(mesInicial.toString());
  const [ano, setAno] = useState(anoInicial.toString());
  const [isPending, startTransition] = useTransition();

  const handleFilterChange = () => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('mes', mes);
      params.set('ano', ano);
      router.push(`/relatorios/rma?${params.toString()}`);
    });
  };

  // Prepara dados para gráfico de encaminhamentos
  const dadosEncaminhamentos = [
    { nome: 'CRAS', valor: dados.encaminhamentos.cras, cor: CORES_ENCAMINHAMENTOS[0] },
    { nome: 'CREAS', valor: dados.encaminhamentos.creas, cor: CORES_ENCAMINHAMENTOS[1] },
    { nome: 'Saúde', valor: dados.encaminhamentos.saude, cor: CORES_ENCAMINHAMENTOS[2] },
    { nome: 'Educação', valor: dados.encaminhamentos.educacao, cor: CORES_ENCAMINHAMENTOS[3] },
    { nome: 'Terceiro Setor', valor: dados.encaminhamentos.terceiro_setor, cor: CORES_ENCAMINHAMENTOS[4] },
    { nome: 'Casa Abrigo', valor: dados.encaminhamentos.casa_abrigo, cor: CORES_ENCAMINHAMENTOS[5] },
    { nome: 'Delegacia', valor: dados.encaminhamentos.delegacia, cor: CORES_ENCAMINHAMENTOS[6] },
    { nome: 'Nenhum', valor: dados.encaminhamentos.nenhum, cor: CORES_ENCAMINHAMENTOS[7] },
  ].filter((item) => item.valor > 0); // Remove zeros

  // Prepara dados para gráfico de tipos de violência
  const dadosTiposViolencia = [
    { nome: 'Física', valor: dados.tipos_violencia.fisica, cor: CORES_VIOLENCIA[0] },
    { nome: 'Psicológica', valor: dados.tipos_violencia.psicologica, cor: CORES_VIOLENCIA[1] },
    { nome: 'Sexual', valor: dados.tipos_violencia.sexual, cor: CORES_VIOLENCIA[2] },
    { nome: 'Patrimonial', valor: dados.tipos_violencia.patrimonial, cor: CORES_VIOLENCIA[3] },
    { nome: 'Moral', valor: dados.tipos_violencia.moral, cor: CORES_VIOLENCIA[4] },
  ].filter((item) => item.valor > 0); // Remove zeros

  // Calcula total para porcentagens
  const totalEncaminhamentos = dados.encaminhamentos.cras +
    dados.encaminhamentos.creas +
    dados.encaminhamentos.saude +
    dados.encaminhamentos.educacao +
    dados.encaminhamentos.terceiro_setor +
    dados.encaminhamentos.casa_abrigo +
    dados.encaminhamentos.delegacia +
    dados.encaminhamentos.nenhum;

  const totalTiposViolencia = dados.tipos_violencia.fisica +
    dados.tipos_violencia.psicologica +
    dados.tipos_violencia.sexual +
    dados.tipos_violencia.patrimonial +
    dados.tipos_violencia.moral;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Filtros e Botão de Impressão */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between print:hidden">
        <Card className="flex-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filtro de Período
          </CardTitle>
          <CardDescription>
            Selecione o mês e ano para visualizar os dados do Relatório Mensal de Atendimento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="mes">Mês</Label>
              <Select
                id="mes"
                value={mes}
                onChange={(e) => setMes(e.target.value)}
                disabled={isPending}
              >
                {MESES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="ano">Ano</Label>
              <Select
                id="ano"
                value={ano}
                onChange={(e) => setAno(e.target.value)}
                disabled={isPending}
              >
                {ANOS.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleFilterChange}
                disabled={isPending}
                className="w-full sm:w-auto"
              >
                {isPending ? 'Carregando...' : 'Aplicar Filtro'}
              </Button>
            </div>
          </div>
        </CardContent>
        </Card>
        <Button
          onClick={handlePrint}
          variant="outline"
          className="print:hidden"
        >
          <Printer className="mr-2 h-4 w-4" />
          Imprimir Relatório
        </Button>
      </div>

      {/* Bloco A: Volume de Atendimentos */}
      <div className="space-y-4 rma-print-section">
        <h2 className="text-2xl font-bold text-foreground">Bloco A: Volume de Atendimentos</h2>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Card grande com Total de Atendimentos */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Total de Atendimentos
              </CardTitle>
              <CardDescription>No período selecionado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-primary">{dados.volume.total_atendimentos}</div>
              <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Novos casos: <strong className="text-foreground">{dados.volume.novos_casos}</strong></span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cards menores para informações adicionais */}
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Novos Casos</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dados.volume.novos_casos}</div>
                <p className="text-xs text-muted-foreground">Primeiro atendimento do ano</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Bloco B: Perfil Social */}
      <div className="space-y-4 rma-print-section">
        <h2 className="text-2xl font-bold text-foreground">Bloco B: Perfil Social</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-600" />
                Bolsa Família
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{dados.perfil.bolsa_familia}</div>
              <div className="mt-2 h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-pink-600"
                  style={{
                    width: `${dados.volume.total_atendimentos > 0 ? (dados.perfil.bolsa_familia / dados.volume.total_atendimentos) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {dados.volume.total_atendimentos > 0
                  ? `${Math.round((dados.perfil.bolsa_familia / dados.volume.total_atendimentos) * 100)}% dos atendimentos`
                  : '0% dos atendimentos'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                BPC
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{dados.perfil.bpc}</div>
              <div className="mt-2 h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-blue-600"
                  style={{
                    width: `${dados.volume.total_atendimentos > 0 ? (dados.perfil.bpc / dados.volume.total_atendimentos) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {dados.volume.total_atendimentos > 0
                  ? `${Math.round((dados.perfil.bpc / dados.volume.total_atendimentos) * 100)}% dos atendimentos`
                  : '0% dos atendimentos'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Medida Protetiva
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{dados.perfil.medida_protetiva}</div>
              <div className="mt-2 h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-red-600"
                  style={{
                    width: `${dados.volume.total_atendimentos > 0 ? (dados.perfil.medida_protetiva / dados.volume.total_atendimentos) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {dados.volume.total_atendimentos > 0
                  ? `${Math.round((dados.perfil.medida_protetiva / dados.volume.total_atendimentos) * 100)}% dos atendimentos`
                  : '0% dos atendimentos'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bloco C: Encaminhamentos */}
      <div className="space-y-4 rma-print-section">
        <h2 className="text-2xl font-bold text-foreground">Bloco C: Encaminhamentos</h2>
        
        <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Encaminhamentos
              </CardTitle>
              <CardDescription>Distribuição dos encaminhamentos realizados</CardDescription>
            </CardHeader>
            <CardContent>
              {dadosEncaminhamentos.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300} className="print:!h-auto print:min-h-[200px]">
                    <BarChart data={dadosEncaminhamentos}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis
                        dataKey="nome"
                        className="text-muted-foreground"
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis
                        className="text-muted-foreground"
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          color: 'hsl(var(--foreground))',
                        }}
                        formatter={(value: number | undefined) => [
                          `${value || 0} (${totalEncaminhamentos > 0 ? Math.round(((value || 0) / totalEncaminhamentos) * 100) : 0}%)`,
                          'Quantidade',
                        ]}
                      />
                      <Bar dataKey="valor" radius={[8, 8, 0, 0]}>
                        {dadosEncaminhamentos.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.cor} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {dadosEncaminhamentos.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-4 w-4 rounded"
                            style={{ backgroundColor: item.cor }}
                          />
                          <span className="text-sm">{item.nome}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold">{item.valor}</span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({totalEncaminhamentos > 0 ? Math.round((item.valor / totalEncaminhamentos) * 100) : 0}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  Nenhum encaminhamento registrado no período
                </div>
              )}
            </CardContent>
          </Card>
      </div>

      {/* Bloco D: Tipos de Violência */}
      <div className="space-y-4 rma-print-section">
        <h2 className="text-2xl font-bold text-foreground">Bloco D: Tipos de Violência</h2>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Tipos de Violência
            </CardTitle>
            <CardDescription>Distribuição dos tipos de violência identificados (em relação ao total de atendimentos)</CardDescription>
          </CardHeader>
          <CardContent>
            {dadosTiposViolencia.length > 0 && dados.volume.total_atendimentos > 0 ? (
              <div className="space-y-6">
                {dadosTiposViolencia.map((item, index) => {
                  const porcentagem = (item.valor / dados.volume.total_atendimentos) * 100;
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-4 w-4 rounded"
                            style={{ backgroundColor: item.cor }}
                          />
                          <span className="text-sm font-medium">{item.nome}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold">{item.valor}</span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({Math.round(porcentagem)}%)
                          </span>
                        </div>
                      </div>
                      <Progress 
                        value={porcentagem} 
                        max={100}
                        indicatorColor={item.cor}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                Nenhum tipo de violência registrado no período
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
