"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
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
    Legend
} from "recharts";
import {
    Printer,
    Filter,
    Instagram,
    Globe,
    Share2
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
import type { IndicadoresData } from "./actions";

interface IndicadoresClientProps {
    dados: IndicadoresData;
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

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088FE", "#00C49F"];
const RACA_COLORS = ["#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#6366f1", "#ef4444"];

function useMounted() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);
    return mounted;
}

export function IndicadoresClient({ dados, mesInicial, anoInicial }: IndicadoresClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [mes, setMes] = useState(mesInicial.toString());
    const [ano, setAno] = useState(anoInicial.toString());
    const mounted = useMounted();

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

    // Evita renderização dos gráficos no servidor (Hydration Error)
    if (!mounted) {
        return <div className="p-8 text-center">Carregando visualização...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Styles for print */}
            <style jsx global>{`
        @media print {
          @page { margin: 5mm; size: A4; }
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 10px;
            background: white;
            z-index: 9999;
          }
          .hide-on-print { display: none !important; }
          .break-inside-avoid { page-break-inside: avoid; }
        }
      `}</style>

            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 hide-on-print">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Painel de Indicadores</h2>
                    <p className="text-muted-foreground">Monitoramento Mensal CRAM & Ações</p>
                </div>
                <Button variant="outline" onClick={handleImprimir} className="gap-2">
                    <Printer className="h-4 w-4" />
                    Imprimir Relatório
                </Button>
            </div>

            {/* Filters */}
            <Card className="hide-on-print">
                <CardContent className="flex flex-col sm:flex-row gap-4 items-end pt-6">
                    <div className="space-y-2 w-full sm:w-[180px]">
                        <Label>Mês de Referência</Label>
                        <Select value={mes} onValueChange={setMes}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {MESES.map((m) => (
                                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 w-full sm:w-[120px]">
                        <Label>Ano</Label>
                        <Select value={ano} onValueChange={setAno}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {anosDisponiveis.map((a) => (
                                    <SelectItem key={a} value={a.toString()}>{a}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleFiltrar} disabled={isPending} className="bg-pink-600 hover:bg-pink-700 text-white">
                        {isPending ? "Atualizando..." : "Filtrar Resultados"}
                    </Button>
                </CardContent>
            </Card>

            {/* PRINTABLE AREA */}
            <div id="print-area" className="max-w-[210mm] mx-auto bg-white min-h-[297mm] p-6 space-y-8">

                {/* REPORT HEADER */}
                <div className="text-center border-b-2 border-slate-800 pb-4">
                    <h1 className="text-xl font-bold uppercase">Prefeitura Municipal de Seropédica</h1>
                    <h2 className="text-sm font-semibold uppercase text-slate-600">Secretaria de Assistência Social e Direitos Humanos</h2>
                    <div className="mt-4 bg-slate-100 py-2 border rounded-md">
                        <h3 className="text-lg font-bold text-slate-900 border-2 border-slate-900 inline-block px-4 py-1">
                            RELATÓRIO DE INDICADORES DE GESTÃO - CRAM
                        </h3>
                        {/* Correção: Trocado p por div para evitar erro de hidratação/nesting */}
                        <div className="text-sm mt-1 font-medium">
                            REFERÊNCIA: {MESES.find(m => m.value === mes)?.label.toUpperCase()} / {ano}
                        </div>
                    </div>
                </div>

                {/* BLOCO 1 & 2: Identificação e Demanda */}
                <section className="break-inside-avoid">
                    <h4 className="text-sm font-bold uppercase bg-slate-200 p-2 border-l-4 border-pink-600 mb-4">
                        1. Identificação da Demanda
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="border rounded-lg p-4">
                            <h5 className="text-xs font-bold uppercase text-slate-500 mb-2">Origem dos Atendimentos</h5>
                            <div className="h-[200px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={dados.identificacao.porOrigem} layout="vertical" margin={{ left: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                        <XAxis type="number" hide />
                                        {/* @ts-ignore */}
                                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                                        <Tooltip />
                                        <Bar dataKey="value" fill="#db2777" radius={[0, 4, 4, 0]} label={{ position: 'right', fill: '#000', fontSize: 10 }} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="border rounded-lg p-4">
                            <h5 className="text-xs font-bold uppercase text-slate-500 mb-2">Tipo de Demanda</h5>
                            <div className="flex items-center justify-center h-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={dados.identificacao.porTipoDemanda}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={40}
                                            outerRadius={70}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {dados.identificacao.porTipoDemanda.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </section>

                {/* BLOCO 3: Ações (Resumo Numérico) */}
                <section className="break-inside-avoid">
                    <h4 className="text-sm font-bold uppercase bg-slate-200 p-2 border-l-4 border-blue-600 mb-4">
                        2. Resumo das Ações Técnicas
                    </h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <p className="text-xs font-bold text-blue-600 uppercase mb-1">Total de Atendimentos</p>
                            <div className="text-3xl font-black text-slate-800">{dados.acoes.atendimentosTecnicos.total}</div>
                            <div className="text-[10px] text-slate-500 mt-1 flex justify-center gap-2">
                                <span>IND: <b>{dados.acoes.atendimentosTecnicos.individual}</b></span>
                                <span>|</span>
                                <span>COL: <b>{dados.acoes.atendimentosTecnicos.coletivo}</b></span>
                            </div>
                        </div>

                        <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                            <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Escola de Capacitação</p>
                            <div className="text-3xl font-black text-slate-800">{dados.acoes.educacao.turmasAtivas}</div>
                            <p className="text-[10px] text-slate-500 mt-1">Turmas Ativas no Mês</p>
                        </div>

                        <div className="bg-violet-50 p-4 rounded-lg border border-violet-100">
                            <p className="text-xs font-bold text-violet-600 uppercase mb-1">Ações de Rede</p>
                            <div className="text-3xl font-black text-slate-800">{dados.acoes.eventos.reunioesRede}</div>
                            <p className="text-[10px] text-slate-500 mt-1">Reuniões com a Rede</p>
                        </div>
                    </div>
                </section>

                {/* BLOCO 14: Perfil das Usuárias */}
                <section className="break-inside-avoid">
                    <h4 className="text-sm font-bold uppercase bg-slate-200 p-2 border-l-4 border-purple-600 mb-4">
                        3. Perfil das Usuárias Atendidas
                    </h4>
                    <div className="grid grid-cols-2 gap-6">
                        {/* Raça / Cor */}
                        <div className="h-[200px] border rounded-lg p-2">
                            <h5 className="text-center text-xs font-bold mb-2">Raça / Cor</h5>
                            <ResponsiveContainer width="100%" height="90%">
                                <PieChart>
                                    <Pie data={dados.perfil.racaCor} cx="50%" cy="50%" outerRadius={60} dataKey="value">
                                        {dados.perfil.racaCor.map((entry, index) => (
                                            <Cell key={`cell-r-${index}`} fill={RACA_COLORS[index % RACA_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend wrapperStyle={{ fontSize: '10px' }} layout="vertical" verticalAlign="middle" align="right" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Escolaridade */}
                        <div className="h-[200px] border rounded-lg p-2">
                            <h5 className="text-center text-xs font-bold mb-2">Escolaridade</h5>
                            <ResponsiveContainer width="100%" height="90%">
                                <BarChart data={dados.perfil.escolaridade} layout="vertical" margin={{ left: 30 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" hide />
                                    {/* @ts-ignore */}
                                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 9 }} />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 10, fill: '#000' }} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </section>

                {/* BLOCO 12: Comunicação e Marketing */}
                <section className="break-inside-avoid">
                    <h4 className="text-sm font-bold uppercase bg-slate-200 p-2 border-l-4 border-orange-500 mb-4">
                        4. Comunicação Social
                    </h4>

                    <div className="grid grid-cols-4 gap-4 mb-4">
                        <Card className="shadow-none border bg-orange-50/50">
                            <CardContent className="p-4 flex flex-col items-center">
                                <Share2 className="w-5 h-5 text-orange-600 mb-2" />
                                <span className="text-2xl font-bold">{dados.comunicacao.totalPosts}</span>
                                <span className="text-[10px] uppercase text-muted-foreground">Postagens</span>
                            </CardContent>
                        </Card>
                        <Card className="shadow-none border bg-orange-50/50">
                            <CardContent className="p-4 flex flex-col items-center">
                                <Globe className="w-5 h-5 text-orange-600 mb-2" />
                                <span className="text-2xl font-bold">{dados.comunicacao.alcanceTotal.toLocaleString()}</span>
                                <span className="text-[10px] uppercase text-muted-foreground">Alcance Total</span>
                            </CardContent>
                        </Card>
                        <Card className="col-span-2 shadow-none border bg-white flex items-center">
                            <CardContent className="p-4 w-full">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="text-[10px] uppercase text-muted-foreground bg-orange-100 text-orange-800 px-1 rounded">Top Post</span>
                                        <p className="font-bold text-sm line-clamp-2 mt-1">{dados.comunicacao.topPost?.titulo || "Nenhum post registrado"}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-orange-600">{dados.comunicacao.topPost?.alcance.toLocaleString() || 0}</p>
                                        <p className="text-[10px] text-muted-foreground">Alcance</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>

            </div>
        </div>
    );
}
