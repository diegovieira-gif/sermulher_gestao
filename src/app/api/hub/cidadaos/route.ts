import { NextResponse } from "next/server";
import { contagemHub } from "@/lib/hub-dados";
import {
  carregarElegiveisHub,
  registrarConsultaHub,
  respostaDeAutenticacao,
} from "@/lib/hub-dados-servidor";

/**
 * Hub de Dados Municipais — contagem: quantas páginas existem.
 * Contrato e regras de minimização em src/lib/hub-dados.ts.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const negado = respostaDeAutenticacao(request);
  if (negado) {
    registrarConsultaHub(request, { rota: "contagem", status: negado.status });
    return negado;
  }
  try {
    const elegiveis = await carregarElegiveisHub();
    const corpo = contagemHub(elegiveis.length);
    registrarConsultaHub(request, { rota: "contagem", status: 200, qtd: corpo.qtd_usuarios });
    return NextResponse.json(corpo);
  } catch (error) {
    console.error("[hub-dados] contagem falhou:", error);
    registrarConsultaHub(request, { rota: "contagem", status: 503, erro: "directus" });
    return NextResponse.json(
      { status: "failed", message: "Fonte temporariamente indisponível." },
      { status: 503 },
    );
  }
}
