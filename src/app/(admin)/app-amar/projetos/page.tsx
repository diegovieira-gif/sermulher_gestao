import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProjetos } from "../actions";
import { ProjetosClient } from "@/app/(admin)/app-amar/projetos/projetos-client";

export const metadata = {
  title: "Projetos - App Amar",
};

export default async function ProjetosPage() {
  const projetos = await getProjetos();

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Gerenciar Projetos
        </h2>
        <Button variant="outline" asChild>
          <Link href="/app-amar">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>
      </div>
      <ProjetosClient initialData={projetos as any[]} />
    </div>
  );
}
