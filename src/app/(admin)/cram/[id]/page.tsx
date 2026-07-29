import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { getFormOptions, getInstrumental, getPiaPorAtendimento } from "../actions";
import { CramForm } from "../cram-form";
import { PiaPanel } from "./pia-panel";
import { paraFormulario } from "./mapear";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const dynamic = "force-dynamic";

export default async function InstrumentalDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const atendimentoId = Number(id);
  if (!Number.isFinite(atendimentoId) || atendimentoId <= 0) notFound();

  const [registro, opcoes, pia] = await Promise.all([
    getInstrumental(atendimentoId),
    getFormOptions(),
    getPiaPorAtendimento(atendimentoId),
  ]);

  if (!registro.success || !registro.data) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Atendimento não encontrado</AlertTitle>
          <AlertDescription>
            {registro.error || "O instrumental solicitado não existe."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const dados = registro.data as Record<string, unknown>;
  const beneficiaria = dados.beneficiaria as
    | { id: number; nome_completo?: string }
    | number
    | null;
  const nomeAssistida =
    typeof beneficiaria === "object" && beneficiaria !== null
      ? (beneficiaria.nome_completo ?? "Assistida")
      : "Assistida";

  const beneficiariaId =
    typeof beneficiaria === "object" && beneficiaria !== null
      ? beneficiaria.id
      : Number(beneficiaria ?? 0);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <PageHeader
        title={nomeAssistida}
        description="Instrumental de Atendimento do CRAM e Plano Individual de Atendimento."
        actions={
          <Button asChild variant="outline">
            <Link href="/cram">
              <ArrowLeft className="mr-2 size-4" />
              Voltar
            </Link>
          </Button>
        }
      />

      <div className="mx-auto max-w-[1200px] p-6">
        <Tabs defaultValue="instrumental">
          <TabsList>
            <TabsTrigger value="instrumental">Instrumental</TabsTrigger>
            <TabsTrigger value="pia">Plano Individual (PIA)</TabsTrigger>
          </TabsList>

          <TabsContent value="instrumental" className="pt-4">
            <CramForm
              beneficiarias={opcoes.beneficiarias}
              ubs={opcoes.ubs}
              valoresIniciais={paraFormulario(dados)}
            />
          </TabsContent>

          <TabsContent value="pia" className="pt-4">
            <PiaPanel
              atendimentoId={atendimentoId}
              beneficiariaId={beneficiariaId}
              piaInicial={
                pia.success && pia.data ? (pia.data as Record<string, unknown>) : null
              }
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
