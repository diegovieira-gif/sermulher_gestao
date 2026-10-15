import { listarFichasSemCpf } from "./actions";
import { LocalizarCpfClient } from "./localizar-cpf-client";
import { getCurrentAccess } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function LocalizarCpfPage() {
  // Só administradoras: cada busca fica na auditoria do Hub em nome da SERMULHER.
  const acesso = await getCurrentAccess();
  if (!acesso.isAdmin) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        A tela Localizar CPF é restrita a administradoras.
      </div>
    );
  }
  const res = await listarFichasSemCpf();
  if (!res.success) {
    return <div className="p-8 text-center text-red-500">{res.error}</div>;
  }
  return <LocalizarCpfClient fichasIniciais={res.data} />;
}
