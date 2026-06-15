import { getAuditLogs, getCollectionsList } from "./actions";
import { AuditoriaClient } from "./auditoria-client";

export const dynamic = "force-dynamic";

export default async function AuditoriaPage() {
  // Chamada paralela no servidor para carregar dados iniciais de auditoria e lista de coleções
  const [logsResult, collectionsResult] = await Promise.all([
    getAuditLogs({ page: 1, limit: 20 }),
    getCollectionsList(),
  ]);

  const initialLogs = logsResult.success ? logsResult.data : [];
  const initialMeta = logsResult.success
    ? logsResult.meta
    : { filter_count: 0, total_count: 0 };
  const collections = collectionsResult.success ? collectionsResult.data : [];

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 md:p-10 animate-in fade-in duration-500">
      <AuditoriaClient
        initialLogs={initialLogs}
        initialMeta={initialMeta}
        collections={collections}
      />
    </div>
  );
}
