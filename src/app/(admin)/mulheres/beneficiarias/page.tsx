import { getBeneficiarias } from "./actions";
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

  // Busca dados paginados
  const result = await getBeneficiarias(page, search);

  if (!result.success) {
    return (
      <div className="p-6">
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded">
          {result.error || "Erro ao carregar dados."}
        </div>
      </div>
    );
  }

  // Prepara o objeto meta padrão caso venha vazio
  const meta = result.meta || { total: 0, page: 1, limit: 10, totalPages: 1 };

  return (
    <div className="p-6">
      <BeneficiariasClient
        beneficiarias={result.data || []}
        meta={meta}
        searchParams={{ page, q: search }}
      />
    </div>
  );
}
