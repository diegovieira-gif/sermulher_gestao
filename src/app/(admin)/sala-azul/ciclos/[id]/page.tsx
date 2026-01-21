import { notFound } from "next/navigation";
import { getSalaDetails, getInfratoresDisponiveis, getSessoes } from "./actions";
import { ParticipantesClient } from "./participantes-client";
import { SessoesClient } from "./sessoes-client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ParticipantesPage({ params }: PageProps) {
  const { id } = await params;

  // Busca dados da sala e participantes
  const salaResult = await getSalaDetails(id);

  if (!salaResult.success) {
    return (
      <div className="p-6">
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded">
          {salaResult.error}
        </div>
      </div>
    );
  }

  if (!salaResult.data?.sala) {
    notFound();
  }

  // Busca infratores disponíveis para adicionar
  const infratoresResult = await getInfratoresDisponiveis(
    salaResult.data.sala.id
  );

  // Busca sessões do ciclo
  const sessoesResult = await getSessoes(salaResult.data.sala.id);

  return (
    <div className="p-6">
      <Tabs defaultValue="participantes" className="w-full">
        <TabsList>
          <TabsTrigger value="participantes">Participantes</TabsTrigger>
          <TabsTrigger value="sessoes">Sessões</TabsTrigger>
        </TabsList>
        <TabsContent value="participantes">
          <ParticipantesClient
            sala={salaResult.data.sala as any}
            participacoes={(salaResult.data.participacoes as any) || []}
            infratoresDisponiveis={
              infratoresResult.success ? (infratoresResult.data as any) || [] : []
            }
          />
        </TabsContent>
        <TabsContent value="sessoes">
          <SessoesClient
            salaId={salaResult.data.sala.id}
            sessoes={
              sessoesResult.success ? (sessoesResult.data as any) || [] : []
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
