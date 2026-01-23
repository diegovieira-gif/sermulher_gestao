"use client";

import { useState } from "react";
import { Sparkles, Send, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

const DEFAULT_SUGGESTIONS = [
  "Total de beneficiárias cadastradas",
  "Quais são os bairros com mais atendimentos?",
  "Lista de infratores de alto risco",
  "Quantas turmas estão abertas?",
];

export function SmartAssistant() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiDebug, setAiDebug] = useState<string | null>(null);

  // Estado para as sugestões dinâmicas
  const [currentSuggestions, setCurrentSuggestions] =
    useState<string[]>(DEFAULT_SUGGESTIONS);

  const handleAskQuestion = async (questionToAsk: string = input) => {
    const question = questionToAsk.trim();
    if (!question) return;

    // Atualiza o input se foi clicado numa sugestão
    setInput(question);
    setLoading(true);
    setError(null);
    setResult(null);
    setAiDebug(null);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao processar pergunta");
      }

      setResult(data);
      if (data.query) {
        setAiDebug(JSON.stringify(data.query, null, 2));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-white shadow-sm mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg text-purple-900">
          <Sparkles className="h-5 w-5 text-purple-600" />
          Assistente Inteligente SerMulher
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Faça uma pergunta sobre os dados (ex: Quantas mulheres foram atendidas este mês?)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAskQuestion()}
            disabled={loading}
            className="bg-white"
          />
          <Button
            onClick={() => handleAskQuestion()}
            disabled={loading || !input.trim()}
            className="bg-purple-600 hover:bg-purple-700 min-w-[100px]"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <div className="flex items-center gap-2">
                Perguntar <Send className="h-3 w-3" />
              </div>
            )}
          </Button>
        </div>

        {/* Sugestões Rápidas */}
        {!result && !loading && (
          <div className="flex flex-wrap gap-2">
            {currentSuggestions.map((suggestion, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="cursor-pointer hover:bg-purple-100 text-purple-700 border-purple-200 py-1 px-3"
                onClick={() => handleAskQuestion(suggestion)}
              >
                {suggestion}
              </Badge>
            ))}
          </div>
        )}

        {/* Erro */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Resultados */}
        {result && (
          <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-bottom-2">
            {/* Resposta em Texto / Count */}
            {(result.type === "text" || result.type === "count") && (
              <div className="p-4 bg-white rounded-lg border border-purple-100 shadow-sm">
                <p className="text-lg text-gray-800 font-medium leading-relaxed">
                  {result.answer}
                </p>
                {result.type === "count" && result.data !== undefined && (
                  <p className="text-3xl font-bold text-purple-600 mt-2">
                    {result.data}
                  </p>
                )}
              </div>
            )}

            {/* Resposta em Lista */}
            {result.type === "list" && Array.isArray(result.data) && (
              <div className="space-y-2">
                <p className="font-medium text-gray-700 mb-2">
                  {result.answer}:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {result.data.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 bg-gray-50 hover:bg-purple-50/50 rounded-lg border border-gray-100 transition-colors flex flex-col gap-1"
                    >
                      <span className="font-semibold text-gray-800 truncate">
                        {item.nome ||
                          item.nome_completo ||
                          item.nome_ciclo ||
                          "Item " + (idx + 1)}
                      </span>

                      {/* Renderiza campos extras úteis se existirem */}
                      <div className="text-xs text-gray-500 space-y-0.5">
                        {item.status && (
                          <p>
                            Status:{" "}
                            <span className="font-medium">{item.status}</span>
                          </p>
                        )}
                        {item.cpf && <p>CPF: {item.cpf}</p>}
                        {item.data_inicio && (
                          <p>
                            Início:{" "}
                            {new Date(item.data_inicio).toLocaleDateString(
                              "pt-BR",
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
