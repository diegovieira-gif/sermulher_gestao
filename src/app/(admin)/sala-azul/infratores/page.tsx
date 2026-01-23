import { getInfratores, getOptions } from "./actions";
import { InfratoresClient } from "./infratores-client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InfratoresPage() {
  // Busca paralela de dados e opções
  const [infratoresResult, optionsResult] = await Promise.all([
    getInfratores(),
    getOptions(), // Nome correto da função
  ]);

  // Tratamento de Erro na busca principal
  if (!infratoresResult.success) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar dados</AlertTitle>
          <AlertDescription>
            {infratoresResult.error ||
              "Não foi possível carregar a lista de infratores."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Fallback seguro para as opções
  const options = optionsResult.data || {
    niveis: [],
    statusLegal: [],
    tiposAgressao: [],
  };

  return (
    <div className="p-6 bg-gray-50/50 min-h-screen">
      <div className="max-w-[1600px] mx-auto">
        <InfratoresClient
          initialData={infratoresResult.data || []}
          niveis={options.niveis || []}
          statusLegais={options.statusLegal || []}
        />
      </div>
    </div>
  );
}
