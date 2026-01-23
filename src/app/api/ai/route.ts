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

// Contexto do Banco de Dados (Referência para a IA)
const DB_SCHEMA_CONTEXT = `
CONTEXTO DO BANCO DE DADOS:
1. Tabela 'atendimentos': id, data_abertura, tipo_violencia (lista), bairro, relator_tecnico, status.
2. Tabela 'escola_turmas': id, nome, status, data_inicio.
3. Tabela 'infratores': id, nome_completo, nivel_id, status_legal_id.
4. Tabela 'eventos_campanhas': id, nome, data_inicio, tipo_id.
5. Tabela 'beneficiarias': id, nome_completo, cpf.
`;

const directus = createDirectus(DIRECTUS_URL)
  .with(rest())
  .with(staticToken(DIRECTUS_TOKEN));

// --- FUNÇÃO AUXILIAR: DESCOBRIR MODELO ---
async function getBestAvailableModel(apiKey: string): Promise<string> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
    );
    const data = await response.json();
    if (!data.models) return "gemini-1.5-flash";

    const availableModels = data.models.filter((m: any) =>
      m.supportedGenerationMethods?.includes("generateContent"),
    );
    const cleanName = (name: string) => name.replace("models/", "");

    const flashModel = availableModels.find((m: any) =>
      m.name.toLowerCase().includes("flash"),
    );
    if (flashModel) return cleanName(flashModel.name);

    return "gemini-1.5-flash";
  } catch (error) {
    return "gemini-1.5-flash";
  }
}

export async function POST(req: Request) {
  try {
    const { question } = await req.json();

    if (!question)
      return NextResponse.json({ error: "Pergunta vazia" }, { status: 400 });
    if (!API_KEY)
      return NextResponse.json({ type: "text", answer: "Chave API ausente." });

    const modelName = await getBestAvailableModel(API_KEY);
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `
    ${DB_SCHEMA_CONTEXT}
    PERGUNTA DO USUÁRIO: "${question}"
    
    TAREFA: 
    1. Identifique qual tabela e qual campo respondem a pergunta.
    2. Gere JSON para consultar o Directus.
    
    REGRAS:
    - Se a pergunta pedir "quantos por...", "distribuição", "mais comum", USE "groupBy".
    - Se pedir "total", "quantos no geral", USE "aggregate": { "count": "*" }.

    FORMATO JSON:
    {
      "query": { 
        "collection": "nome_tabela", 
        "aggregate": { "count": "*" }, 
        "groupBy": ["campo_alvo"], 
        "filter": {},
        "sort": ["-count"] 
      },
      "type": "count" | "list" | "text",
      "answer": "Texto introdutório",
      "suggestions": ["sugestão 1", "sugestão 2"]
    }
    `;

    const result = await model.generateContent(prompt);
    const textAI = result.response
      .text()
      .replace(/```json|```/g, "")
      .trim();

    let plan;
    try {
      plan = JSON.parse(textAI);
    } catch (e) {
      return NextResponse.json({
        type: "text",
        answer: "Erro de raciocínio da IA.",
      });
    }

    if (plan.type === "text" || !plan.query?.collection) {
      return NextResponse.json(plan);
    }

    // --- EXECUÇÃO DIRECTUS COM FALLBACK ---
    let dbResult;
    const query = plan.query;

    try {
      // 1. TENTATIVA PADRÃO (Agregação Nativa)
      if (query.groupBy && Array.isArray(query.groupBy)) {
        // @ts-ignore
        const res = await directus.request(
          aggregate(query.collection, {
            aggregate: { count: "*" },
            groupBy: query.groupBy,
            sort: ["-count"],
            limit: 5,
          }),
        );
        dbResult = res.map((item: any) => ({
          nome: item[query.groupBy![0]] || "Não informado",
          count: Number(item.count || 0),
        }));
        plan.type = "list";
      } else if (query.aggregate) {
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
      console.warn(
        `⚠️ Erro na query principal (${query.collection}):`,
        dbError.message,
      );

      // --- TENTATIVA 2: FALLBACKS ---

      // CASO A: Fallback para Agrupamento (GroupBy)
      if (query.groupBy && query.groupBy.length > 0) {
        const groupField = query.groupBy[0];
        try {
          // @ts-ignore
          const rawItems = await directus.request(
            readItems(query.collection, {
              limit: 100,
              fields: ["id", groupField],
              filter: query.filter || {},
            }),
          );

          const counts: Record<string, number> = {};
          rawItems.forEach((item: any) => {
            let val = item[groupField];
            if (Array.isArray(val)) {
              val.forEach((v) => {
                const label =
                  typeof v === "object"
                    ? v.nome || v.titulo || JSON.stringify(v)
                    : String(v);
                counts[label] = (counts[label] || 0) + 1;
              });
            } else if (typeof val === "object" && val !== null) {
              const label = val.nome || val.titulo || val.id || "Outros";
              counts[label] = (counts[label] || 0) + 1;
            } else {
              const k = val ? String(val) : "Não informado";
              counts[k] = (counts[k] || 0) + 1;
            }
          });

          dbResult = Object.entries(counts)
            .map(([nome, count]) => ({ nome, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
          plan.type = "list";
        } catch (fbError) {
          return NextResponse.json({
            type: "text",
            answer: "Erro ao processar agrupamento de dados.",
          });
        }
      }
      // CASO B: Fallback para Contagem Simples (NOVO)
      else if (query.aggregate) {
        console.log(
          `🔄 Fallback: Contando itens manualmente em '${query.collection}'...`,
        );
        try {
          // Baixa apenas IDs para contar, limitado a 1000 para não travar
          // @ts-ignore
          const items = await directus.request(
            readItems(query.collection, {
              fields: ["id"],
              limit: 1000,
              filter: query.filter || {},
            }),
          );

          dbResult = items.length;
          if (items.length >= 1000) {
            plan.answer += " (Exibindo limite de amostra)";
          }
          plan.type = "count";
        } catch (fbError) {
          return NextResponse.json({
            type: "text",
            answer: "Erro de permissão ao contar registros.",
          });
        }
      } else {
        return NextResponse.json({
          type: "text",
          answer: "Erro ao acessar o banco de dados.",
        });
      }
    }

    return NextResponse.json({
      type: plan.type,
      answer: plan.answer,
      data: dbResult,
      suggestions: plan.suggestions || [],
      debug_model: modelName,
    });
  } catch (error: any) {
    console.error("Erro Fatal Route:", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
