import { getMyProfile } from "./actions";
import { getAuditLogs } from "../auditoria/actions";
import { PerfilClient } from "./perfil-client";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const profileResult = await getMyProfile();

  if (!profileResult.success) {
    return (
      <div className="p-8 text-center text-red-500">
        Erro ao carregar perfil: {profileResult.error}
      </div>
    );
  }

  const perfil = profileResult.data;
  const auditResult = await getAuditLogs({ user: perfil.id, page: 1, limit: 15 });

  return (
    <PerfilClient
      perfil={perfil}
      initialLogs={auditResult.success ? auditResult.data : []}
      initialMeta={auditResult.meta}
    />
  );
}
