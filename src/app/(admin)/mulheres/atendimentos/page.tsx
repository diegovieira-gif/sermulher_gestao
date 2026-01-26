import { getAtendimentos, getFormOptions } from "./actions";
import { AtendimentosClient } from "./atendimentos-client";

export const dynamic = "force-dynamic";

export default async function AtendimentosPage() {
  const [atendimentosResult, optionsResult] = await Promise.all([
    getAtendimentos(),
    getFormOptions(),
  ]);

  if (!atendimentosResult.success) {
    return (
      <div className="p-6">
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded">
          {atendimentosResult.error}
        </div>
      </div>
    );
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
      <AtendimentosClient
        atendimentos={atendimentosResult.data || []}
        beneficiariasOptions={optionsResult.data?.beneficiarias || []}
        origensOptions={optionsResult.data?.origens || []}
        prioridadesOptions={optionsResult.data?.prioridades || []}
        encaminhamentosOptions={optionsResult.data?.encaminhamentos || []}
        tiposViolenciaOptions={optionsResult.data?.tiposViolencia || []}
      />
    </div>
  );
}
