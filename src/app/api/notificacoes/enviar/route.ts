import { NextResponse } from "next/server";
import { enviarNotificacoesPendentes } from "@/lib/notificacoes-envio";
import { secureCompare } from "@/lib/secure-compare";

/**
 * Varredura da fila de notificações — acionada pelo agendador (cron do n8n).
 *
 * É o que faz o lembrete da véspera sair: avisos com `agendada_para` no futuro
 * ficam parados até vencerem, e esta rota entrega o que já venceu. Rodar de
 * hora em hora é suficiente; o registro por canal impede reenvio.
 *
 * Mesma proteção do disparo de campanhas: exige `x-cron-secret` igual a
 * CRON_SECRET, comparado em tempo constante.
 */
export const dynamic = "force-dynamic";

function autorizado(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const informado =
    request.headers.get("x-cron-secret") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    "";
  return secureCompare(informado, secret);
}

async function handle(request: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { success: false, error: "CRON_SECRET não configurado no servidor." },
      { status: 503 },
    );
  }
  if (!autorizado(request)) {
    return NextResponse.json(
      { success: false, error: "Não autorizado." },
      { status: 401 },
    );
  }

  try {
    const resultado = await enviarNotificacoesPendentes();
    return NextResponse.json({ success: true, ...resultado });
  } catch (error) {
    console.error("[notificacoes] varredura falhou:", error);
    return NextResponse.json(
      { success: false, error: "Falha ao processar a fila." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  return handle(request);
}

// GET permitido para agendadores que só fazem GET.
export async function GET(request: Request) {
  return handle(request);
}
