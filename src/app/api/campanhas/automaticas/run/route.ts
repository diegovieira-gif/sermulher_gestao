import { NextResponse } from "next/server";
import { runDueAutomaticCampaigns } from "@/app/(admin)/marketing/whatsapp/actions";

// Rota acionada pelo agendador (cron do n8n) para executar as campanhas
// automáticas devidas no horário atual.
//
// Proteção: exige o cabeçalho `x-cron-secret` igual a process.env.CRON_SECRET.
// Nunca exponha esta rota sem o segredo configurado.
export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // sem segredo configurado => recusa por segurança
  const provided =
    request.headers.get("x-cron-secret") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    "";
  return provided === secret;
}

async function handle(request: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { success: false, error: "CRON_SECRET não configurado no servidor." },
      { status: 503 },
    );
  }
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: "Não autorizado." },
      { status: 401 },
    );
  }

  const result = await runDueAutomaticCampaigns();
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}

export async function POST(request: Request) {
  return handle(request);
}

// GET permitido para facilitar testes/uso por agendadores que só fazem GET.
export async function GET(request: Request) {
  return handle(request);
}
