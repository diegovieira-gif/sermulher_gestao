"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getFrequenciaByData, saveFrequencia, type Matricula, type PresencaPayload } from "../../actions";
import { toast } from "sonner";
import { Loader2, Save, Calendar } from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";

interface FrequenciaClientProps {
  turmaId: number;
  matriculas: Matricula[];
}

type EstadoPresenca = Record<number, boolean>;

export function FrequenciaClient({ turmaId, matriculas }: FrequenciaClientProps) {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Data de hoje no formato YYYY-MM-DD
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [presencas, setPresencas] = useState<EstadoPresenca>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Carrega frequência quando a data muda
  useEffect(() => {
    loadFrequencia();
  }, [selectedDate]);

  async function loadFrequencia() {
    setIsLoading(true);
    try {
      const result = await getFrequenciaByData(turmaId, selectedDate);

      if (result.success && result.data) {
        // Converte array de registros para objeto { beneficiariaId: presente }
        const presencasMap: EstadoPresenca = {};
        result.data.forEach((registro) => {
          presencasMap[registro.beneficiaria] = registro.presente;
        });

        // Inicializa beneficiárias que não têm registro como presentes (padrão)
        matriculas.forEach((matricula) => {
          if (!(matricula.beneficiaria.id in presencasMap)) {
            presencasMap[matricula.beneficiaria.id] = true;
          }
        });

        setPresencas(presencasMap);
      } else {
        // Se não há registros, inicializa todos como presentes
        const presencasInicial: EstadoPresenca = {};
        matriculas.forEach((matricula) => {
          presencasInicial[matricula.beneficiaria.id] = true;
        });
        setPresencas(presencasInicial);
      }
    } catch (error) {
      console.error("Erro ao carregar frequência:", error);
      toast.error("Erro ao carregar frequência");
      // Inicializa com todos presentes em caso de erro
      const presencasInicial: EstadoPresenca = {};
      matriculas.forEach((matricula) => {
        presencasInicial[matricula.beneficiaria.id] = true;
      });
      setPresencas(presencasInicial);
    } finally {
      setIsLoading(false);
    }
  }

  function togglePresenca(beneficiariaId: number) {
    setPresencas((prev) => ({
      ...prev,
      [beneficiariaId]: !prev[beneficiariaId],
    }));
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      // Converte o estado para array de PresencaPayload
      const presencasArray: PresencaPayload[] = matriculas.map((matricula) => ({
        beneficiariaId: matricula.beneficiaria.id,
        presente: presencas[matricula.beneficiaria.id] ?? true,
      }));

      const result = await saveFrequencia(turmaId, selectedDate, presencasArray);

      if (result.success) {
        toast.success("Chamada salva com sucesso!");
      } else {
        toast.error(result.error || "Erro ao salvar chamada");
      }
    } catch (error) {
      console.error("Erro ao salvar frequência:", error);
      toast.error("Erro inesperado ao salvar chamada");
    } finally {
      setIsSaving(false);
    }
  }

  const presentes = Object.values(presencas).filter((p) => p === true).length;
  const ausentes = matriculas.length - presentes;

  if (matriculas.length === 0) {
    return (
      <div className="rounded-md border p-6 text-center text-muted-foreground">
        Nenhuma aluna matriculada. Não é possível fazer a chamada.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Data e Estatísticas */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <Label htmlFor="date-picker" className="text-base font-semibold">
              Data da Aula:
            </Label>
          </div>
          <input
            id="date-picker"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            disabled={isLoading || isSaving}
          />
        </div>

        <div className="flex items-center gap-6">
          <div className="text-sm">
            <span className="font-semibold text-green-600">{presentes}</span>{" "}
            <span className="text-muted-foreground">Presentes</span>
          </div>
          <div className="text-sm">
            <span className="font-semibold text-red-600">{ausentes}</span>{" "}
            <span className="text-muted-foreground">Ausentes</span>
          </div>
          <Button onClick={handleSave} disabled={isLoading || isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Chamada
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Tabela de Chamada */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px] text-center">#</TableHead>
                <TableHead>
                  Nome da Aluna
                  <InfoTooltip text="Nome completo da aluna matriculada." />
                </TableHead>
                <TableHead className="w-[150px] text-center">
                  Presente
                  <InfoTooltip text="Indica se a aluna está presente na sessão atual." />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matriculas.map((matricula, index) => {
                const beneficiariaId = matricula.beneficiaria.id;
                const isPresente = presencas[beneficiariaId] ?? true;

                return (
                  <TableRow key={matricula.id}>
                    <TableCell className="text-center text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {matricula.beneficiaria.nome_completo}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Switch
                          id={`presenca-${beneficiariaId}`}
                          checked={isPresente}
                          onCheckedChange={() => togglePresenca(beneficiariaId)}
                          disabled={isSaving}
                        />
                        <Label
                          htmlFor={`presenca-${beneficiariaId}`}
                          className={`cursor-pointer select-none ${
                            isPresente
                              ? "text-green-600 font-semibold"
                              : "text-red-600 font-semibold"
                          }`}
                        >
                          {isPresente ? "Presente" : "Ausente"}
                        </Label>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Info Adicional */}
      <div className="text-sm text-muted-foreground">
        <p>
          💡 <strong>Dica:</strong> Selecione a data da aula no topo e marque a presença de cada
          aluna. As presenças já registradas serão carregadas automaticamente ao mudar a data.
        </p>
      </div>
    </div>
  );
}
