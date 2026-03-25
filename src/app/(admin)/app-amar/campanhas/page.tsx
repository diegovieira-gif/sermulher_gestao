import { getCampanhas } from "../actions";
import { CampanhasClient } from "./campanhas-client";

export const metadata = {
  title: "Campanhas - App Amar",
};

export default async function CampanhasPage() {
  const campanhas = await getCampanhas();

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Gerenciar Campanhas</h2>
      </div>
      <CampanhasClient initialData={campanhas as any[]} />
    </div>
  );
}
