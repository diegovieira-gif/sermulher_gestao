import { notFound } from "next/navigation";
import {
  getAtendimentoDetails,
  getTramitacoes,
  getSetores,
} from "./actions";
import { TramitacoesClient } from "./tramitacoes-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  User, 
  MapPin, 
  Phone, 
  ArrowLeft,
  FileText
} from "lucide-react";
import Link from "next/link";

interface PageProps {
  // Definição correta para Next.js 15+
  params: Promise<{
    id: string;
  }>;
}

export default async function AtendimentoDetailPage({ params }: PageProps) {
  // 🛑 CORREÇÃO IMPORTANTE: Aguardar a promise params antes de ler o ID
  const { id } = await params;
  const atendimentoId = Number(id);

  // Validação imediata
  if (isNaN(atendimentoId)) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <h1 className="text-2xl font-bold text-red-600">ID do Atendimento Inválido</h1>
        <Link href="/mulheres/atendimentos">
          <Button variant="outline">Voltar para a lista</Button>
        </Link>
      </div>
    );
  }

  // Busca dados em paralelo
  const [atendimentoResult, tramitacoesResult, setoresResult] = await Promise.all([
    getAtendimentoDetails(atendimentoId),
    getTramitacoes(atendimentoId),
    getSetores(),
  ]);

  // Se não encontrar o atendimento (ou erro de permissão/banco)
  if (!atendimentoResult.success || !atendimentoResult.data) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center h-[50vh]">
        <h2 className="text-xl font-bold text-red-600 mb-2">Não foi possível carregar o atendimento</h2>
        <p className="text-muted-foreground mb-6">
          {atendimentoResult.success === false ? atendimentoResult.error : "Verifique se o atendimento existe e se você tem permissão."}
        </p>
        <Link href="/mulheres/atendimentos">
          <Button>Voltar para Listagem</Button>
        </Link>
      </div>
    );
  }

  const atendimento = atendimentoResult.data;
  const mulher = atendimento.beneficiaria;
  
  // Tratamento seguro para JSONs (caso o Directus retorne null ou string)
  const endereco = typeof mulher?.endereco === 'string' 
    ? JSON.parse(mulher.endereco) 
    : mulher?.endereco || {};
    
  const enderecoFormatado = endereco.logradouro 
    ? `${endereco.logradouro}, ${endereco.numero} - ${endereco.bairro}`
    : "Endereço não informado";

  const contato = typeof mulher?.contato === 'string'
    ? JSON.parse(mulher.contato)
    : mulher?.contato || {};

  return (
    <div className="space-y-6">
      {/* Cabeçalho de Navegação */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/mulheres/atendimentos">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Prontuário de Atendimento</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-mono">#{atendimento.id}</span>
              <span>•</span>
              <span>Aberto em {atendimento.data_abertura ? new Date(atendimento.data_abertura).toLocaleDateString('pt-BR') : 'Data não informada'}</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Link href={`/mulheres/atendimentos/${atendimentoId}/relatorio`} target="_blank">
            <Button variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              Imprimir Relatório
            </Button>
          </Link>
        </div>
      </div>

      {/* Card de Resumo da Beneficiária */}
      <Card className="bg-muted/40 border-l-4 border-l-primary">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between gap-6">
            
            {/* Coluna 1: Identificação */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-background rounded-full shadow-sm">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">{mulher?.nome_completo || "Beneficiária Desconhecida"}</h2>
                  <p className="text-sm text-muted-foreground">
                    CPF: {mulher?.cpf || "Não informado"}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline" className="bg-background">
                  {atendimento.status}
                </Badge>
                {atendimento.prioridade_id && (
                  <Badge 
                    style={{ 
                      backgroundColor: atendimento.prioridade_id.cor || "#6b7280",
                      color: "white",
                      borderColor: "transparent"
                    }}
                  >
                    {atendimento.prioridade_id.nome}
                  </Badge>
                )}
                {atendimento.origem_id && (
                  <Badge variant="secondary">
                    Origem: {atendimento.origem_id.nome}
                  </Badge>
                )}
              </div>
            </div>

            {/* Coluna 2: Contato e Endereço */}
            <div className="space-y-3 min-w-[300px] text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span className="text-foreground">{contato.telefone || "Sem telefone"}</span>
              </div>
              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5" />
                <span className="text-foreground max-w-xs">{enderecoFormatado}</span>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Área da Timeline (Client Component) */}
      <TramitacoesClient
        atendimentoId={atendimentoId}
        initialTramitacoes={tramitacoesResult.success ? tramitacoesResult.data : []}
        setores={setoresResult.success ? setoresResult.data : []}
      />
    </div>
  );
}