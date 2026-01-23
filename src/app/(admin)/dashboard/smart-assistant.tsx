"use client";

import { useState } from "react";
import { Sparkles, Send, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

const DEFAULT_SUGGESTIONS = [
  "Total de beneficiárias cadastradas",
  "Qual o tipo de violência mais comum?",
  "Lista de infratores de alto risco",
  "Quantas turmas estão abertas?",
];

export function SmartAssistant() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentSuggestions, setCurrentSuggestions] =
    useState<string[]>(DEFAULT_SUGGESTIONS);

  const handleAskQuestion = async (questionToAsk: string = input) => {
    const question = questionToAsk.trim();
    if (!question) return;

    setInput(question);
    setLoading(true);
    setError(null);
    setResult(null);

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
      if (
        data.suggestions &&
        Array.isArray(data.suggestions) &&
        data.suggestions.length > 0
      ) {
        setCurrentSuggestions(data.suggestions);
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
            placeholder="Faça uma pergunta sobre os dados..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAskQuestion()}
            disabled={loading}
            className="bg-white border-purple-200 focus-visible:ring-purple-500"
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

        {!loading && (
          <div className="flex flex-wrap gap-2 animate-in fade-in duration-300">
            {currentSuggestions.map((suggestion, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="cursor-pointer bg-white hover:bg-purple-100 text-purple-700 border-purple-200 py-1.5 px-3 transition-colors"
                onClick={() => handleAskQuestion(suggestion)}
              >
                {suggestion}
              </Badge>
            ))}
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Atenção</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-bottom-2">
            {(result.type === "text" || result.type === "count") && (
              <div className="p-5 bg-white rounded-lg border border-purple-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
                <p className="text-lg text-gray-800 font-medium leading-relaxed">
                  {result.answer}
                </p>
                {result.type === "count" && typeof result.data === "number" && (
                  <p className="text-4xl font-bold text-purple-600 mt-3 tracking-tight">
                    {result.data.toLocaleString("pt-BR")}
                  </p>
                )}
                {result.debug_model && (
                  <p className="text-[10px] text-gray-300 mt-4 text-right">
                    IA: {result.debug_model}
                  </p>
                )}
              </div>
            )}

            {result.type === "list" && Array.isArray(result.data) && (
              <div className="space-y-2">
                <p className="font-medium text-gray-700 mb-2">
                  {result.answer}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {result.data.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 bg-white hover:bg-purple-50/50 rounded-lg border border-gray-200 shadow-sm transition-colors flex flex-col justify-between gap-2"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span
                          className="font-semibold text-purple-900 truncate"
                          title={item.nome}
                        >
                          {item.nome ||
                            item.nome_completo ||
                            "Item " + (idx + 1)}
                        </span>
                        {/* Exibe contagem se existir */}
                        {item.count !== undefined && (
                          <Badge
                            variant="secondary"
                            className="bg-purple-100 text-purple-700 shrink-0"
                          >
                            {item.count}
                          </Badge>
                        )}
                      </div>

                      <div className="text-xs text-gray-500 space-y-0.5">
                        {item.status && (
                          <p>
                            Status:{" "}
                            <span className="font-medium uppercase">
                              {item.status}
                            </span>
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
