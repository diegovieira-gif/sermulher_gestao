"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Filter,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { DadosRMA } from "./actions";

interface RMAClientProps {
  dados: DadosRMA;
  mesInicial: number;
  anoInicial: number;
}

const MESES = [
  { value: "1", label: "Janeiro" },
  { value: "2", label: "Fevereiro" },
  { value: "3", label: "Março" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Maio" },
  { value: "6", label: "Junho" },
  { value: "7", label: "Julho" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

export function RMAClient({ dados, mesInicial, anoInicial }: RMAClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mes, setMes] = useState(mesInicial.toString());
  const [ano, setAno] = useState(anoInicial.toString());

  const handleFiltrar = () => {
    startTransition(() => {
      router.push(`?mes=${mes}&ano=${ano}`);
    });
  };

  const handleImprimir = () => {
    window.print();
  };

  const anosDisponiveis = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i,
  );

  return (
    <div className="space-y-6">
      {/* Estilos de Impressão - Correção da Margem Esquerda */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 10mm;
            size: A4;
          }
          /* Oculta tudo por padrão */
          body * {
            visibility: hidden;
          }
          /* Exibe apenas a área do relatório e seus filhos */
          #rma-print-area,
          #rma-print-area * {
            visibility: visible;
          }
          /* Posicionamento absoluto para ignorar sidebar/margens do layout */
          #rma-print-area {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            background: white;
            z-index: 9999;
          }
          /* Remove sombras e fundos escuros para economizar tinta */
          .no-print-shadow {
            box-shadow: none !important;
            border: 1px solid #ddd !important;
          }
          /* Esconde botões dentro da área de print se houver */
          .hide-on-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Cabeçalho e Filtros (Não aparecem na impressão devido ao CSS acima) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 hide-on-print">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Relatório RMA</h2>
          <p className="text-muted-foreground">
            Registro Mensal de Atendimentos (SUAS)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleImprimir} className="gap-2">
            <Printer className="h-4 w-4" />
            Imprimir / Salvar PDF
          </Button>
        </div>
      </div>

      <Card className="hide-on-print">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros do Período
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="space-y-2 w-full sm:w-[180px]">
            <Label>Mês de Referência</Label>
            <Select value={mes} onValueChange={setMes}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MESES.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 w-full sm:w-[120px]">
            <Label>Ano</Label>
            <Select value={ano} onValueChange={setAno}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {anosDisponiveis.map((a) => (
                  <SelectItem key={a} value={a.toString()}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleFiltrar}
            disabled={isPending}
            className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700"
          >
            {isPending ? "Atualizando..." : "Aplicar Filtros"}
          </Button>
        </CardContent>
      </Card>

      {/* ÁREA DE IMPRESSÃO (ID rma-print-area é crucial) */}
      <div id="rma-print-area" className="space-y-6">
        {/* Cabeçalho apenas para impressão */}
        <div className="hidden print:block text-center mb-8 border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Relatório Mensal de Atendimentos (RMA)
          </h1>
          <p className="text-gray-600 mt-1">
            Secretaria Municipal do Respeito às Políticas para as Mulheres
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Período de Referência: {MESES.find((m) => m.value === mes)?.label}/
            {ano}
          </p>
        </div>

        {/* 1. Volume de Atendimentos */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="no-print-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Atendimentos
              </CardTitle>
              <FileText className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dados.volume.total_atendimentos}
              </div>
              <p className="text-xs text-muted-foreground">
                No período selecionado
              </p>
            </CardContent>
          </Card>
          <Card className="no-print-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Novos Casos</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dados.volume.novos_casos}
              </div>
              <p className="text-xs text-muted-foreground">
                Primeiro acolhimento
              </p>
            </CardContent>
          </Card>
          <Card className="no-print-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Medidas Protetivas
              </CardTitle>
              <Shield className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dados.perfil.medida_protetiva}
              </div>
              <p className="text-xs text-muted-foreground">
                Mulheres com MPU ativa
              </p>
            </CardContent>
          </Card>
          <Card className="no-print-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Benefício Social
              </CardTitle>
              <Heart className="h-4 w-4 text-pink-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dados.perfil.bolsa_familia + dados.perfil.bpc}
              </div>
              <p className="text-xs text-muted-foreground">
                Bolsa Família ou BPC
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 2. Tipos de Violência (Gráfico) */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4 no-print-shadow">
            <CardHeader>
              <CardTitle>Tipos de Violência Identificados</CardTitle>
              <CardDescription>
                Distribuição das ocorrências por tipologia
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      {
                        name: "Física",
                        total: dados.tipos_violencia.fisica,
                        fill: "#ef4444",
                      },
                      {
                        name: "Psicológica",
                        total: dados.tipos_violencia.psicologica,
                        fill: "#a855f7",
                      },
                      {
                        name: "Moral",
                        total: dados.tipos_violencia.moral,
                        fill: "#eab308",
                      },
                      {
                        name: "Sexual",
                        total: dados.tipos_violencia.sexual,
                        fill: "#f97316",
                      },
                      {
                        name: "Patrimonial",
                        total: dados.tipos_violencia.patrimonial,
                        fill: "#3b82f6",
                      },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
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
                    <Tooltip />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                      {/* Cells para cores individuais */}
                      <Cell fill="#ef4444" />
                      <Cell fill="#a855f7" />
                      <Cell fill="#eab308" />
                      <Cell fill="#f97316" />
                      <Cell fill="#3b82f6" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* 3. Encaminhamentos (Lista) */}
          <Card className="col-span-3 no-print-shadow">
            <CardHeader>
              <CardTitle>Rede de Atendimento</CardTitle>
              <CardDescription>
                Encaminhamentos realizados no mês
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div className="ml-2 space-y-1 flex-1">
                    <p className="text-sm font-medium leading-none">
                      CRAS/CREAS
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Assistência Social
                    </p>
                  </div>
                  <div className="font-bold">
                    {dados.encaminhamentos.cras + dados.encaminhamentos.creas}
                  </div>
                </div>
                <div className="flex items-center">
                  <Stethoscope className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div className="ml-2 space-y-1 flex-1">
                    <p className="text-sm font-medium leading-none">Saúde</p>
                    <p className="text-xs text-muted-foreground">
                      UBS, Hospitais
                    </p>
                  </div>
                  <div className="font-bold">{dados.encaminhamentos.saude}</div>
                </div>
                <div className="flex items-center">
                  <Scale className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div className="ml-2 space-y-1 flex-1">
                    <p className="text-sm font-medium leading-none">
                      Segurança/Justiça
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Delegacia, Defensoria
                    </p>
                  </div>
                  <div className="font-bold">
                    {dados.encaminhamentos.delegacia}
                  </div>
                </div>
                <div className="flex items-center">
                  <Home className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div className="ml-2 space-y-1 flex-1">
                    <p className="text-sm font-medium leading-none">Abrigo</p>
                    <p className="text-xs text-muted-foreground">
                      Acolhimento Institucional
                    </p>
                  </div>
                  <div className="font-bold">
                    {dados.encaminhamentos.casa_abrigo}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 4. Localidades */}
        <Card className="no-print-shadow">
          <CardHeader>
            <CardTitle>Territorialização</CardTitle>
            <CardDescription>Distribuição dos casos por bairro</CardDescription>
          </CardHeader>
          <CardContent>
            {dados.localidades.length > 0 ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {dados.localidades.slice(0, 6).map((loc, i) => (
                    <div
                      key={loc.bairro}
                      className="flex items-center justify-between p-2 border rounded bg-gray-50/50 break-inside-avoid"
                    >
                      <span
                        className="text-sm font-medium truncate pr-2"
                        title={loc.bairro}
                      >
                        {loc.bairro}
                      </span>
                      <span className="text-sm font-bold bg-white px-2 py-0.5 rounded border">
                        {loc.total}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Destaque Bairro */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="bg-purple-50 p-4 rounded-lg text-center break-inside-avoid">
                    <p className="text-xs uppercase text-purple-600 font-bold mb-1">
                      Maior Incidência
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {dados.localidades[0]?.bairro || "N/A"}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg text-center break-inside-avoid">
                    <p className="text-xs uppercase text-gray-500 font-bold mb-1">
                      Total de Bairros
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {dados.localidades.length}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                Nenhum registro de localidade encontrado.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rodapé da Impressão */}
        <div className="hidden print:block text-center text-xs text-gray-400 mt-8 pt-8 border-t">
          <p>
            Sistema SerMulher - Gerado em{" "}
            {new Date().toLocaleDateString("pt-BR")} às{" "}
            {new Date().toLocaleTimeString("pt-BR")}
          </p>
        </div>
      </div>
    </div>
  );
}
