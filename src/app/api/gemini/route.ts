import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { DB_SCHEMA_CONTEXT } from "@/lib/ai-context";
import {
  createDirectus,
  rest,
  staticToken,
  readItems,
  aggregate,
} from "@directus/sdk";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

const directusUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_DIRECTUS_URL ||
  "http://192.168.0.115:8055";
const directusToken = process.env.DIRECTUS_TOKEN || "";

const directus = createDirectus(directusUrl)
  .with(rest())
  .with(staticToken(directusToken));

export async function POST(req: Request) {
  try {
    const { question } = await req.json();

    if (!question)
      return NextResponse.json({ error: "Pergunta vazia" }, { status: 400 });

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
    ${DB_SCHEMA_CONTEXT}
    PERGUNTA ATUAL: "${question}"
    
    TAREFA:
    1. Gere a query para o Directus no campo "query".
    2. Gere 3 sugestões curtas de próximas perguntas relacionadas que o usuário poderia querer fazer em seguida no campo "suggestions".
    
    Formato de Saída (JSON Puro):
    {
      "query": { 
         "collection": "...", 
         "filter": {}, 
         "aggregate": { "count": "*" } 
      },
      "suggestions": [
         "Pergunta relacionada 1?",
         "Pergunta relacionada 2?",
         "Pergunta relacionada 3?"
      ]
    }
    `;

    const resultAI = await model.generateContent(prompt);
    const textAI = resultAI.response
      .text()
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let plan;
    try {
      plan = JSON.parse(textAI);
    } catch (e) {
      return NextResponse.json(
        { error: "Falha ao interpretar a pergunta." },
        { status: 500 },
      );
    }

    if (!plan.query || !plan.query.collection) {
      return NextResponse.json(
        { error: "Não entendi qual tabela consultar." },
        { status: 400 },
      );
    }

    // --- EXECUÇÃO (DIRECTUS) ---
    let dbResult;
    let responseType = "list";
    const query = plan.query;

    try {
      if (query.aggregate) {
        responseType = "count";
        const res = await directus.request(
          aggregate(query.collection, {
            aggregate: query.aggregate,
            query: { filter: query.filter || {} },
          }),
        );
        const countVal = res[0]?.count || res[0]?.countAll || 0;
        dbResult = Number(countVal);
      } else {
        responseType = "list";
        dbResult = await directus.request(
          readItems(query.collection, {
            filter: query.filter || {},
            limit: 5,
          }),
        );
      }
    } catch (dbError: any) {
      console.error("❌ Erro Directus:", dbError);
      return NextResponse.json(
        { error: "Erro ao consultar banco de dados." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      type: responseType,
      value: dbResult,
      suggestions: plan.suggestions || [],
      debug: `Tabela: ${query.collection}`,
    });
  } catch (error: any) {
    console.error("❌ Erro Geral:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
