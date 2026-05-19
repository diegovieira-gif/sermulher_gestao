import { PageHeader } from "@/components/layout/PageHeader";
import { getPropostas, getSiteConfig } from "./actions";
import { SiteManagementClient } from "./site-management-client";

export const dynamic = "force-dynamic";

export default async function SiteSettingsPage() {
  const [siteConfigResult, propostasResult] = await Promise.all([
    getSiteConfig(),
    getPropostas(),
  ]);

  const siteConfig = siteConfigResult.success ? siteConfigResult.data : null;
  const propostas = propostasResult.success ? propostasResult.data : [];

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHeader
        title="Gestão do Site"
        description="Edite o conteúdo público do site institucional diretamente no CRM."
      />

      <main className="px-6 py-6">
        <SiteManagementClient
          initialConfig={siteConfig}
          initialPropostas={propostas}
        />
      </main>
    </div>
  );
}