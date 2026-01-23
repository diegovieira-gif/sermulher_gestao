import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import {
  createDirectus,
  rest,
  staticToken,
  readItems,
  aggregate,
} from "@directus/sdk";

// --- CONFIGURAÇÃO ---
const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const DIRECTUS_URL = process.env.DIRECTUS_URL || "http://192.168.0.115:8055";
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN || "";

// Contexto do Banco de Dados
const DB_SCHEMA_CONTEXT = `
CONTEXTO DO BANCO DE DADOS:
1. Tabela 'atendimentos': id, data_abertura, relator_tecnico, tipo_violencia (json), status.
2. Tabela 'escola_turmas': id, nome, data_inicio, data_fim, status.
3. Tabela 'infratores': id, nome_completo, nivel_risco, status_legal.
4. Tabela 'eventos_campanhas': id, nome, data_inicio, tipo_id.
`;

const directus = createDirectus(DIRECTUS_URL)
  .with(rest())
  .with(staticToken(DIRECTUS_TOKEN));

// --- FUNÇÃO AUXILIAR: DESCOBRIR MODELO ATIVO (PRIORIDADE FLASH) ---
async function getBestAvailableModel(apiKey: string): Promise<string> {
  try {
    // Consulta a API REST diretamente para listar modelos
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
    );
    const data = await response.json();

    if (!data.models) {
      throw new Error("Não foi possível listar modelos.");
    }

    // Filtra modelos que geram conteúdo
    const availableModels = data.models.filter((m: any) =>
      m.supportedGenerationMethods?.includes("generateContent"),
    );

    // Prioridade Invertida: FLASH > PRO > OUTROS
    // Modelos Flash são ideais para o Free Tier
    const cleanName = (name: string) => name.replace("models/", "");

    // 1. Tenta encontrar o Flash mais recente (Melhor cota gratuita)
    const flashModel = availableModels.find((m: any) =>
      m.name.toLowerCase().includes("flash"),
    );
    if (flashModel) return cleanName(flashModel.name);

    // 2. Se não tiver Flash, tenta Pro
    const proModel = availableModels.find((m: any) =>
      m.name.toLowerCase().includes("pro"),
    );
    if (proModel) return cleanName(proModel.name);

    // 3. Fallback genérico
    if (availableModels.length > 0) return cleanName(availableModels[0].name);

    return "gemini-1.5-flash"; // Fallback hardcoded seguro
  } catch (error) {
    console.warn(
      "⚠️ Falha na descoberta dinâmica, usando fallback seguro.",
      error,
    );
    return "gemini-1.5-flash";
  }
}

export async function POST(req: Request) {
  try {
    const { question } = await req.json();

    if (!question)
      return NextResponse.json({ error: "Pergunta vazia" }, { status: 400 });

    if (!API_KEY) {
      return NextResponse.json({
        type: "text",
        answer: "Chave de API não configurada.",
      });
    }

    // 1. Descobre qual modelo usar (Priorizando Flash)
    const modelName = await getBestAvailableModel(API_KEY);
    console.log(`🤖 Modelo selecionado (Econômico): ${modelName}`);

    // 2. Inicializa a IA
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `
    ${DB_SCHEMA_CONTEXT}
    PERGUNTA: "${question}"
    
    TAREFA: Gere JSON para consultar o Directus.
    FORMATO JSON OBRIGATÓRIO:
    {
      "query": { "collection": "nome_tabela", "aggregate": {}, "filter": {} },
      "type": "count" | "list" | "text",
      "answer": "Texto amigável"
    }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonStr = responseText.replace(/```json|```/g, "").trim();

    let plan;
    try {
      plan = JSON.parse(jsonStr);
    } catch (e) {
      return NextResponse.json({
        type: "text",
        answer: "Erro de raciocínio da IA.",
      });
    }

    if (plan.type === "text" || !plan.query?.collection) {
      return NextResponse.json(plan);
    }

    // --- EXECUÇÃO DIRECTUS ---
    let dbResult;
    const query = plan.query;

    try {
      if (query.aggregate) {
        // @ts-ignore
        const res = await directus.request(
          aggregate(query.collection, {
            aggregate: query.aggregate,
            query: { filter: query.filter || {} },
          }),
        );
        const countVal = res[0]?.count || res[0]?.countAll || 0;
        dbResult = Number(countVal);
      } else {
        // @ts-ignore
        dbResult = await directus.request(
          readItems(query.collection, {
            filter: query.filter || {},
            limit: 5,
          }),
        );
      }
    } catch (dbError: any) {
      console.error("Erro Directus:", dbError.message);
      return NextResponse.json({
        type: "text",
        answer: "Erro ao acessar dados. Verifique permissões.",
      });
    }

    return NextResponse.json({
      type: plan.type,
      answer: plan.answer,
      data: dbResult,
      debug_model: modelName,
    });
  } catch (error: any) {
    console.error("Erro Fatal AI:", error.message);

    // Tratamento específico para cota excedida
    if (error.message?.includes("429") || error.message?.includes("quota")) {
      return NextResponse.json({
        type: "text",
        answer:
          "⚠️ A cota gratuita da IA foi atingida momentaneamente. Tente novamente em alguns segundos.",
      });
    }

    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
