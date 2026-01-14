import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL;
    const directusToken = process.env.DIRECTUS_TOKEN;

    if (!directusUrl || !directusToken) {
      return NextResponse.json(
        {
          success: false,
          message: 'Variáveis de ambiente não configuradas',
          error: 'DIRECTUS_URL ou DIRECTUS_TOKEN não estão definidos'
        },
        { status: 500 }
      );
    }

    // Testa a conexão buscando informações do servidor
    const serverInfoResponse = await fetch(`${directusUrl}/server/info`);
    const serverInfo = await serverInfoResponse.json();

    // Testa autenticação buscando coleções (requer token válido)
    const collectionsResponse = await fetch(`${directusUrl}/collections`, {
      headers: {
        'Authorization': `Bearer ${directusToken}`
      }
    });
    const collections = await collectionsResponse.json();

    if (!collectionsResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          message: 'Token inválido ou sem permissões',
          error: collections.errors?.[0]?.message || 'Erro de autenticação'
        },
        { status: 401 }
      );
    }

    // Extrai informações das coleções
    const collectionsList = collections.data?.map((col: any) => ({
      name: col.collection,
      icon: col.meta?.icon || 'folder',
      note: col.meta?.note || '',
      hidden: col.meta?.hidden || false,
      singleton: col.meta?.singleton || false
    })) || [];

    return NextResponse.json({
      success: true,
      message: 'Conexão com Directus estabelecida com sucesso!',
      serverInfo: {
        version: serverInfo.data?.version,
        project: serverInfo.data?.project?.project_name || 'default'
      },
      collectionsCount: collections.data?.length || 0,
      collections: collectionsList,
      directusUrl
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Erro ao conectar com Directus',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
