import { getAtendimentos, getBeneficiariasOptions, getOptions } from "./actions";
import { AtendimentosClient } from "./atendimentos-client";

export default async function AtendimentosPage() {
  const [atendimentosResult, beneficiariasOptionsResult, optionsResult] =
    await Promise.all([
      getAtendimentos(),
      getBeneficiariasOptions(),
      getOptions(),
    ]);

  if (!atendimentosResult.success) {
    const message = atendimentosResult.error;

    return (
      <div className="p-6">
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded">
          {message || "Erro ao carregar atendimentos. Tente novamente."}
        </div>
      </div>
    );
  }

  if (!beneficiariasOptionsResult.success) {
    const message = beneficiariasOptionsResult.error;

    return (
      <div className="p-6">
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded">
          {message || "Erro ao carregar atendimentos. Tente novamente."}
        </div>
      </div>
    );
  }

  if (!optionsResult.success) {
    const message = optionsResult.error;

    return (
      <div className="p-6">
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded">
          {message || "Erro ao carregar opções. Tente novamente."}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <AtendimentosClient
        atendimentos={atendimentosResult.data || []}
        beneficiariasOptions={beneficiariasOptionsResult.data || []}
        origensOptions={optionsResult.data.origens || []}
        prioridadesOptions={optionsResult.data.prioridades || []}
      />
    </div>
  );
}

