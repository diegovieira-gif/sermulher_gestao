import { getFormOptions } from "../actions";
import { CramForm } from "../cram-form";
import { PageHeader } from "@/components/layout/PageHeader";

export const dynamic = "force-dynamic";

export default async function NovoInstrumentalPage({
  searchParams,
}: {
  searchParams: Promise<{ beneficiaria?: string }>;
}) {
  const [{ beneficiarias, ubs }, params] = await Promise.all([
    getFormOptions(),
    searchParams,
  ]);

  const beneficiariaInicial = Number(params?.beneficiaria);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <PageHeader
        title="Novo Instrumental de Atendimento"
        description="CRAM — Centro de Referência de Atendimento à Mulher em Situação de Violência."
      />
      <div className="mx-auto max-w-[1200px] p-6">
        <CramForm
          beneficiarias={beneficiarias}
          ubs={ubs}
          beneficiariaInicial={
            Number.isFinite(beneficiariaInicial) && beneficiariaInicial > 0
              ? beneficiariaInicial
              : undefined
          }
        />
      </div>
    </div>
  );
}
