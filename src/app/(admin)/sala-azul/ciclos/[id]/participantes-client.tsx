"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  addParticipante,
  updateParticipante,
  removeParticipante,
} from "./actions";
import {
  Plus,
  Trash2,
  FileText,
  Calendar,
  MapPin,
  Users,
  ArrowLeft,
  Printer,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import { StatusParticipacao } from "./schemas";
import Link from "next/link";
import { InfoTooltip } from "@/components/ui/info-tooltip";

interface Participante {
  id: number;
  infrator: {
    id: number;
    nome_completo: string;
    cpf: string | null;
    contato: {
      telefone?: string;
    } | null;
    nivel_id: {
      nome: string;
      cor: string;
    } | null;
    status_legal_id: {
      nome: string;
    } | null;
  } | null;
  frequencia_percentual: number | null;
  status_participacao: string | null;
  parecer_psicologico: string | null;
}

interface Infrator {
  id: number;
  nome_completo: string;
  cpf: string | null;
  nivel_id: {
    id: number;
    nome: string;
    cor: string;
  } | null;
  status_legal_id: {
    id: number;
    nome: string;
  } | null;
}

interface Sala {
  id: number;
  nome_ciclo: string;
  data_inicio: string;
  data_termino: string;
  local_id: {
    id: number;
    nome: string;
  } | null;
  responsavel_tecnico: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
}

interface ParticipantesClientProps {
  sala: Sala;
  participacoes: Participante[];
  infratoresDisponiveis: Infrator[];
}

// Função para formatar data
function formatarData(data: string | Date): string {
  try {
    const date = typeof data === "string" ? new Date(data) : data;
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  } catch {
    return String(data);
  }
}

// Função para obter a variante do badge baseado no status
function getStatusBadgeVariant(status: string | null): "default" | "success" | "destructive" | "warning" {
  if (!status) return "default";
  switch (status) {
    case StatusParticipacao.CONCLUIDO_COM_EXITO:
      return "success";
    case StatusParticipacao.REPROVADO:
      return "destructive";
    case StatusParticipacao.EVADIDO:
      return "warning";
    case StatusParticipacao.CURSANDO:
    default:
      return "default";
  }
}

// Função para formatar nome do responsável
function formatNomeResponsavel(responsavel: Sala["responsavel_tecnico"]): string {
  if (!responsavel) return "-";
  const firstName = responsavel.first_name || "";
  const lastName = responsavel.last_name || "";
  const nomeCompleto = `${firstName} ${lastName}`.trim();
  return nomeCompleto || "-";
}

export function ParticipantesClient({
  sala,
  participacoes,
  infratoresDisponiveis,
}: ParticipantesClientProps) {
  const router = useRouter();
  const [selectedInfrator, setSelectedInfrator] = useState<string>("");
  const [isAdding, startAddTransition] = useTransition();
  const [avaliacaoDialogOpen, setAvaliacaoDialogOpen] = useState(false);
  const [participanteEmAvaliacao, setParticipanteEmAvaliacao] =
    useState<Participante | null>(null);
  const [frequenciaInput, setFrequenciaInput] = useState<string>("");
  const [statusInput, setStatusInput] = useState<string>("");
  const [parecerInput, setParecerInput] = useState<string>("");
  const [isSaving, startSaveTransition] = useTransition();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [participanteToDelete, setParticipanteToDelete] =
    useState<number | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const handleAddParticipante = () => {
    if (!selectedInfrator) {
      toast.error("Selecione um infrator para adicionar");
      return;
    }

    startAddTransition(async () => {
      const result = await addParticipante({
        infrator: parseInt(selectedInfrator, 10),
        sala: sala.id,
      });

      if (result.success) {
        toast.success(result.message);
        setSelectedInfrator("");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleOpenAvaliacao = (participante: Participante) => {
    setParticipanteEmAvaliacao(participante);
    setFrequenciaInput(String(participante.frequencia_percentual || 0));
    setStatusInput(participante.status_participacao || StatusParticipacao.CURSANDO);
    setParecerInput(participante.parecer_psicologico || "");
    setAvaliacaoDialogOpen(true);
  };

  const handleSaveAvaliacao = () => {
    if (!participanteEmAvaliacao) return;

    startSaveTransition(async () => {
      const updateData: any = {};

      const frequencia = parseInt(frequenciaInput, 10);
      if (!isNaN(frequencia) && frequencia >= 0 && frequencia <= 100) {
        updateData.frequencia_percentual = frequencia;
      }

      if (statusInput) {
        updateData.status_participacao = statusInput;
      }

      if (parecerInput !== null) {
        updateData.parecer_psicologico = parecerInput || null;
      }

      const result = await updateParticipante(
        participanteEmAvaliacao.id,
        updateData
      );

      if (result.success) {
        toast.success(result.message);
        setAvaliacaoDialogOpen(false);
        setParticipanteEmAvaliacao(null);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleDeleteClick = (participacaoId: number) => {
    setParticipanteToDelete(participacaoId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!participanteToDelete) return;

    startDeleteTransition(async () => {
      const result = await removeParticipante(participanteToDelete);

      if (result.success) {
        toast.success(result.message);
        setDeleteDialogOpen(false);
        setParticipanteToDelete(null);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const periodo = `${formatarData(sala.data_inicio)} até ${formatarData(sala.data_termino)}`;

  return (
    <>
      {/* Header com informações da sala */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/sala-azul/ciclos">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{sala.nome_ciclo}</h1>
            <p className="text-muted-foreground">Gerenciamento de Participantes</p>
          </div>
        </div>

        {/* Informações da sala */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Período</p>
              <p className="text-sm text-muted-foreground">{periodo}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Local</p>
              <p className="text-sm text-muted-foreground">
                {sala.local_id?.nome || "-"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Responsável Técnico</p>
              <p className="text-sm text-muted-foreground">
                {formatNomeResponsavel(sala.responsavel_tecnico)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Card de adicionar participante */}
      <div className="mb-6 p-4 border rounded-lg bg-card">
        <h2 className="text-lg font-semibold mb-4">Adicionar Participante</h2>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <Label htmlFor="infrator">Infrator</Label>
            <Select
              value={selectedInfrator}
              onValueChange={setSelectedInfrator}
              disabled={isAdding || infratoresDisponiveis.length === 0}
            >
              <SelectTrigger id="infrator" className="w-full">
                <SelectValue placeholder="Selecione um infrator" />
              </SelectTrigger>
              <SelectContent>
                {infratoresDisponiveis.map((infrator: any) => (
                  <SelectItem key={infrator.id} value={String(infrator.id)}>
                    {infrator.nome_completo} - {infrator.cpf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleAddParticipante}
            disabled={isAdding || !selectedInfrator || infratoresDisponiveis.length === 0}
          >
            <Plus className="mr-2 h-4 w-4" />
            {isAdding ? "Adicionando..." : "Adicionar à Turma"}
          </Button>
        </div>
      </div>

      {/* Tabela de participantes */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                Infrator
                <InfoTooltip text="Nome completo do participante do ciclo." />
              </TableHead>
              <TableHead>
                Nível de Risco
                <InfoTooltip text="Grau de periculosidade identificado na triagem." />
              </TableHead>
              <TableHead>
                Status Legal
                <InfoTooltip text="Situação jurídica atual do processo." />
              </TableHead>
              <TableHead>
                Contato
                <InfoTooltip text="Telefone para comunicação com o infrator." />
              </TableHead>
              <TableHead>
                Frequência
                <InfoTooltip text="Percentual de presença nas sessões realizadas." />
              </TableHead>
              <TableHead>
                Status
                <InfoTooltip text="Situação da participação no ciclo (Ativo, Inativo, Concluído)." />
              </TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {participacoes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground"
                >
                  Nenhum participante cadastrado nesta turma
                </TableCell>
              </TableRow>
            ) : (
              participacoes.map((participante) => (
                <TableRow key={participante.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{participante.infrator?.nome_completo || "-"}</div>
                      <div className="text-sm text-muted-foreground">
                        CPF: {participante.infrator?.cpf || "-"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      style={{
                        backgroundColor: participante.infrator?.nivel_id?.cor || "#6b7280",
                        color: "white",
                      }}
                    >
                      {participante.infrator?.nivel_id?.nome || "-"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {participante.infrator?.status_legal_id?.nome || "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {participante.infrator?.contato?.telefone || "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {participante.frequencia_percentual !== null
                      ? `${participante.frequencia_percentual}%`
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        getStatusBadgeVariant(participante.status_participacao) as any
                      }
                    >
                      {participante.status_participacao || "-"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/sala-azul/ciclos/${sala.id}/relatorio/${participante.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Imprimir relatório individual"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      </Link>
                      {participante.status_participacao === StatusParticipacao.CONCLUIDO_COM_EXITO && (
                        <Link
                          href={`/sala-azul/ciclos/${sala.id}/certificado/${participante.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Emitir certificado"
                            className="text-amber-600 hover:text-amber-700"
                          >
                            <Award className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenAvaliacao(participante)}
                        title="Avaliar participante"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(participante.id)}
                        title="Remover da turma"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de Avaliação */}
      <Dialog open={avaliacaoDialogOpen} onOpenChange={setAvaliacaoDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Avaliar Participante - {participanteEmAvaliacao?.infrator?.nome_completo}
            </DialogTitle>
            <DialogDescription>
              Atualize a frequência, status e parecer psicológico do participante
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="frequencia">Frequência Percentual (0-100%)</Label>
              <Input
                id="frequencia"
                type="number"
                min="0"
                max="100"
                value={frequenciaInput}
                onChange={(e) => setFrequenciaInput(e.target.value)}
                placeholder="Ex: 85"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status da Participação</Label>
              <Select value={statusInput} onValueChange={setStatusInput}>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue placeholder="Selecione um status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(StatusParticipacao).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="parecer">Parecer Psicológico</Label>
              <Textarea
                id="parecer"
                value={parecerInput}
                onChange={(e) => setParecerInput(e.target.value)}
                placeholder="Digite o parecer psicológico do participante..."
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAvaliacaoDialogOpen(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveAvaliacao} disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar Avaliação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá o participante da turma. Esta ação pode ser revertida
              adicionando o participante novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
