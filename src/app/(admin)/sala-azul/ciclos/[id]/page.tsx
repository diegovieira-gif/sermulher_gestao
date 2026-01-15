import { notFound } from "next/navigation";
import { getSalaDetails, getInfratoresDisponiveis } from "./actions";
import { ParticipantesClient } from "./participantes-client";

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

  return (
    <div className="p-6">
      <ParticipantesClient
        sala={salaResult.data.sala}
        participacoes={salaResult.data.participacoes || []}
        infratoresDisponiveis={
          infratoresResult.success ? infratoresResult.data || [] : []
        }
      />
    </div>
  );
}
