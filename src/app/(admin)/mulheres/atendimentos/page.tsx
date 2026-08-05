import { getAtendimentos, getFormOptions } from "./actions";
import { AtendimentosClient } from "./atendimentos-client";

export const dynamic = "force-dynamic";

const toId = (value?: string) => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : undefined;
};

export default async function AtendimentosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;

  const [atendimentosResult, optionsResult] = await Promise.all([
    getAtendimentos({
      page: toId(sp.page) ?? 1,
      status: sp.status,
      origemId: toId(sp.origem),
      prioridadeId: toId(sp.prioridade),
      encaminhamentoId: toId(sp.encaminhamento),
      tipoViolenciaId: toId(sp.violencia),
    }),
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
        meta={atendimentosResult.meta}
        beneficiariasOptions={optionsResult.data?.beneficiarias || []}
        origensOptions={optionsResult.data?.origens || []}
        prioridadesOptions={optionsResult.data?.prioridades || []}
        encaminhamentosOptions={optionsResult.data?.encaminhamentos || []}
        tiposViolenciaOptions={optionsResult.data?.tiposViolencia || []}
      />
    </div>
  );
}
