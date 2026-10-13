import { NextResponse } from "next/server";
import { paginaHub } from "@/lib/hub-dados";
import {
  carregarElegiveisHub,
  registrarConsultaHub,
  respostaDeAutenticacao,
} from "@/lib/hub-dados-servidor";

/**
 * Hub de Dados Municipais — uma página de cidadãs (começa em 1).
 * Contrato e regras de minimização em src/lib/hub-dados.ts.
 */
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ pagina: string }> },
) {
  const { pagina: bruto } = await params;
  const rota = `pagina ${String(bruto).slice(0, 12)}`;
  const negado = respostaDeAutenticacao(request);
  if (negado) {
    registrarConsultaHub(request, { rota, status: negado.status });
    return negado;
  }
  // Só inteiro positivo; qualquer outra coisa é página inexistente.
  const pagina = /^\d{1,7}$/.test(bruto) ? Number(bruto) : NaN;
  try {
    const corpo = paginaHub(await carregarElegiveisHub(), pagina);
    registrarConsultaHub(request, { rota, status: 200, qtd: corpo.qtd });
    return NextResponse.json(corpo);
  } catch (error) {
    console.error("[hub-dados] página falhou:", error);
    registrarConsultaHub(request, { rota, status: 503, erro: "directus" });
    return NextResponse.json(
      { status: "failed", message: "Fonte temporariamente indisponível." },
      { status: 503 },
    );
  }
}
