import { getServicos, getCategorias } from "../actions";
import { ServicosClient } from "./servicos-client";

export const metadata = {
  title: "Vínculo de Serviços - App Amar",
};

export default async function ServicosPage() {
  const [servicos, categorias] = await Promise.all([
    getServicos(),
    getCategorias(),
  ]);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Gerenciar Serviços</h2>
      </div>
      <ServicosClient initialData={servicos as any[]} categorias={categorias as any[]} />
    </div>
  );
}
