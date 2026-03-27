import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const directusUrl =
      process.env.NEXT_PUBLIC_DIRECTUS_URL || "http://192.168.0.115:8055";
    const directusToken = process.env.DIRECTUS_TOKEN || "";

    // URL do arquivo no Directus com token no header
    const fileUrl = `${directusUrl}/files/${id}`;

    console.log("[API Proxy] Fetching file:", fileUrl);

    // Fazer requisição com token de autenticação do servidor
    const response = await fetch(fileUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${directusToken}`,
        "cache-control": "no-store",
      },
    });

    if (!response.ok) {
      console.error(
        "[API Proxy] Erro:",
        response.status,
        await response.text(),
      );
      return NextResponse.json(
        { error: "Arquivo não encontrado ou sem permissão" },
        { status: response.status },
      );
    }

    // Obter o buffer do arquivo
    const buffer = await response.arrayBuffer();

    // Retornar como resposta com headers apropriados para download
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/webm",
        "Content-Disposition": `attachment; filename="sonho.webm"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[API Proxy] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao fazer download do arquivo" },
      { status: 500 },
    );
  }
}
