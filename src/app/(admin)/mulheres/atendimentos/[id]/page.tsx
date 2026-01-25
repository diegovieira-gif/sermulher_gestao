import { notFound } from "next/navigation";
import { getAtendimentoDetails, getTramitacoes, getSetores } from "./actions";
import { TramitacoesClient } from "./tramitacoes-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { User, MapPin, Phone, ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AtendimentoDetailPage({ params }: PageProps) {
  const { id } = await params;
  const atendimentoId = Number(id);

  if (isNaN(atendimentoId)) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <h1 className="text-2xl font-bold text-red-600">
          ID do Atendimento Inválido
        </h1>
        <Link href="/mulheres/atendimentos">
          <Button variant="outline">Voltar para a lista</Button>
        </Link>
      </div>
    );
  }

  // Busca dados em paralelo para performance
  const [atendimentoResult, tramitacoesResult, setoresResult] =
    await Promise.all([
      getAtendimentoDetails(atendimentoId),
      getTramitacoes(atendimentoId),
      getSetores(),
    ]);

  if (!atendimentoResult.success || !atendimentoResult.data) {
    return notFound();
  }

  const atendimento = atendimentoResult.data;
  const beneficiaria = atendimento.beneficiaria;
  const endereco = beneficiaria?.endereco || {};

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
    <div className="p-6 space-y-6">
      {/* Cabeçalho de Navegação */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/mulheres/atendimentos">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Prontuário #{atendimento.id}
            </h1>
            <p className="text-sm text-gray-500">
              Aberto em{" "}
              {new Date(atendimento.data_abertura || "").toLocaleDateString(
                "pt-BR",
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {atendimento.sigiloso && (
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

      {/* Cartão Principal: Dados da Beneficiária e do Caso */}
      <Card className="border-l-4 border-l-purple-600 shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Coluna 1: Identificação */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <User className="h-6 w-6 text-purple-700" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {beneficiaria?.nome_completo || "Nome não informado"}
                  </h2>
                  <p className="text-sm text-gray-500">
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
                    className="text-red-600 border-red-200 bg-red-50"
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
            <div className="space-y-3 min-w-[300px] text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span className="text-foreground">
                  {beneficiaria?.telefone || "Sem telefone"}
                </span>
              </div>
              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5" />
                <span className="text-foreground max-w-xs">
                  {enderecoFormatado}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Área da Timeline (Client Component) */}
      <TramitacoesClient
        atendimentoId={atendimentoId}
        initialTramitacoes={
          tramitacoesResult.success && tramitacoesResult.data
            ? tramitacoesResult.data
            : []
        }
        setores={
          setoresResult.success && setoresResult.data ? setoresResult.data : []
        }
      />
    </div>
  );
}
