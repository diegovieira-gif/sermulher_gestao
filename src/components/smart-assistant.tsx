"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Sparkles,
  Send,
  Loader2,
  AlertCircle,
  TrendingUp,
  Copy,
  Check,
} from "lucide-react";
import { directus } from "@/lib/directus";
import { readItems, aggregate } from "@directus/sdk";
import { toast } from "sonner";

interface QueryResult {
  collection: string;
  filter?: Record<string, any>;
  aggregate?: Record<string, any>;
}

interface AggregateResult {
  count?: number | string;
  sum?: number | string;
  avg?: number | string;
  min?: number | string;
  max?: number | string;
}

// Sugestões de perguntas para facilitar testes
const SUGGESTION_QUESTIONS = [
  "Quantas mulheres foram atendidas em janeiro?",
  "Total de beneficiárias cadastradas",
  "Quantos eventos aconteceram este mês?",
  "Infratores ativos no sistema",
  "Atendimentos por bairro",
];

export function SmartAssistant() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultType, setResultType] = useState<"aggregate" | "items" | null>(
    null,
  );
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleAskQuestion = async (q: string = question) => {
    if (!q.trim()) {
      setError("Por favor, faça uma pergunta.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // 1. Enviar pergunta para o Gemini API
      const geminiResponse = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });

      if (!geminiResponse.ok) {
        const errorData = await geminiResponse.json();
        throw new Error(
          errorData.error || "Erro ao processar a pergunta com a IA",
        );
      }

      const aiData = await geminiResponse.json();

      // 2. Validação robusta da resposta da IA
      if (!aiData || typeof aiData !== "object") {
        throw new Error("Resposta inválida da IA. Por favor, tente novamente.");
      }

      if (aiData.error) {
        throw new Error(aiData.error);
      }

      const { collection, filter, aggregate: aggregateQuery } = aiData;

      // 3. Validação crítica: collection deve existir e ser válida
      if (
        !collection ||
        typeof collection !== "string" ||
        collection.trim() === ""
      ) {
        throw new Error(
          "Não consegui entender qual tabela consultar. Tente reformular sua pergunta.",
        );
      }

      // 4. Executar query no Directus (SÓ AGORA, após validações)
      let queryResult: any;

      if (aggregateQuery) {
        // Se tem agregação (count, sum, etc)
        queryResult = await directus.request(
          aggregate(collection, {
            aggregate: aggregateQuery,
            query: {
              filter: filter || {},
            },
          }),
        );

        setResult(queryResult[0] || {});
        setResultType("aggregate");
      } else {
        // Se não, buscar itens
        queryResult = await directus.request(
          readItems(collection, {
            filter: filter || {},
            limit: 5,
          }),
        );

        setResult(queryResult || []);
        setResultType("items");
      }

      toast.success("Pergunta processada com sucesso!");

      // Scroll para o resultado
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro desconhecido";
      setError(errorMessage);
      setResult(null);
      toast.error("Erro ao processar pergunta");
      console.error("SmartAssistant Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyResult = () => {
    const text =
      resultType === "aggregate"
        ? JSON.stringify(result, null, 2)
        : JSON.stringify(result, null, 2);

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Resultado copiado!");
  };

  const renderResult = () => {
    if (!result) return null;

    if (resultType === "aggregate") {
      // Exibir resultado agregado em destaque
      const firstKey = Object.keys(result)[0];
      const value = result[firstKey];

      return (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Resultado
            </span>
          </div>
          <div className="text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">
            {value}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {firstKey.replace(/_/g, " ")}
          </p>

          {Object.entries(result).length > 1 && (
            <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(result).map(([key, val]) => (
                  <div key={key}>
                    <span className="text-gray-600 dark:text-gray-400">
                      {key}:
                    </span>
                    <span className="ml-2 font-semibold">{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Exibir resultado como lista
    if (Array.isArray(result) && result.length > 0) {
      return (
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {result.length} resultado(s) encontrado(s)
          </div>

          {result.map((item, idx) => (
            <div
              key={idx}
              className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-800"
            >
              <div className="space-y-1 text-sm">
                {Object.entries(item)
                  .slice(0, 3)
                  .map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">
                        {key}:
                      </span>
                      <span className="text-gray-900 dark:text-gray-100">
                        {String(value).length > 50
                          ? String(value).substring(0, 50) + "..."
                          : String(value)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Resultado vazio
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Nenhum resultado encontrado para esta consulta.
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <Card className="shadow-lg border-0">
        {/* Header */}
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            <CardTitle>Assistente Inteligente</CardTitle>
          </div>
          <p className="text-sm text-blue-50 mt-1">
            Faça perguntas sobre os dados do sistema e obtenha respostas
            instantâneas
          </p>
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          {/* Input */}
          <div className="space-y-2">
            <Input
              placeholder="Ex: Quantas mulheres do bairro Centro foram atendidas em Janeiro?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) {
                  handleAskQuestion();
                }
              }}
              disabled={loading}
              className="h-12"
            />
          </div>

          {/* Button */}
          <Button
            onClick={() => handleAskQuestion()}
            disabled={loading || !question.trim()}
            className="w-full h-10 gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Perguntar
              </>
            )}
          </Button>

          {/* Suggestions */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Sugestões de perguntas:
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTION_QUESTIONS.map((suggestion, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => handleAskQuestion(suggestion)}
                >
                  {suggestion}
                </Badge>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Result */}
      {result !== null && (
        <Card ref={resultRef} className="shadow-lg border-0 animate-in fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg">Resultado</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyResult}
              className="gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copiar
                </>
              )}
            </Button>
          </CardHeader>

          <CardContent>{renderResult()}</CardContent>
        </Card>
      )}
    </div>
  );
}
