"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Filter, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { KanbanCard, getKanbanData, updateTramitacaoStatus } from "./actions";

const COLUNAS = [
  {
    id: "Aguardando",
    title: "📥 Aguardando",
    color: "bg-yellow-50 border-yellow-200",
  },
  {
    id: "Em atendimento",
    title: "👩‍💻 Em Análise",
    color: "bg-blue-50 border-blue-200",
  },
  {
    id: "Finalizado",
    title: "✅ Concluído",
    color: "bg-green-50 border-green-200",
  },
];

export function KanbanBoard({
  initialData,
  setores,
}: {
  initialData: KanbanCard[];
  setores: any[];
}) {
  const [cards, setCards] = useState(initialData);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  // Filtros
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [isFiltering, setIsFiltering] = useState(false);

  // Debounce simples para evitar chamadas excessivas
  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsFiltering(true);
      try {
        const result = await getKanbanData(search, sectorFilter);
        if (result.success && result.data) {
          setCards(result.data);
        }
      } catch (error) {
        console.error("Erro ao filtrar:", error);
      } finally {
        setIsFiltering(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search, sectorFilter]);

  const moveCard = async (card: KanbanCard, direction: "next" | "prev") => {
    const currentIndex = COLUNAS.findIndex((c) => c.id === card.status_etapa);
    if (currentIndex === -1) return;

    const newIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
    const newStatus = COLUNAS[newIndex]?.id;
    if (!newStatus) return;

    setLoadingId(card.id);

    const oldCards = [...cards];
    // Atualização otimista
    setCards((prev) =>
      prev.map((c) =>
        c.id === card.id ? { ...c, status_etapa: newStatus as any } : c,
      ),
    );

    const result = await updateTramitacaoStatus(card.id, newStatus);
    if (!result.success) {
      toast.error("Erro ao atualizar status");
      setCards(oldCards);
    } else {
      toast.success(`Movido para ${newStatus}`);
    }
    setLoadingId(null);
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border shadow-sm items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar por nome ou CPF..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-[250px]">
          <Select value={sectorFilter} onValueChange={setSectorFilter}>
            <SelectTrigger>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <SelectValue placeholder="Filtrar por Setor" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Setores</SelectItem>
              {setores.map((s) => (
                <SelectItem key={s.id} value={s.id.toString()}>
                  {s.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {isFiltering && (
          <div className="flex items-center text-sm text-purple-600 animate-pulse whitespace-nowrap px-2">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            <span className="hidden sm:inline">Atualizando...</span>
          </div>
        )}
      </div>

      {/* Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0 overflow-hidden">
        {COLUNAS.map((col) => (
          <div
            key={col.id}
            className={`flex flex-col h-full max-h-full rounded-xl border ${col.color} p-4`}
          >
            <div className="flex items-center justify-between mb-4 sticky top-0 z-10">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                {col.title}
              </h3>
              <Badge variant="secondary" className="bg-white/80 backdrop-blur">
                {cards.filter((c) => c.status_etapa === col.id).length}
              </Badge>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar pb-20">
              {cards
                .filter((c) => c.status_etapa === col.id)
                .map((card) => (
                  <Card
                    key={card.id}
                    className="shadow-sm hover:shadow-md transition-all bg-white group relative animate-in fade-in slide-in-from-bottom-2"
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <Badge
                          variant="outline"
                          className={`text-[10px] uppercase tracking-wide ${
                            card.prioridade === "Alta"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : ""
                          }`}
                        >
                          {card.setor_nome}
                        </Badge>
                        <span className="text-[10px] text-gray-400">
                          {new Date(card.data_recebimento).toLocaleDateString(
                            "pt-BR",
                          )}
                        </span>
                      </div>

                      <h4
                        className="font-bold text-gray-800 truncate"
                        title={card.beneficiaria.nome}
                      >
                        {card.beneficiaria.nome}
                      </h4>
                      <p className="text-xs text-gray-500 mb-3 font-mono">
                        {card.beneficiaria.cpf}
                      </p>

                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                        <Link
                          href={`/mulheres/atendimentos/${card.atendimento_id}`}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[10px] text-primary px-2 hover:bg-primary/10"
                          >
                            Abrir Prontuário
                          </Button>
                        </Link>

                        <div className="flex gap-1">
                          {col.id !== "Aguardando" && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 hover:bg-gray-100"
                              onClick={() => moveCard(card, "prev")}
                              disabled={loadingId === card.id}
                            >
                              <ArrowLeft className="h-3.5 w-3.5 text-gray-600" />
                            </Button>
                          )}
                          {col.id !== "Finalizado" && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 hover:bg-purple-50"
                              onClick={() => moveCard(card, "next")}
                              disabled={loadingId === card.id}
                            >
                              <ArrowRight className="h-3.5 w-3.5 text-purple-600" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                    {loadingId === card.id && (
                      <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-[1px] rounded-lg">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                      </div>
                    )}
                  </Card>
                ))}

              {cards.filter((c) => c.status_etapa === col.id).length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg bg-white/30">
                  <p className="text-xs">Nenhuma demanda</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
