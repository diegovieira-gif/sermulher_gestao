import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { DB_SCHEMA_CONTEXT } from "@/lib/ai-context";

// Inicializa a API
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { question } = await req.json();

    if (!question) {
      return NextResponse.json(
        { error: "Pergunta obrigatória" },
        { status: 400 },
      );
    }

    // ATUALIZAÇÃO 2026: Usando Gemini 2.5 Flash (Rápido e Free Tier)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
    ${DB_SCHEMA_CONTEXT}

    PERGUNTA DO USUÁRIO: "${question}"

    ATENÇÃO:
    - Você é uma API JSON. Retorne APENAS um JSON válido.
    - NÃO use markdown. NÃO use blocos de código (\`\`\`json).
    - Se a pergunta for sobre quantidade (total, quantos), preencha o campo "aggregate".
    - Se a pergunta for uma listagem (quais, quem, últimos), deixe "aggregate" como null e use "filter".
    
    Exemplos de Saída:
    1. Quantidade: { "collection": "beneficiarias", "filter": {}, "aggregate": { "count": "*" } }
    2. Listagem: { "collection": "atendimentos", "filter": { "status": { "_eq": "realizado" } }, "aggregate": null }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Limpeza de segurança para remover Markdown
    text = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    console.log("🤖 Gemini 2.5 Respondeu:", text);

    try {
      const jsonResponse = JSON.parse(text);
      return NextResponse.json(jsonResponse);
    } catch (e) {
      console.error("Erro de Parse JSON:", text);
      return NextResponse.json(
        { error: "A IA não retornou um JSON válido." },
        { status: 500 },
      );
    }
  } catch (error: any) {
    console.error("Erro Gemini 2.5:", error);

    // Tratamento específico para cota excedida
    if (error.status === 429) {
      return NextResponse.json(
        {
          error:
            "Limite de uso gratuito excedido. Tente novamente em alguns instantes.",
        },
        { status: 429 },
      );
    }

    return NextResponse.json(
      {
        error: "Erro na comunicação com IA",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
