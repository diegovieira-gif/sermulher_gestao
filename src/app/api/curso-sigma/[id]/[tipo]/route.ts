import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { directusAdminConfig } from "@/lib/directus";

/**
 * Vídeo e capa das aulas do Curso Sigma.
 *
 * Os arquivos ficam na biblioteca do Directus, que nenhum perfil lê direto:
 * esta rota confere a sessão, aceita só arquivo de aula PUBLICADA (o id vem da
 * aula, nunca do arquivo — não serve para baixar outro anexo) e repassa o
 * cabeçalho Range, para o player conseguir pular para qualquer ponto.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; tipo: string }> },
) {
  const { id, tipo } = await params;
  if (!/^\d+$/.test(id) || (tipo !== "video" && tipo !== "capa")) {
    return NextResponse.json({ error: "Endereço inválido" }, { status: 404 });
  }

  const token = (await cookies()).get("directus_token")?.value;
  if (!token) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { url, token: admin } = directusAdminConfig();
  try {
    // a sessão precisa ser válida, não basta existir o cookie
    const eu = await fetch(`${url}/users/me?fields=id`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!eu.ok) return NextResponse.json({ error: "Sessão expirada" }, { status: 401 });

    const filtro = encodeURIComponent(
      JSON.stringify({ _and: [{ id: { _eq: Number(id) } }, { publicada: { _eq: true } }] }),
    );
    const r = await fetch(`${url}/items/curso_sigma_aulas?fields=video,capa&limit=1&filter=${filtro}`, {
      headers: { Authorization: `Bearer ${admin}` },
      cache: "no-store",
    });
    const arquivo = r.ok ? ((await r.json()).data?.[0]?.[tipo] as string | null) : null;
    if (!arquivo) return NextResponse.json({ error: "Aula não encontrada" }, { status: 404 });

    const range = request.headers.get("range");
    const upstream = await fetch(`${url}/assets/${encodeURIComponent(arquivo)}`, {
      headers: { Authorization: `Bearer ${admin}`, ...(range ? { Range: range } : {}) },
      cache: "no-store",
    });
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: "Arquivo indisponível" }, { status: upstream.status || 502 });
    }

    const headers = new Headers();
    for (const h of ["content-type", "content-length", "content-range", "accept-ranges", "etag", "last-modified"]) {
      const v = upstream.headers.get(h);
      if (v) headers.set(h, v);
    }
    if (!headers.has("accept-ranges")) headers.set("accept-ranges", "bytes");
    headers.set("Cache-Control", "private, max-age=3600");
    headers.set("Content-Disposition", "inline");

    return new NextResponse(upstream.body, { status: upstream.status, headers });
  } catch (error) {
    console.error("[Curso Sigma] erro ao servir arquivo:", error);
    return NextResponse.json({ error: "Erro ao carregar o arquivo" }, { status: 502 });
  }
}
