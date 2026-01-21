import { getInfratorById, getInfratorHistory } from "./actions";
import { InfratorDetailsClient } from "./infrator-details-client";
import { notFound } from "next/navigation";
import { getOptions } from "../actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function InfratorDetailsPage({ params }: PageProps) {
  const { id } = await params;
  const infratorId = parseInt(id, 10);

  if (isNaN(infratorId)) {
    notFound();
  }

  const [infratorResult, historicoResult, optionsResult] = await Promise.all([
    getInfratorById(infratorId),
    getInfratorHistory(infratorId),
    getOptions(),
  ]);

  if (!infratorResult.success || !infratorResult.data) {
    notFound();
  }

  if (!optionsResult.success) {
    return (
      <div className="p-6">
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded">
          {optionsResult.error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <InfratorDetailsClient
        infrator={infratorResult.data}
        historico={historicoResult.success ? historicoResult.data : []}
        options={(optionsResult.data as any) || { niveis: [], statusLegal: [], tiposAgressao: [] }}
      />
    </div>
  );
}
