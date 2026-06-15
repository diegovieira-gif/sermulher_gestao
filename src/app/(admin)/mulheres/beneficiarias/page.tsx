import { getBeneficiarias, getBeneficiariaFormOptions, getBeneficiariasMetrics } from "./actions";
import { BeneficiariasClient } from "./beneficiarias-client";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    q?: string;
    limit?: string;
    medidaProtetiva?: string;
    bolsaFamilia?: string;
    bpc?: string;
    bairro?: string;
    sortField?: string;
    sortOrder?: string;
  }>;
}

export default async function BeneficiariasPage({ searchParams }: PageProps) {
  // Aguarda os params (obrigatório no Next.js 15)
  const params = await searchParams;
  const page = Number(params?.page) || 1;
  const search = params?.q || "";
  const limit = Number(params?.limit) || 10;

  const medidaProtetiva = params?.medidaProtetiva === "true";
  const bolsaFamilia = params?.bolsaFamilia === "true";
  const bpc = params?.bpc === "true";
  const bairro = params?.bairro || "";

  const sortField = params?.sortField || "created_at";
  const sortOrder = (params?.sortOrder as "asc" | "desc") || "desc";

  // Busca dados com paginação, busca, filtros e ordenação
  const [result, formOptionsResult, metricsResult] = await Promise.all([
    getBeneficiarias(page, search, limit, { medidaProtetiva, bolsaFamilia, bpc, bairro }, sortField, sortOrder),
    getBeneficiariaFormOptions(),
    getBeneficiariasMetrics(),
  ]);

  if (!result.success) {
    return (
      <div className="p-8 text-center text-red-500">
        Erro ao carregar dados: {result.error}
      </div>
    );
  }

  const formOptions = formOptionsResult.success ? formOptionsResult.data : null;
  const metrics = metricsResult.success ? metricsResult.data : { total: 0, medidaProtetiva: 0, bolsaFamilia: 0, bpc: 0, recentes: 0 };

  return (
    <div className="space-y-6">
      <BeneficiariasClient
        initialData={Array.isArray(result.data) ? result.data : []}
        meta={result.meta || { total: 0, page: 1, limit: 10, totalPages: 1 }}
        formOptions={formOptions}
        metrics={metrics}
      />
    </div>
  );
}
