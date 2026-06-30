import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Phone, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BeneficiosTab } from "./beneficios-tab";
import { EventosTab } from "./eventos-tab";
import { CursosTab } from "./cursos-tab";
import {
  getBeneficiaria,
  getHistoricoBeneficios,
  getParticipacoesEvento,
  getEventosOptions,
  getInscricoesCurso,
  getCursosOptions,
} from "../actions";
import { getAuxItems } from "../../../configuracoes/actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BeneficiariaDetalhePage({ params }: PageProps) {
  const { id } = await params;
  const beneficiariaId = Number(id);

  if (Number.isNaN(beneficiariaId)) {
    return notFound();
  }

  const [
    beneficiariaResult,
    historicoResult,
    beneficiosResult,
    participacoesEventoResult,
    eventosOptionsResult,
    inscricoesCursoResult,
    cursosOptionsResult,
  ] = await Promise.all([
    getBeneficiaria(beneficiariaId),
    getHistoricoBeneficios(String(beneficiariaId)),
    getAuxItems("config_beneficios"),
    getParticipacoesEvento(String(beneficiariaId)),
    getEventosOptions(),
    getInscricoesCurso(String(beneficiariaId)),
    getCursosOptions(),
  ]);

  if (!beneficiariaResult.success || !beneficiariaResult.data) {
    return notFound();
  }

  const beneficiaria = beneficiariaResult.data;
  const historico = historicoResult.success && historicoResult.data ? historicoResult.data : [];
  const beneficios = beneficiosResult.success && beneficiosResult.data ? beneficiosResult.data : [];
  const participacoesEvento =
    participacoesEventoResult.success && participacoesEventoResult.data ? participacoesEventoResult.data : [];
  const eventosOptions =
    eventosOptionsResult.success && eventosOptionsResult.data ? eventosOptionsResult.data : [];
  const inscricoesCurso =
    inscricoesCursoResult.success && inscricoesCursoResult.data ? inscricoesCursoResult.data : [];
  const cursosOptions =
    cursosOptionsResult.success && cursosOptionsResult.data ? cursosOptionsResult.data : [];

  const contato = typeof beneficiaria.contato === "string"
    ? safeJsonParse(beneficiaria.contato, {})
    : beneficiaria.contato || {};

  const endereco = typeof beneficiaria.endereco === "string"
    ? safeJsonParse(beneficiaria.endereco, {})
    : beneficiaria.endereco || {};

  const enderecoFormatado = endereco.logradouro
    ? `${endereco.logradouro}, ${endereco.numero} - ${endereco.bairro || ""}`
    : "Endereço não informado";

  return (
    <div className="space-y-6 p-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/mulheres/beneficiarias" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <p className="text-sm text-muted-foreground">Beneficiária</p>
            <h1 className="text-2xl font-bold leading-tight">{beneficiaria.nome_completo}</h1>
          </div>
        </div>
        {beneficiaria.cpf ? (
          <Badge variant="outline" className="font-mono">
            CPF: {beneficiaria.cpf}
          </Badge>
        ) : null}
      </header>

      <Tabs defaultValue="dados" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="beneficios">Benefícios</TabsTrigger>
          <TabsTrigger value="eventos">Eventos</TabsTrigger>
          <TabsTrigger value="cursos">Cursos</TabsTrigger>
        </TabsList>

        <TabsContent value="dados" className="space-y-4">
          <Card>
            <CardContent className="p-6 grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contato</p>
                  <p className="font-medium text-foreground">{beneficiaria.telefone || "Não informado"}</p>
                  {beneficiaria.email && (
                    <p className="text-sm text-muted-foreground">{beneficiaria.email}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Endereço</p>
                  <p className="font-medium text-foreground">{enderecoFormatado}</p>
                  {endereco.cidade && (
                    <p className="text-sm text-muted-foreground">{endereco.cidade}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="beneficios">
          <BeneficiosTab
            beneficiariaId={beneficiaria.id}
            beneficiariaNome={beneficiaria.nome_completo}
            beneficiosOptions={beneficios as any}
            historico={historico as any}
          />
        </TabsContent>

        <TabsContent value="eventos">
          <EventosTab
            beneficiariaId={beneficiaria.id}
            beneficiariaNome={beneficiaria.nome_completo}
            eventosOptions={eventosOptions as any}
            historico={participacoesEvento as any}
          />
        </TabsContent>

        <TabsContent value="cursos">
          <CursosTab
            beneficiariaId={beneficiaria.id}
            beneficiariaNome={beneficiaria.nome_completo}
            cursosOptions={cursosOptions as any}
            historico={inscricoesCurso as any}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function safeJsonParse(value: string, fallback: Record<string, unknown>) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}
