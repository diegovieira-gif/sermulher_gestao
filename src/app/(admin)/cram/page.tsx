import Link from "next/link";
import { AlertCircle, Plus } from "lucide-react";
import { getInstrumentais } from "./actions";
import { CramClient } from "./cram-client";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const dynamic = "force-dynamic";

export default async function CramPage() {
  const resultado = await getInstrumentais();

  return (
    <div className="min-h-screen bg-gray-50/50">
      <PageHeader
        title="CRAM — Instrumentais de Atendimento"
        description="Centro de Referência de Atendimento à Mulher em Situação de Violência. Registro do Instrumental de Atendimento: busca pelo serviço, contexto socioassistencial, jurídico e psicológico."
        actions={
          <Button asChild>
            <Link href="/cram/novo">
              <Plus className="mr-2 size-4" />
              Novo Atendimento
            </Link>
          </Button>
        }
      />

      <div className="mx-auto max-w-[1600px] p-6">
        {resultado.success ? (
          <CramClient initialData={resultado.data ?? []} />
        ) : (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Erro ao carregar dados</AlertTitle>
            <AlertDescription>
              {resultado.error || "Não foi possível carregar os atendimentos."}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
