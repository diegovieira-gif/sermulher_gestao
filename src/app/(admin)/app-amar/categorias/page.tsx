import { getCategorias } from "../actions";
import { CategoriasClient } from "./categorias-client";

export const metadata = {
  title: "Categorias - App Amar",
};

export default async function CategoriasPage() {
  const categorias = await getCategorias();

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Gerenciar Categorias</h2>
      </div>
      <CategoriasClient initialData={categorias as any[]} />
    </div>
  );
}
