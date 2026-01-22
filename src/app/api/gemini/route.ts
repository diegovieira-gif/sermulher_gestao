import { GoogleGenerativeAI } from "@google/generative-ai";
import { DB_SCHEMA_CONTEXT } from "@/lib/ai-context";

const client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export async function POST(request: Request) {
  try {
    const { question } = await request.json();

    if (!question || typeof question !== "string") {
      return Response.json(
        { error: 'Campo "question" é obrigatório e deve ser uma string.' },
        { status: 400 },
      );
    }

    if (!process.env.GOOGLE_API_KEY) {
      return Response.json(
        { error: "Chave de API do Google não configurada." },
        { status: 500 },
      );
    }

    const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemPrompt = `${DB_SCHEMA_CONTEXT}

INSTRUÇÃO FINAL:
Analise a pergunta do usuário e retorne APENAS um objeto JSON válido (sem markdown, sem explicações, sem blocos de código) contendo:
- "collection": nome da tabela principal para consulta.
- "filter": objeto de filtro no padrão Directus (use operadores como _eq, _neq, _gt, _gte, _lt, _lte, _in, _nin, _like, _between para datas, etc.).
- "aggregate": objeto de agregação (ex: { "count": "*" }) SE a pergunta mencionar 'quantos', 'total', 'quantidade', contagem, etc. Caso contrário, null.

Garanta que o JSON seja válido e parseável.`;

    const response = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: systemPrompt,
            },
            {
              text: `Pergunta do usuário: ${question}`,
            },
          ],
        },
      ],
    });

    const responseText =
      response.content.parts[0].type === "text"
        ? response.content.parts[0].text
        : "";

    // Tenta extrair JSON válido da resposta
    let parsedResponse;
    try {
      // Remove possíveis marcadores de código markdown
      const cleanedResponse = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      parsedResponse = JSON.parse(cleanedResponse);
    } catch (parseError) {
      return Response.json(
        {
          error: "Erro ao processar resposta do modelo.",
          details: "O modelo retornou um JSON inválido.",
        },
        { status: 500 },
      );
    }

    // Valida estrutura mínima
    if (!parsedResponse.collection) {
      return Response.json(
        {
          error: "Resposta incompleta do modelo.",
          details: 'Falta o campo "collection".',
        },
        { status: 500 },
      );
    }

    return Response.json(parsedResponse, { status: 200 });
  } catch (error) {
    console.error("Erro na rota de Gemini:", error);

    return Response.json(
      {
        error: "Erro ao processar requisição.",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    );
  }
}
