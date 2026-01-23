"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BeneficiariaComboBox,
  type BeneficiariaOption,
} from "@/app/(admin)/mulheres/atendimentos/beneficiaria-combobox";
import {
  saveMatricula,
  deleteMatricula,
  getTurmaPerformance,
  updateMatriculaStatus,
  type Matricula,
} from "../../actions";
import { FrequenciaClient } from "./frequencia-client";
import { ResultadosClient } from "./resultados-client";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  Users,
  ClipboardList,
  Award,
  MoreVertical,
  Check,
  X,
  LogOut,
} from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";

interface TurmaDetalhesClientProps {
  turma: any;
  matriculas: Matricula[];
  beneficiarias: Array<{
    id: number;
    nome_completo: string;
    cpf: string;
    contato: string;
  }>;
}

const STATUS_LABEL: Record<string, string> = {
  aberta: "Aberta",
  em_andamento: "Em Andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

const STATUS_COLOR: Record<string, string> = {
  aberta: "bg-green-600 hover:bg-green-700 text-white",
  em_andamento: "bg-blue-600 hover:bg-blue-700 text-white",
  concluida: "bg-gray-600 hover:bg-gray-700 text-white",
  cancelada: "bg-red-600 hover:bg-red-700 text-white",
};

const MATRICULA_STATUS_LABEL = {
  ativa: "Ativa",
  concluida: "Concluída",
  concluída: "Concluída",
  aprovada: "Aprovada",
  reprovada: "Reprovada",
  evadida: "Evadida",
  cancelada: "Cancelada",
} as const;

type MatriculaStatusKey = keyof typeof MATRICULA_STATUS_LABEL;

const MATRICULA_STATUS_COLOR: Record<MatriculaStatusKey, string> = {
  ativa: "bg-green-600 hover:bg-green-700 text-white",
  concluida: "bg-gray-600 hover:bg-gray-700 text-white",
  concluída: "bg-gray-600 hover:bg-gray-700 text-white",
  aprovada: "bg-emerald-600 hover:bg-emerald-700 text-white",
  reprovada: "bg-amber-600 hover:bg-amber-700 text-white",
  evadida: "bg-yellow-600 hover:bg-yellow-700 text-white",
  cancelada: "bg-red-600 hover:bg-red-700 text-white",
};

function formatCPF(cpf?: string) {
  if (!cpf) return "—";
  const cpfLimpo = cpf.replace(/\D/g, "");
  if (cpfLimpo.length !== 11) return cpf;
  return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatDate(date?: string) {
  if (!date) return "—";
  try {
    const d = new Date(date);
    return d.toLocaleDateString("pt-BR");
  } catch {
    return "—";
  }
}

export function TurmaDetalhesClient({
  turma,
  matriculas,
  beneficiarias,
}: TurmaDetalhesClientProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBeneficiaria, setSelectedBeneficiaria] = useState<
    number | undefined
  >();
  const [isLoading, setIsLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [matriculaToDelete, setMatriculaToDelete] = useState<number | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);
  const [currentMatriculas, setCurrentMatriculas] =
    useState<Matricula[]>(matriculas);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [isLoadingPerformance, setIsLoadingPerformance] = useState(false);

  // Carrega performance quando necessário
  async function loadPerformance() {
    setIsLoadingPerformance(true);
    try {
      const result = await getTurmaPerformance(turma.id);
      if (result.success && result.data) {
        setPerformanceData(result.data);
      } else {
        toast.error(result.error || "Erro ao carregar performance");
      }
    } catch (error) {
      toast.error("Erro inesperado ao carregar performance");
    } finally {
      setIsLoadingPerformance(false);
    }
  }

  async function handleUpdateMatriculaStatus(
    matriculaId: number,
    status: MatriculaStatusKey,
  ) {
    setStatusUpdatingId(matriculaId);
    try {
      const result = await updateMatriculaStatus(matriculaId, turma.id, status);

      if (result.success) {
        setCurrentMatriculas((prev) =>
          prev.map((matricula) =>
            matricula.id === matriculaId ? { ...matricula, status } : matricula,
          ),
        );
        toast.success(
          `Status atualizado para "${
            MATRICULA_STATUS_LABEL[status] || status
          }"`,
        );
        router.refresh();
      } else {
        toast.error(result.error || "Erro ao atualizar status da matrícula");
      }
    } catch (error) {
      toast.error("Erro inesperado ao atualizar status da matrícula");
    } finally {
      setStatusUpdatingId(null);
    }
  }

  // Opções para o combobox
  const beneficiariasOptions: BeneficiariaOption[] = beneficiarias.map((b) => ({
    id: b.id,
    nome_completo: b.nome_completo,
    cpf: b.cpf,
  }));

  // Beneficiárias já matriculadas (para filtrar do combobox se necessário)
  const alreadyEnrolled = new Set(
    currentMatriculas.map((m) => m.beneficiaria.id),
  );

  async function handleAddMatricula() {
    if (!selectedBeneficiaria) {
      toast.error("Selecione uma beneficiária");
      return;
    }

    setIsLoading(true);
    try {
      const result = await saveMatricula(turma.id, selectedBeneficiaria);

      if (result.success) {
        toast.success("Matrícula realizada com sucesso!");
        setDialogOpen(false);
        setSelectedBeneficiaria(undefined);
        // Recarrega a página para atualizar a lista
        router.refresh();
      } else {
        toast.error(result.error || "Erro ao salvar matrícula");
      }
    } catch (error) {
      toast.error("Erro inesperado ao salvar matrícula");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteMatricula() {
    if (!matriculaToDelete) return;

    setIsDeleting(true);
    try {
      const result = await deleteMatricula(matriculaToDelete);

      if (result.success) {
        toast.success("Matrícula removida com sucesso!");
        setCurrentMatriculas((prev) =>
          prev.filter((m) => m.id !== matriculaToDelete),
        );
        router.refresh();
      } else {
        toast.error(result.error || "Erro ao remover matrícula");
      }
    } catch (error) {
      toast.error("Erro inesperado ao remover matrícula");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setMatriculaToDelete(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">{turma.nome}</h1>
          </div>
          <div className="flex items-center gap-4 ml-11">
            <div>
              <p className="text-sm text-muted-foreground">Curso</p>
              <p className="font-semibold">{turma?.curso?.nome || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Instrutor</p>
              <p className="font-semibold">{turma.instrutor || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className={STATUS_COLOR[turma.status || "aberta"] || ""}>
                {STATUS_LABEL[turma.status as keyof typeof STATUS_LABEL] ||
                  turma.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Vagas</p>
              <p className="font-semibold">{turma.vagas || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Matrículas, Diário de Classe e Resultados */}
      <Tabs defaultValue="matriculas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="matriculas" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Alunas Matriculadas ({currentMatriculas.length})
          </TabsTrigger>
          <TabsTrigger value="frequencia" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Diário de Classe
          </TabsTrigger>
          <TabsTrigger
            value="resultados"
            className="flex items-center gap-2"
            onClick={loadPerformance}
          >
            <Award className="h-4 w-4" />
            Resultados
          </TabsTrigger>
        </TabsList>

        {/* Tab: Alunas Matriculadas */}
        <TabsContent value="matriculas" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Lista de Alunas</h2>
            <Button onClick={() => setDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nova Matrícula
            </Button>
          </div>

          {currentMatriculas.length === 0 ? (
            <div className="rounded-md border p-6 text-center text-muted-foreground">
              Nenhuma aluna matriculada nesta turma
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      Nome
                      <InfoTooltip text="Nome completo da aluna matriculada." />
                    </TableHead>
                    <TableHead>
                      CPF
                      <InfoTooltip text="Cadastro de Pessoa Física da aluna." />
                    </TableHead>
                    <TableHead>
                      Data Matrícula
                      <InfoTooltip text="Data em que a aluna foi matriculada na turma." />
                    </TableHead>
                    <TableHead>
                      Telefone
                      <InfoTooltip text="Número de telefone para contato." />
                    </TableHead>
                    <TableHead>
                      Status
                      <InfoTooltip text="Situação da matrícula (Ativa, Aprovada, Reprovada, Evadida, Concluída, Cancelada)." />
                    </TableHead>
                    <TableHead className="w-[140px] text-right">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentMatriculas.map((matricula) => (
                    <TableRow key={matricula.id}>
                      <TableCell className="font-medium">
                        {matricula.beneficiaria.nome_completo}
                      </TableCell>
                      <TableCell>
                        {formatCPF(matricula.beneficiaria.cpf)}
                      </TableCell>
                      <TableCell>
                        {formatDate(matricula.data_matricula)}
                      </TableCell>
                      <TableCell>
                        {typeof matricula.beneficiaria.contato === "object" &&
                        matricula.beneficiaria.contato !== null
                          ? matricula.beneficiaria.contato.telefone ||
                            matricula.beneficiaria.contato.email ||
                            "—"
                          : matricula.beneficiaria.contato || "—"}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const statusKey = (
                            matricula.status || "ativa"
                          ).toLowerCase() as MatriculaStatusKey;

                          return (
                            <Badge
                              className={
                                MATRICULA_STATUS_COLOR[statusKey] ||
                                MATRICULA_STATUS_COLOR.ativa
                              }
                            >
                              {MATRICULA_STATUS_LABEL[statusKey] ||
                                matricula.status}
                            </Badge>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={statusUpdatingId === matricula.id}
                              aria-label="Ações da matrícula"
                            >
                              {statusUpdatingId === matricula.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreVertical className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem
                              disabled={statusUpdatingId === matricula.id}
                              onSelect={(event) => {
                                event.preventDefault();
                                handleUpdateMatriculaStatus(
                                  matricula.id,
                                  "aprovada",
                                );
                              }}
                            >
                              <Check className="mr-2 h-4 w-4 text-emerald-600" />
                              Aprovar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={statusUpdatingId === matricula.id}
                              onSelect={(event) => {
                                event.preventDefault();
                                handleUpdateMatriculaStatus(
                                  matricula.id,
                                  "reprovada",
                                );
                              }}
                            >
                              <X className="mr-2 h-4 w-4 text-red-600" />
                              Reprovar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={statusUpdatingId === matricula.id}
                              onSelect={(event) => {
                                event.preventDefault();
                                handleUpdateMatriculaStatus(
                                  matricula.id,
                                  "evadida",
                                );
                              }}
                            >
                              <LogOut className="mr-2 h-4 w-4 text-yellow-600" />
                              🏃 Evadiu
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              disabled={isDeleting}
                              onSelect={(event) => {
                                event.preventDefault();
                                setMatriculaToDelete(matricula.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remover matrícula
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Tab: Diário de Classe (Frequência) */}
        <TabsContent value="frequencia">
          <FrequenciaClient turmaId={turma.id} matriculas={currentMatriculas} />
        </TabsContent>

        {/* Tab: Resultados */}
        <TabsContent value="resultados" className="space-y-4">
          {isLoadingPerformance ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">
                Carregando resultados...
              </span>
            </div>
          ) : performanceData.length > 0 ? (
            <ResultadosClient performance={performanceData} />
          ) : (
            <div className="rounded-md border p-6 text-center text-muted-foreground">
              Nenhum dado de performance disponível.
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog: Nova Matrícula */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Aluna à Turma</DialogTitle>
            <DialogDescription>
              Selecione a beneficiária que deseja matricular nesta turma.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Beneficiária</label>
              <BeneficiariaComboBox
                options={beneficiariasOptions}
                value={selectedBeneficiaria}
                onValueChange={setSelectedBeneficiaria}
                placeholder="Buscar beneficiária..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  setSelectedBeneficiaria(undefined);
                }}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button onClick={handleAddMatricula} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar Matrícula
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Confirmar Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Matrícula</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover esta aluna da turma? Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMatricula}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removendo...
                </>
              ) : (
                "Remover"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
