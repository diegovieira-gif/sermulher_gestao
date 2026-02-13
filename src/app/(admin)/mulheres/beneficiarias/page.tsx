import { getBeneficiarias, getBeneficiariaFormOptions } from "./actions";
import { BeneficiariasClient } from "./beneficiarias-client";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    q?: string;
  }>;
}

export default async function BeneficiariasPage({ searchParams }: PageProps) {
  // Aguarda os params (obrigatório no Next.js 15)
  const params = await searchParams;
  const page = Number(params?.page) || 1;
  const search = params?.q || "";

  // Busca dados (sem paginação por enquanto, conforme novo actions.ts) e opções
  const [result, formOptionsResult] = await Promise.all([
    getBeneficiarias(),
    getBeneficiariaFormOptions(),
  ]);

  if (!result.success) {
    return (
      <div className="p-8 text-center text-red-500">
        Erro ao carregar dados: {result.error}
      </div>
    );
  }

  // Como a nova action não retorna meta, criamos um dummy ou calculamos
  // Isso desabilita a paginação real por enquanto
  const totalItems = Array.isArray(result.data) ? result.data.length : 0;
  const meta = {
    total: totalItems,
    page: 1,
    limit: totalItems > 0 ? totalItems : 10,
    totalPages: 1,
  };

  const formOptions = formOptionsResult.success ? formOptionsResult.data : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Beneficiárias</h1>
          <p className="text-muted-foreground">
            Gerencie o cadastro de beneficiárias e seus dependentes.
          </p>
        </div>
      </div>

      <BeneficiariasClient
        initialData={Array.isArray(result.data) ? result.data : []}
        meta={meta}
        formOptions={formOptions}
      />
    </div>
  );
}
