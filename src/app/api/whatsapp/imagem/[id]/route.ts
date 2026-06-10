import { NextRequest, NextResponse } from "next/server";

// Proxy autenticado para a imagem de uma campanha (directus_files), usado apenas
// para PREVIEW no painel. O token admin fica no servidor; o navegador nunca o vê.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const directusBase = (
      process.env.NEXT_PUBLIC_DIRECTUS_URL ||
      process.env.DIRECTUS_API_URL ||
      "http://192.168.0.118:8055"
    ).replace(/\/$/, "");
    const token = process.env.DIRECTUS_TOKEN || "";

    const res = await fetch(`${directusBase}/assets/${id}`, {
      headers: { Authorization: `Bearer ${token}`, "cache-control": "no-store" },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Imagem não encontrada ou sem permissão" },
        { status: res.status },
      );
    }

    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": res.headers.get("content-type") || "image/jpeg",
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    console.error("[Proxy imagem campanha] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao carregar a imagem" },
      { status: 500 },
    );
  }
}
