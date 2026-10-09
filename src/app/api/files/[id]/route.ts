import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { cabecalhosDeArquivo } from "@/lib/arquivo-seguro";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Autenticação obrigatória: o arquivo só é servido para quem tem sessão.
    const cookieStore = await cookies();
    const userToken = cookieStore.get("directus_token")?.value;
    if (!userToken) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 },
      );
    }

    const directusUrl =
      process.env.NEXT_PUBLIC_DIRECTUS_URL || "http://192.168.0.118:8055";

    // O conteúdo binário do arquivo fica em /assets/{id} (NÃO em /files/{id},
    // que devolve apenas os metadados em JSON). O parâmetro ?download faz o
    // Directus marcar o anexo como download (Content-Disposition: attachment).
    const isDownload = request.nextUrl.searchParams.has("download");
    const assetUrl = `${directusUrl}/assets/${id}${isDownload ? "?download" : ""}`;

    // Busca com o token do PRÓPRIO usuário: o Directus aplica as permissões
    // do perfil (evita IDOR com privilégio de admin).
    const upstream = await fetch(assetUrl, {
      headers: { Authorization: `Bearer ${userToken}` },
      cache: "no-store",
    });

    if (!upstream.ok || !upstream.body) {
      const detail = await upstream.text().catch(() => "");
      console.error("[API Proxy] Erro:", upstream.status, detail);
      return NextResponse.json(
        { error: "Arquivo não encontrado ou sem permissão" },
        { status: upstream.status || 404 },
      );
    }

    // Repassa o tipo e a disposição vindos do Directus (preserva o nome real do
    // arquivo). Faz streaming do corpo, sem carregar tudo em memória.
    // SVG/HTML nunca vão inline (XSS na origem do app): ver cabecalhosDeArquivo.
    const headers = cabecalhosDeArquivo(
      upstream.headers.get("content-type"),
      upstream.headers.get("content-disposition"),
    );
    const length = upstream.headers.get("content-length");
    if (length) headers.set("Content-Length", length);
    headers.set("Cache-Control", "private, max-age=3600");

    return new NextResponse(upstream.body, { status: 200, headers });
  } catch (error) {
    console.error("[API Proxy] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao fazer download do arquivo" },
      { status: 500 },
    );
  }
}
