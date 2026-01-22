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

// 1. Configura Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

// 2. Configura Directus (Privado/Admin)
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

    // --- FASE 1: INTELIGÊNCIA (GEMINI 2.5) ---
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
    ${DB_SCHEMA_CONTEXT}
    PERGUNTA: "${question}"
    
    Regras:
    - Retorne JSON puro. Sem markdown.
    - Se for contagem, use "aggregate": { "count": "*" }.
    - Se for lista, use "aggregate": null e preencha "filter".
    - Ex: { "collection": "beneficiarias", "filter": {}, "aggregate": { "count": "*" } }
    `;

    const resultAI = await model.generateContent(prompt);
    const textAI = resultAI.response
      .text()
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    console.log("🤖 IA Plano:", textAI);

    let plan;
    try {
      plan = JSON.parse(textAI);
    } catch (e) {
      return NextResponse.json(
        { error: "Falha ao interpretar a pergunta." },
        { status: 500 },
      );
    }

    if (!plan.collection) {
      return NextResponse.json(
        { error: "Não entendi qual tabela consultar." },
        { status: 400 },
      );
    }

    // --- FASE 2: EXECUÇÃO (DIRECTUS) ---
    let dbResult;
    let responseType = "list";

    try {
      if (plan.aggregate) {
        // Contagem
        responseType = "count";
        const res = await directus.request(
          aggregate(plan.collection, {
            aggregate: plan.aggregate,
            query: { filter: plan.filter || {} },
          }),
        );
        // Normaliza retorno do Directus (pode vir como array de objetos)
        const countVal = res[0]?.count || res[0]?.countAll || 0;
        dbResult = Number(countVal); // Garante número
      } else {
        // Listagem
        responseType = "list";
        dbResult = await directus.request(
          readItems(plan.collection, {
            filter: plan.filter || {},
            limit: 5, // Segurança
          }),
        );
      }
    } catch (dbError: any) {
      console.error("❌ Erro Directus:", dbError);
      return NextResponse.json(
        { error: "Erro ao consultar banco de dados. Verifique permissões." },
        { status: 500 },
      );
    }

    // --- FASE 3: RETORNO ---
    return NextResponse.json({
      type: responseType,
      value: dbResult,
      debug: `Tabela: ${plan.collection}`,
    });
  } catch (error: any) {
    console.error("❌ Erro Geral:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
