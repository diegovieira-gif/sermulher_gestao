"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { saveSessao, deleteSessao } from "./actions";
import { Plus, Pencil, Trash2, Calendar } from "lucide-react";
import { toast } from "sonner";
import type { SessaoData } from "./schemas";

interface Sessao {
  id: number;
  data: string;
  tema: string;
  relatorio: string | null;
  sala_id: number;
}

interface SessoesClientProps {
  salaId: number;
  sessoes: Sessao[];
}

// Função para formatar data no formato DD/MM/YYYY
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

export function SessoesClient({ salaId, sessoes }: SessoesClientProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedSessao, setSelectedSessao] = useState<Sessao | null>(null);
  const [isSaving, startSaveTransition] = useTransition();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessaoToDelete, setSessaoToDelete] = useState<number | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  // Estados do formulário
  const [dataInput, setDataInput] = useState<string>("");
  const [temaInput, setTemaInput] = useState<string>("");
  const [relatorioInput, setRelatorioInput] = useState<string>("");

  const handleNew = () => {
    setSelectedSessao(null);
    setDataInput("");
    setTemaInput("");
    setRelatorioInput("");
    setFormOpen(true);
  };

  const handleEdit = (sessao: Sessao) => {
    setSelectedSessao(sessao);
    // Formata a data para o formato input[type="date"] (YYYY-MM-DD)
    const date = new Date(sessao.data);
    const formattedDate = date.toISOString().split("T")[0];
    setDataInput(formattedDate);
    setTemaInput(sessao.tema || "");
    setRelatorioInput(sessao.relatorio || "");
    setFormOpen(true);
  };

  const handleSave = () => {
    if (!dataInput || !temaInput.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    startSaveTransition(async () => {
      const sessaoData: SessaoData = {
        id: selectedSessao?.id,
        data: dataInput,
        tema: temaInput.trim(),
        relatorio: relatorioInput.trim() || undefined,
        sala_id: salaId,
      };

      const result = await saveSessao(sessaoData);

      if (result.success) {
        toast.success(result.message);
        setFormOpen(false);
        setSelectedSessao(null);
        setDataInput("");
        setTemaInput("");
        setRelatorioInput("");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleDeleteClick = (id: number) => {
    setSessaoToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!sessaoToDelete) return;

    startDeleteTransition(async () => {
      const result = await deleteSessao(sessaoToDelete);

      if (result.success) {
        toast.success(result.message);
        setDeleteDialogOpen(false);
        setSessaoToDelete(null);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Sessões do Ciclo
          </h2>
          <p className="text-muted-foreground">
            Registre e gerencie as sessões realizadas neste ciclo
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Sessão
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Tema</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessoes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center text-muted-foreground"
                >
                  Nenhuma sessão cadastrada
                </TableCell>
              </TableRow>
            ) : (
              sessoes.map((sessao) => (
                <TableRow key={sessao.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatarData(sessao.data)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{sessao.tema}</div>
                      {sessao.relatorio && (
                        <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {sessao.relatorio}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(sessao)}
                        title="Editar sessão"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(sessao.id)}
                        title="Excluir sessão"
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

      {/* Dialog de Formulário */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedSessao ? "Editar Sessão" : "Nova Sessão"}
            </DialogTitle>
            <DialogDescription>
              {selectedSessao
                ? "Atualize os dados da sessão"
                : "Preencha os dados da nova sessão"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="data">Data *</Label>
              <Input
                id="data"
                type="date"
                value={dataInput}
                onChange={(e) => setDataInput(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tema">Tema *</Label>
              <Input
                id="tema"
                value={temaInput}
                onChange={(e) => setTemaInput(e.target.value)}
                placeholder="Ex: Lei Maria da Penha"
                maxLength={255}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="relatorio">Relatório</Label>
              <Textarea
                id="relatorio"
                value={relatorioInput}
                onChange={(e) => setRelatorioInput(e.target.value)}
                placeholder="Ex: O grupo interagiu bem..."
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFormOpen(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar"}
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
              Esta ação não pode ser desfeita. A sessão será excluída
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
