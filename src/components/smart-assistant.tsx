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
    if (question !== input) setInput(question);

    setLoading(true);
    setError(null);
    // Não limpamos o resultado anterior imediatamente para evitar "piscada",
    // mas se preferir limpar, descomente: setResult(null);
    setAiDebug(null);

    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao processar solicitação.");
      }

      console.log("✅ Resposta:", data);
      setResult(data);
      setAiDebug(data.debug);

      // Atualiza as sugestões com as novas geradas pela IA (se houver)
      if (data.suggestions && data.suggestions.length > 0) {
        setCurrentSuggestions(data.suggestions);
      }
    } catch (err: any) {
      console.error("Erro no frontend:", err);
      setError(err.message || "Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full mb-6 border-purple-200 bg-gradient-to-br from-white to-purple-50/50 shadow-md">
      <CardHeader className="pb-3 border-b border-purple-100/50">
        <CardTitle className="flex items-center gap-2 text-purple-800">
          <Sparkles className="h-5 w-5 text-purple-600 fill-purple-200" />
          Assistente de Gestão (IA)
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5 pt-4">
        {/* Área de Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Ex: Quantas mulheres foram atendidas este mês?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAskQuestion()}
            className="bg-white border-purple-200 focus-visible:ring-purple-400 h-11"
          />
          <Button
            onClick={() => handleAskQuestion()}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white h-11 px-6 shadow-sm transition-all"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Área de Sugestões (Sempre Visível) */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-purple-600/80 uppercase tracking-wider ml-1">
            {result ? "Sugestões relacionadas:" : "Experimente perguntar:"}
          </p>
          <div className="flex flex-wrap gap-2">
            {currentSuggestions.map((s, idx) => (
              <Badge
                key={idx}
                variant="secondary"
                className="cursor-pointer hover:bg-purple-200 bg-purple-100/80 text-purple-700 font-normal py-1.5 px-3 transition-colors border border-purple-200/50"
                onClick={() => handleAskQuestion(s)}
              >
                {s} <ArrowRight className="ml-1 h-3 w-3 opacity-50" />
              </Badge>
            ))}
          </div>
        </div>

        {/* Exibição de Erros */}
        {error && (
          <Alert
            variant="destructive"
            className="animate-in fade-in slide-in-from-top-2"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Exibição de Resultados */}
        {result && (
          <div className="mt-4 p-5 bg-white rounded-xl border border-purple-100 shadow-sm animate-in fade-in zoom-in-95 duration-300">
            {result.type === "count" && (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold mb-2">
                  Total Encontrado
                </p>
                <div className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                  {result.value}
                </div>
              </div>
            )}

            {result.type === "list" && Array.isArray(result.value) && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-gray-500 font-semibold">
                    Encontrei {result.value.length} registros:
                  </p>
                  {aiDebug && (
                    <span className="text-[10px] text-gray-300 font-mono bg-gray-50 px-2 py-1 rounded">
                      {aiDebug}
                    </span>
                  )}
                </div>

                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {result.value.map((item: any, idx: number) => (
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
