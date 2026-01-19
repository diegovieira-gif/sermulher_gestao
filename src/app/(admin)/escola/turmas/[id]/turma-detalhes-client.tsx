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
import { BeneficiariaComboBox, type BeneficiariaOption } from "@/app/(admin)/mulheres/atendimentos/beneficiaria-combobox";
import { saveMatricula, deleteMatricula, type Matricula } from "../../actions";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";

interface TurmaDetalhesClientProps {
  turma: any;
  matriculas: Matricula[];
  beneficiarias: Array<{
    id: number;
    nome_completo: string;
    cpf: string;
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

const MATRICULA_STATUS_LABEL: Record<string, string> = {
  ativa: "Ativa",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

const MATRICULA_STATUS_COLOR: Record<string, string> = {
  ativa: "bg-green-600 hover:bg-green-700 text-white",
  concluida: "bg-gray-600 hover:bg-gray-700 text-white",
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
  const [selectedBeneficiaria, setSelectedBeneficiaria] = useState<number | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [matriculaToDelete, setMatriculaToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentMatriculas, setCurrentMatriculas] = useState<Matricula[]>(matriculas);

  // Opções para o combobox
  const beneficiariasOptions: BeneficiariaOption[] = beneficiarias.map((b) => ({
    id: b.id,
    nome_completo: b.nome_completo,
    cpf: b.cpf,
  }));

  // Beneficiárias já matriculadas (para filtrar do combobox se necessário)
  const alreadyEnrolled = new Set(currentMatriculas.map((m) => m.beneficiaria.id));

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
        setCurrentMatriculas((prev) => prev.filter((m) => m.id !== matriculaToDelete));
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
                {STATUS_LABEL[turma.status as keyof typeof STATUS_LABEL] || turma.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Vagas</p>
              <p className="font-semibold">{turma.vagas || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alunas Matriculadas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            Alunas Matriculadas ({currentMatriculas.length})
          </h2>
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
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Data Matrícula</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentMatriculas.map((matricula) => (
                  <TableRow key={matricula.id}>
                    <TableCell className="font-medium">
                      {matricula.beneficiaria.nome_completo}
                    </TableCell>
                    <TableCell>{formatCPF(matricula.beneficiaria.cpf)}</TableCell>
                    <TableCell>{formatDate(matricula.data_matricula)}</TableCell>
                    <TableCell>{matricula.beneficiaria.telefone || "—"}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          MATRICULA_STATUS_COLOR[matricula.status || "ativa"] || ""
                        }
                      >
                        {MATRICULA_STATUS_LABEL[matricula.status as keyof typeof MATRICULA_STATUS_LABEL] ||
                          matricula.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setMatriculaToDelete(matricula.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

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
              Tem certeza que deseja remover esta aluna da turma? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
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
