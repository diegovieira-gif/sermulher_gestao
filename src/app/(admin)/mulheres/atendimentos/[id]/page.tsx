import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TramitacoesClient } from "./tramitacoes-client";
import {
  getAtendimentoDetails,
  getTramitacoes,
  getSetores,
} from "./actions";
import { ArrowLeft, Calendar, MapPin, Phone, Mail, User } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: {
    id: string;
  };
}

// Função auxiliar para formatar CPF
function formatCPF(cpf: string | null | undefined): string {
  if (!cpf) return "";
  const cpfLimpo = cpf.replace(/\D/g, "");
  if (cpfLimpo.length !== 11) return cpf;
  return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

// Função auxiliar para formatar data
function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  } catch {
    return dateString;
  }
}

// Função para extrair informações de contato
function getContatoInfo(contato: any): {
  telefone?: string;
  email?: string;
} {
  if (!contato || typeof contato !== "object") return {};
  
  // Pode vir como objeto ou string JSON
  const parsed = typeof contato === "string" ? JSON.parse(contato) : contato;
  
  return {
    telefone: parsed?.telefone || parsed?.celular || parsed?.phone,
    email: parsed?.email || parsed?.e_mail,
  };
}

// Função para extrair informações de endereço
function getEnderecoInfo(endereco: any): string {
  if (!endereco || typeof endereco !== "object") return "Não informado";
  
  // Pode vir como objeto ou string JSON
  const parsed = typeof endereco === "string" ? JSON.parse(endereco) : endereco;
  
  const parts: string[] = [];
  if (parsed?.logradouro) parts.push(parsed.logradouro);
  if (parsed?.numero) parts.push(parsed.numero);
  if (parsed?.bairro) parts.push(parsed.bairro);
  if (parsed?.cidade) parts.push(parsed.cidade);
  if (parsed?.estado) parts.push(parsed.estado);
  if (parsed?.cep) parts.push(`CEP: ${parsed.cep}`);
  
  return parts.length > 0 ? parts.join(", ") : "Não informado";
}

export default async function AtendimentoDetailPage({ params }: PageProps) {
  const atendimentoId = params.id;

  // Busca dados em paralelo
  const [atendimentoResult, tramitacoesResult, setoresResult] = await Promise.all([
    getAtendimentoDetails(atendimentoId),
    getTramitacoes(atendimentoId),
    getSetores(),
  ]);

  // Verifica se o atendimento foi encontrado
  if (!atendimentoResult.success || !atendimentoResult.data) {
    notFound();
  }

  const atendimento = atendimentoResult.data;
  const tramitacoes = tramitacoesResult.success ? tramitacoesResult.data : [];
  const setores = setoresResult.success ? setoresResult.data : [];

  const beneficiaria = atendimento.beneficiaria;
  const contato = getContatoInfo(beneficiaria?.contato);
  const endereco = getEnderecoInfo(beneficiaria?.endereco);

  // Função para obter cor do badge de prioridade
  const getPrioridadeBadgeStyle = () => {
    if (!atendimento.prioridade_id?.cor) return {};
    return {
      backgroundColor: atendimento.prioridade_id.cor,
      color: "white",
      border: "transparent",
    };
  };

  // Função para obter variant do badge de status
  const getStatusBadgeVariant = (): "secondary" | "warning" | "success" | "default" => {
    const status = atendimento.status?.toLowerCase();
    if (status === "concluído" || status === "concluido") return "success";
    if (status === "em andamento") return "warning";
    if (status === "arquivado") return "secondary";
    return "default";
  };

  return (
    <div className="space-y-6">
      {/* Botão Voltar */}
      <Link href="/mulheres/atendimentos">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Atendimentos
        </Button>
      </Link>

      {/* Header: Resumo do Caso */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">
                Detalhes do Atendimento #{atendimento.id}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Cadastrado em {formatDate(atendimento.data_abertura)}
              </p>
            </div>
            <div className="flex gap-2">
              {atendimento.prioridade_id && (
                <Badge style={getPrioridadeBadgeStyle()}>
                  {atendimento.prioridade_id.nome}
                </Badge>
              )}
              {atendimento.status && (
                <Badge variant={getStatusBadgeVariant()}>
                  {atendimento.status}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Dados da Beneficiária */}
            {beneficiaria && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Beneficiária
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nome Completo</p>
                    <p className="text-base font-medium">{beneficiaria.nome_completo}</p>
                  </div>
                  {beneficiaria.cpf && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">CPF</p>
                      <p className="text-base">{formatCPF(beneficiaria.cpf)}</p>
                    </div>
                  )}
                </div>

                <Separator className="my-4" />

                {/* Contato */}
                {(contato.telefone || contato.email) && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Contato</p>
                    <div className="flex flex-wrap gap-4">
                      {contato.telefone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{contato.telefone}</span>
                        </div>
                      )}
                      {contato.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{contato.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Endereço */}
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Endereço</p>
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span>{endereco}</span>
                  </div>
                </div>
              </div>
            )}

            <Separator />

            {/* Informações do Atendimento */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Informações do Atendimento
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {atendimento.origem_id && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Origem</p>
                    <p className="text-base">{atendimento.origem_id.nome}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Data de Abertura</p>
                  <p className="text-base">{formatDate(atendimento.data_abertura)}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Componente de Tramitações */}
      <TramitacoesClient
        atendimentoId={Number(atendimentoId)}
        initialTramitacoes={tramitacoes}
        setores={setores}
      />
    </div>
  );
}