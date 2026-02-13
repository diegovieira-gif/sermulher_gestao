import { getBeneficiarias, getBeneficiariaFormOptions } from "./actions";
import { BeneficiariasClient } from "./beneficiarias-client";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    q?: string;
    limit?: string;
  }>;
}

export default async function BeneficiariasPage({ searchParams }: PageProps) {
  // Aguarda os params (obrigatório no Next.js 15)
  const params = await searchParams;
  const page = Number(params?.page) || 1;
  const search = params?.q || "";
  const limit = Number(params?.limit) || 10;

  // Busca dados com paginação e busca
  const [result, formOptionsResult] = await Promise.all([
    getBeneficiarias(page, search, limit),
    getBeneficiariaFormOptions(),
  ]);

  if (!result.success) {
    return (
      <div className="p-8 text-center text-red-500">
        Erro ao carregar dados: {result.error}
      </div>
    );
  }

  const formOptions = formOptionsResult.success ? formOptionsResult.data : null;

  return (
    <div className="space-y-6">
      <BeneficiariasClient
        initialData={Array.isArray(result.data) ? result.data : []}
        meta={result.meta || { total: 0, page: 1, limit: 10, totalPages: 1 }}
        formOptions={formOptions}
      />
    </div>
  );
}
