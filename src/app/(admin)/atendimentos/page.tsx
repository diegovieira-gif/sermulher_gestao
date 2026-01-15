import { getAtendimentos, getBeneficiariasOptions } from "./actions";
import { AtendimentosClient } from "./atendimentos-client";

export default async function AtendimentosPage() {
  const [atendimentosResult, beneficiariasOptionsResult] = await Promise.all([
    getAtendimentos(),
    getBeneficiariasOptions(),
  ]);

  if (!atendimentosResult.success || !beneficiariasOptionsResult.success) {
    const message =
      atendimentosResult.success === false
        ? atendimentosResult.error
        : beneficiariasOptionsResult.error;

    return (
      <div className="p-6">
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded">
          {message || "Erro ao carregar atendimentos. Tente novamente."}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <AtendimentosClient
        atendimentos={atendimentosResult.data || []}
        beneficiariasOptions={beneficiariasOptionsResult.data || []}
      />
    </div>
  );
}

