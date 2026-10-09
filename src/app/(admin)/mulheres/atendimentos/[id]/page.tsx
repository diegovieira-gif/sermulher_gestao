import { notFound } from "next/navigation";
import {
  getAtendimentoDetails,
  getTramitacoes,
  getSetores,
  getTiposDemanda,
  getStatusEtapas,
} from "./actions";
import { getCurrentDemandAccess } from "@/lib/demanda-permissions";
import { TramitacoesClient } from "./tramitacoes-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  MapPin,
  Phone,
  ArrowLeft,
  FileText,
  AlertTriangle,
  Shield,
  Baby,
  Scale,
  Siren,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { booleano, formatarData } from "@/lib/datas";
import { lerNecessidades } from "../necessidades";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

// Necessidades: texto livre (formato atual do formulário) ou objeto/array
// legado — ver `lerNecessidades`. Antes só o legado era exibido; o texto
// digitado aparecia como "Dados inválidos".
function JsonList({
  data,
  emptyMessage,
}: {
  data: unknown;
  emptyMessage: string;
}) {
  const lido = lerNecessidades(data);
  if (!lido) return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;

  if (lido.tipo === "texto") {
    return (
      <p className="text-sm text-foreground whitespace-pre-wrap">{lido.texto}</p>
    );
  }

  return (
    <ul className="space-y-2 mt-2">
      {lido.itens.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm">
          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 dark:text-green-400" />
          <span className="text-foreground">{item}</span>
        </li>
      ))}
    </ul>
  );
}

// Helper para Avaliação de Risco
function AvaliacaoRiscoList({ data }: { data: any }) {
  if (!data) return <p className="text-sm text-muted-foreground">Nenhuma avaliação registrada.</p>;

  let parsedData = data;
  if (typeof data === "string") {
    try {
      parsedData = JSON.parse(data);
    } catch {
      return <p className="text-sm text-muted-foreground">Erro ao ler avaliação.</p>;
    }
  }

  if (typeof parsedData !== "object" || parsedData === null) return null;

  const entries = Object.entries(parsedData);
  if (entries.length === 0)
    return <p className="text-sm text-muted-foreground">Nenhuma avaliação registrada.</p>;

  return (
    <ul className="space-y-3">
      {entries.map(([pergunta, resposta]) => {
        const isRisk = String(resposta).toLowerCase() === "sim";

        return (
          <li
            key={pergunta}
            className={`p-3 rounded-md border text-sm flex items-start justify-between gap-4 ${isRisk ? "bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-800" : "bg-muted/50 border-border"
              }`}
          >
            <span className={`font-medium ${isRisk ? "text-red-800 dark:text-red-200" : "text-foreground"}`}>
              {pergunta.replace(/_/g, " ")}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              {isRisk && <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />}
              <span className={`font-bold ${isRisk ? "text-red-700 dark:text-red-300" : "text-muted-foreground"}`}>
                {String(resposta)}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default async function AtendimentoDetailPage({ params }: PageProps) {
  const { id } = await params;
  const atendimentoId = Number(id);

  if (isNaN(atendimentoId)) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">
          ID do Atendimento Inválido
        </h1>
        <Link href="/mulheres/atendimentos">
          <Button variant="outline">Voltar para a lista</Button>
        </Link>
      </div>
    );
  }

  // Busca dados em paralelo para performance
  const [
    atendimentoResult,
    tramitacoesResult,
    setoresResult,
    tiposDemandaResult,
    statusEtapasResult,
    demandAccess,
  ] = await Promise.all([
    getAtendimentoDetails(atendimentoId),
    getTramitacoes(atendimentoId),
    getSetores(),
    getTiposDemanda(),
    getStatusEtapas(),
    getCurrentDemandAccess(),
  ]);

  // Tipos de demanda visíveis ao perfil (admin/sem config = todos).
  const todosTipos =
    tiposDemandaResult.success && tiposDemandaResult.data ? tiposDemandaResult.data : [];
  const tiposPermitidos =
    demandAccess.allowedTipos === null
      ? todosTipos
      : todosTipos.filter((t) => demandAccess.allowedTipos!.includes(t.nome));

  if (!atendimentoResult.success || !atendimentoResult.data) {
    return notFound();
  }

  const atendimento = atendimentoResult.data;
  const beneficiaria = atendimento.beneficiaria;
  
  // Parse seguro do endereço caso venha como string JSON do Directus
  const rawEndereco = beneficiaria?.endereco;
  const endereco =
    typeof rawEndereco === "string"
      ? (() => {
          try {
            return JSON.parse(rawEndereco);
          } catch (e) {
            console.error("Erro ao converter endereco:", e);
            return {};
          }
        })()
      : rawEndereco || {};

  // Tratamento de Fallback para Prioridade e Origem (Relacional vs Texto)
  const prioridadeLabel =
    atendimento.prioridade_id?.nome || atendimento.prioridade;
  const origemLabel = atendimento.origem_id?.nome || atendimento.origem;

  // Formatação do Endereço
  const enderecoFormatado =
    [endereco.logradouro, endereco.numero, endereco.bairro, endereco.cidade]
      .filter(Boolean)
      .join(", ") || "Endereço não cadastrado";

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Cabeçalho de Navegação */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/mulheres/atendimentos">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Prontuário #{atendimento.id}
            </h1>
            <p className="text-sm text-muted-foreground">
              Aberto em{" "}
              {/* dateTime de parede: `new Date` + fuso podia trocar o dia */}
              {formatarData(atendimento.data_abertura)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {/* booleano(): o SQLite devolve 1/0 e `0 && …` renderiza "0" */}
          {booleano(atendimento.sigiloso) && (
            <Badge variant="destructive" className="flex items-center gap-1">
              Sigiloso
            </Badge>
          )}
          <Link href={`/mulheres/atendimentos/${atendimentoId}/relatorio`}>
            <Button variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              Ver Relatório
            </Button>
          </Link>
        </div>
      </div>

      {/* Cartão de Resumo da Beneficiária (Mantido no topo) */}
      <Card className="border-l-4 border-l-purple-600 shadow-sm bg-purple-50/30 dark:bg-purple-950/30">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Coluna 1: Identificação */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center dark:bg-purple-900/40">
                  <User className="h-6 w-6 text-purple-700 dark:text-purple-300" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    {beneficiaria?.nome_completo || "Nome não informado"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    CPF: {beneficiaria?.cpf || "Não informado"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-2">
                <Badge
                  variant={
                    atendimento.status === "aberto" ? "default" : "secondary"
                  }
                >
                  Status: {atendimento.status?.toUpperCase()}
                </Badge>

                {atendimento.tipo_violencia && (
                  <Badge
                    variant="outline"
                    className="text-red-600 border-red-200 bg-red-50 dark:text-red-400 dark:border-red-800 dark:bg-red-950/40"
                  >
                    {atendimento.tipo_violencia.nome}
                  </Badge>
                )}

                {prioridadeLabel && (
                  <Badge
                    className="text-white"
                    style={{
                      backgroundColor:
                        prioridadeLabel === "Alta" ? "#ef4444" : "#f59e0b",
                      color: "white",
                      borderColor: "transparent",
                    }}
                  >
                    {prioridadeLabel}
                  </Badge>
                )}

                {origemLabel && (
                  <Badge variant="secondary">Origem: {origemLabel}</Badge>
                )}
              </div>
            </div>

            {/* Coluna 2: Contato e Endereço */}
            <div className="space-y-3 md:text-right flex flex-col items-start md:items-end justify-center">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Phone className="h-4 w-4" />
                <span className="text-foreground font-medium">
                  {beneficiaria?.telefone || "Sem telefone"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <MapPin className="h-4 w-4" />
                <span className="text-foreground max-w-xs truncate">
                  {enderecoFormatado}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TABS PRINCIPAIS */}
      <Tabs defaultValue="contexto" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="contexto">Mapa de Risco & Contexto</TabsTrigger>
          <TabsTrigger value="evolucoes">Evoluções (Timeline)</TabsTrigger>
        </TabsList>

        {/* ABA 1: MAPA DE RISCO E CONTEXTO */}
        <TabsContent value="contexto" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* Card Socioassistencial */}
            <Card className="h-full border-t-4 border-t-pink-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-pink-700 dark:text-pink-300">
                  <Baby className="h-5 w-5" />
                  Socioassistencial
                </CardTitle>
                <CardDescription>
                  Contexto social e vulnerabilidades
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {booleano(atendimento.gestante_puerpera) && (
                  <div className="p-3 bg-pink-50 border border-pink-200 rounded-lg flex items-center gap-3 dark:bg-pink-950/40 dark:border-pink-800">
                    <Baby className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                    <span className="font-semibold text-pink-800 dark:text-pink-200">Gestante / Puérpera</span>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold text-sm mb-2 text-foreground">Necessidades Sociais:</h4>
                  <JsonList data={atendimento.necessidades_sociais} emptyMessage="Nenhuma necessidade social registrada." />
                </div>
              </CardContent>
            </Card>

            {/* Card Jurídico */}
            <Card className="h-full border-t-4 border-t-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <Scale className="h-5 w-5" />
                  Jurídico & Segurança
                </CardTitle>
                <CardDescription>
                  Situação legal e medidas de proteção
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {booleano(atendimento.medida_protetiva) && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 animate-pulse dark:bg-red-950/40 dark:border-red-800">
                    <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <span className="font-bold text-red-800 dark:text-red-200">Medida Protetiva Vigente</span>
                  </div>
                )}

                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                  <Siren className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Boletim de Ocorrência:</span>
                  <span className="text-sm text-foreground">{atendimento.boletim_ocorrencia || "Não informado"}</span>
                </div>

                <div>
                  <h4 className="font-semibold text-sm mb-2 text-foreground">Necessidades Jurídicas:</h4>
                  <JsonList data={atendimento.necessidades_juridicas} emptyMessage="Nenhuma demanda jurídica registrada." />
                </div>
              </CardContent>
            </Card>

            {/* Card Avaliação de Risco (Ocupa coluna inteira em mobile, 1 col em lg) */}
            <Card className="h-full border-t-4 border-t-orange-500 md:col-span-2 lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                  <AlertTriangle className="h-5 w-5" />
                  Avaliação de Risco
                </CardTitle>
                <CardDescription>
                  Indicadores de risco psicológico e físico
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AvaliacaoRiscoList data={atendimento.avaliacao_risco} />
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* ABA 2: EVOLUÇÕES (TIMELINE) */}
        <TabsContent value="evolucoes" className="mt-6">
          <TramitacoesClient
            atendimentoId={atendimentoId}
            initialTramitacoes={
              tramitacoesResult.success && tramitacoesResult.data
                ? tramitacoesResult.data
                : []
            }
            setores={
              setoresResult.success && setoresResult.data
                ? setoresResult.data
                : []
            }
            tiposDemanda={tiposPermitidos}
            statusEtapas={
              statusEtapasResult.success && statusEtapasResult.data
                ? statusEtapasResult.data
                : []
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
