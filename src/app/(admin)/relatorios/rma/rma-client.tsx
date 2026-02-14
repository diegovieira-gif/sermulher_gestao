"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Printer,
  Filter,
} from "lucide-react";
import {
  Card,
  CardContent,
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
import type { RMAStats } from "./actions";
import Image from "next/image";

interface RMAClientProps {
  dados: RMAStats;
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
      {/* Estilos de Impressão */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 10mm;
            size: A4;
          }
          body * {
            visibility: hidden;
          }
          #rma-print-area,
          #rma-print-area * {
            visibility: visible;
          }
          #rma-print-area {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            background: white;
            z-index: 9999;
          }
          .hide-on-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header e Filtros (Não aparecem na impressão) */}
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
            Imprimir Relatório
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

      {/* ÁREA DE IMPRESSÃO (Documento Oficial) */}
      <div id="rma-print-area" className="w-full max-w-[210mm] mx-auto bg-white p-8 min-h-[297mm] shadow-sm print:shadow-none border border-gray-200 print:border-none">

        {/* Bloco 1: Cabeçalho Institucional */}
        <div className="text-center border-b-2 border-black pb-4 mb-6">
          <h1 className="text-xl font-bold uppercase tracking-wider">Prefeitura Municipal de Aracaju</h1>
          <h2 className="text-lg font-semibold uppercase mt-1">SERMULHER</h2>
          <h3 className="text-md font-medium uppercase mt-1">Secretaria Municipal do Respeito às Políticas para as Mulheres</h3>
          <p className="mt-4 font-bold text-lg border p-2 inline-block px-8 border-black">
            RELATÓRIO MENSAL DE ATENDIMENTOS - RMA
          </p>
          <div className="mt-2 text-sm font-semibold">
            REFERÊNCIA: {MESES.find((m) => m.value === mes)?.label?.toUpperCase()} / {ano}
          </div>
        </div>

        {/* Bloco 2: Volume de Atendimentos */}
        <div className="mb-8">
          <h4 className="text-sm font-bold uppercase mb-2 border-l-4 border-black pl-2 bg-gray-100 py-1">
            1. MOVIMENTO MENSAL
          </h4>
          <table className="w-full border-collapse border border-black text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-black p-2 text-left w-2/3">DESCRIÇÃO</th>
                <th className="border border-black p-2 text-center w-1/3">QUANTIDADE</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-2 font-medium">
                  NOVOS CASOS (Primeiro Acolhimento no Mês)
                </td>
                <td className="border border-black p-2 text-center font-bold">
                  {dados.volume.novos_casos}
                </td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-medium">
                  ATENDIMENTOS TÉCNICOS REALIZADOS (Evoluções / Tramitações)
                </td>
                <td className="border border-black p-2 text-center font-bold">
                  {dados.volume.atendimentos_tecnicos}
                </td>
              </tr>
              <tr className="bg-gray-100">
                <td className="border border-black p-2 text-right font-bold">
                  TOTAL DE ATIVIDADES
                </td>
                <td className="border border-black p-2 text-center font-bold text-lg">
                  {dados.volume.total_movimento}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bloco 3: Detalhamento por Setor */}
        <div className="mb-8">
          <h4 className="text-sm font-bold uppercase mb-2 border-l-4 border-black pl-2 bg-gray-100 py-1">
            2. DETALHAMENTO DOS ATENDIMENTOS TÉCNICOS
          </h4>
          <table className="w-full border-collapse border border-black text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-black p-2 text-left w-2/3">SETOR / EQUIPE TÉCNICA</th>
                <th className="border border-black p-2 text-center w-1/3">ATENDIMENTOS</th>
              </tr>
            </thead>
            <tbody>
              {dados.setores.length > 0 ? (
                dados.setores.map((setor, index) => (
                  <tr key={setor.nome}>
                    <td className="border border-black p-2 uppercase">
                      {setor.nome}
                    </td>
                    <td className="border border-black p-2 text-center">
                      {setor.quantidade}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="border border-black p-2 text-center italic text-gray-500" colSpan={2}>
                    Nenhum atendimento técnico registrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bloco 4: Perfil da Violência (Novos Casos) */}
        <div className="mb-8">
          <h4 className="text-sm font-bold uppercase mb-2 border-l-4 border-black pl-2 bg-gray-100 py-1">
            3. TIPOS DE VIOLÊNCIA IDENTIFICADOS (NOVOS CASOS)
          </h4>
          <table className="w-full border-collapse border border-black text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-black p-2 text-left w-2/3">TIPOLOGIA</th>
                <th className="border border-black p-2 text-center w-1/3">OCORRÊNCIAS</th>
              </tr>
            </thead>
            <tbody>
              {dados.violencia.length > 0 ? (
                dados.violencia.map((v, index) => (
                  <tr key={v.tipo}>
                    <td className="border border-black p-2 uppercase">
                      {v.tipo}
                    </td>
                    <td className="border border-black p-2 text-center">
                      {v.quantidade}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="border border-black p-2 text-center italic text-gray-500" colSpan={2}>
                    Nenhuma tipologia identificada nos novos casos.
                  </td>
                </tr>
              )}
            </tbody>
            {dados.violencia.length > 0 && (
              <tfoot>
                <tr className="bg-gray-100">
                  <td className="border border-black p-2 text-xs italic text-gray-600">
                    * Um caso pode envolver múltiplos tipos de violência.
                  </td>
                  <td className="border border-black p-2"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Rodapé - Assinaturas */}
        <div className="mt-16 grid grid-cols-2 gap-16 text-center text-sm">
          <div className="border-t border-black pt-2">
            <p>Responsável Técnico</p>
          </div>
          <div className="border-t border-black pt-2">
            <p>Coordenação</p>
          </div>
        </div>

      </div>
    </div>
  );
}
