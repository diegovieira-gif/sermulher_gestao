"use client";

import { useState } from "react";
import { Sparkles, Send, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export function SmartAssistant() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiDebug, setAiDebug] = useState<string | null>(null);

  const suggestions = [
    "Total de beneficiárias cadastradas",
    "Quais são as últimas beneficiárias?",
    "Total de atendimentos realizados",
  ];

  const handleAskQuestion = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setAiDebug(null);

    try {
      // O Backend agora faz tudo: IA + Banco de Dados
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao processar solicitação.");
      }

      console.log("✅ Resposta Pronta:", data);
      setResult(data);
      setAiDebug(data.debug);
    } catch (err: any) {
      console.error("Erro no frontend:", err);
      setError(err.message || "Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full mb-6 border-purple-200 bg-gradient-to-br from-white to-purple-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-purple-800">
          <Sparkles className="h-5 w-5 text-purple-600" />
          Assistente Inteligente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Pergunte sobre seus dados..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAskQuestion()}
            className="bg-white"
          />
          <Button
            onClick={handleAskQuestion}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {!result && !loading && (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <Badge
                key={s}
                variant="outline"
                className="cursor-pointer hover:bg-purple-100 text-gray-600 font-normal"
                onClick={() => setInput(s)}
              >
                {s}
              </Badge>
            ))}
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="mt-4 p-4 bg-white rounded-lg border shadow-sm animate-in fade-in slide-in-from-bottom-2">
            {result.type === "count" && (
              <div className="text-center py-2">
                <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold mb-1">
                  Resultado
                </p>
                <div className="text-5xl font-bold text-purple-700">
                  {result.value}
                </div>
              </div>
            )}

            {result.type === "list" && Array.isArray(result.value) && (
              <div>
                <p className="text-sm text-gray-500 font-semibold mb-3">
                  Encontrei {result.value.length} registros:
                </p>
                <ul className="space-y-2">
                  {result.value.map((item: any, idx: number) => (
                    <li
                      key={idx}
                      className="p-3 bg-gray-50 rounded border text-sm flex flex-col"
                    >
                      <span className="font-medium text-gray-800">
                        {item.nome ||
                          item.nome_completo ||
                          item.nome_ciclo ||
                          JSON.stringify(item)}
                      </span>
                      {item.status && (
                        <span className="text-xs text-gray-500">
                          Status: {item.status}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {aiDebug && (
              <p className="mt-4 text-[10px] text-gray-400 text-right">
                Fonte: {aiDebug}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
