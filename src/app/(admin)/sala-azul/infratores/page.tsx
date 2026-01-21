import { getInfratores, getOptions } from "./actions";
import { InfratoresClient } from "./infratores-client";

export default async function InfratoresPage() {
  const [infratoresResult, optionsResult] = await Promise.all([
    getInfratores(),
    getOptions(),
  ]);

  if (!infratoresResult.success) {
    return (
      <div className="p-6">
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded">
          {infratoresResult.error}
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
      <InfratoresClient
        infratores={infratoresResult.data || []}
        options={(optionsResult.data as any) || { niveis: [], statusLegal: [], tiposAgressao: [] }}
      />
    </div>
  );
}
