import { getSalas, getOptions } from "./actions";
import { SalasClient } from "./salas-client";

export default async function CiclosPage() {
  // Busca salas e opções simultaneamente usando Promise.all
  const [salasResult, optionsResult] = await Promise.all([
    getSalas(),
    getOptions(),
  ]);

  if (!salasResult.success) {
    return (
      <div className="p-6">
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded">
          {salasResult.error}
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
      <SalasClient
        salas={salasResult.data || []}
        locais={(optionsResult.data?.locais as any) || []}
        responsaveis={(optionsResult.data?.responsaveis as any) || []}
      />
    </div>
  );
}
