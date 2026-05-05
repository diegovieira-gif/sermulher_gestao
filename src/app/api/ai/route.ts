import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import {
  createDirectus,
  rest,
  staticToken,
  readItems,
  aggregate,
} from "@directus/sdk";

// Contexto do Banco de Dados (Restauração da sua regra de negócio)
const DB_SCHEMA_CONTEXT = `
CONTEXTO DO BANCO DE DADOS:
1. Tabela 'campaigns': id, title, start_date, is_active.
2. Tabela 'courses': id, title, modality, vacancies, is_active.
3. Tabela 'services': id, title, location_mode, is_active.
4. Tabela 'app_users': id, name, location_city, notification_opt_in.
`;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Correção Crítica: O seu frontend envia a propriedade "question"
    const question = body.question;

    if (!question) {
      return NextResponse.json({ error: "Pergunta vazia" }, { status: 400 });
    }

    // 1. Conecta ao Directus para executar o painel e buscar a chave
    const directus = createDirectus(process.env.DIRECTUS_API_URL!)
      .with(rest())
      .with(staticToken(process.env.DIRECTUS_TOKEN!));

    // 2. Busca a chave na coleção 'config_integracao'
    const integracoes = await directus
      .request(
        readItems("config_integracao", {
          limit: 1,
        }),
      )
      .catch(() => []); // Previne erro fatal se a tabela estiver vazia

    // 3. Define a chave e o modelo dinâmico
    const apiKey = integracoes[0]?.gemini_api_key || process.env.GEMINI_API_KEY;
    const modeloIA = integracoes[0]?.modelo_ia || "gemini-2.5-flash";

    if (!apiKey) {
      console.error("[IA] Chave API Ausente.");
      return NextResponse.json(
        { error: "Chave API ausente. Configure a integração no painel." },
        { status: 500 },
      );
    }

    // 4. Inicializa o Novo SDK de 2026
    const ai = new GoogleGenAI({ apiKey: apiKey });

    // 5. Monta o Prompt Original que gera as consultas e os botões
    const prompt = `
    ${DB_SCHEMA_CONTEXT}
    PERGUNTA DO USUÁRIO: "${question}"
    
    TAREFA: 
    1. Identifique qual tabela e qual campo respondem a pergunta.
    2. Gere JSON para consultar o Directus.
    
    REGRAS:
    - Se a pergunta pedir "quantos por...", "distribuição", "mais comum", USE "groupBy".
    - Se pedir "total", "quantos no geral", USE "aggregate": { "count": "*" }.

    FORMATO JSON ESTRITO (Retorne APENAS o objeto JSON e nada mais):
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

    // 6. Envia para a IA
    const response = await ai.models.generateContent({
      model: modeloIA,
      contents: prompt,
    });

    const textAI = response.text?.replace(/```json|```/g, "").trim() || "";

    // 7. Analisa o plano da IA
    let plan;
    try {
      plan = JSON.parse(textAI);
    } catch (e) {
      console.error("A IA não retornou um JSON válido:", textAI);
      return NextResponse.json({
        type: "text",
        answer:
          "Houve uma falha no raciocínio da IA ao tentar buscar esses dados.",
        suggestions: [
          "Qual o total de atendimentos?",
          "Distribuição de infratores por risco?",
        ],
      });
    }

    if (plan.type === "text" || !plan.query?.collection) {
      return NextResponse.json(plan);
    }

    // 8. Executa a ação no Banco de Dados
    const query = plan.query;
    let dataResult;

    try {
      // CENÁRIO 1: Gráficos e Distribuição (Ex: Infratores por Risco)
      if (query.groupBy && Array.isArray(query.groupBy)) {
        const res = await directus.request(
          aggregate(query.collection, {
            aggregate: query.aggregate || { count: "*" },
            groupBy: query.groupBy,
            query: { filter: query.filter || {}, sort: query.sort },
          }),
        );

        // Formata para o frontend conseguir ler os cards corretamente
        dataResult = res.map((item: any) => ({
          nome: item[query.groupBy[0]] || "Não informado",
          count: Number(item.count || 0),
        }));
        plan.type = "list"; // Força o formato lista para o React desenhar os cards

        // CENÁRIO 2: Contagem Total Exata (Ex: Quantas beneficiárias?)
      } else if (query.aggregate) {
        const res = await directus.request(
          aggregate(query.collection, {
            aggregate: query.aggregate,
            query: { filter: query.filter || {} },
          }),
        );
        // Pega o número exato gerado pelo banco e converte para Number
        dataResult = Number(res[0]?.count || res[0]?.countAll || 0);

        // CENÁRIO 3: Listagem Simples (Ex: Me mostre as últimas matriculadas)
      } else {
        dataResult = await directus.request(
          readItems(query.collection, {
            limit: 15,
            filter: query.filter || {},
          }),
        );
      }

      return NextResponse.json({
        ...plan,
        data: dataResult,
      });
    } catch (dbError) {
      console.log(dbError);
      console.error("Erro ao rodar query gerada pela IA:", dbError);
      return NextResponse.json({
        type: "text",
        answer:
          "A IA entendeu a pergunta, mas não foi possível extrair estes dados específicos do banco no momento.",
        suggestions: plan.suggestions || [],
      });
    }
  } catch (error) {
    console.error("Erro Fatal na Rota de IA:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor da IA." },
      { status: 500 },
    );
  }
}
