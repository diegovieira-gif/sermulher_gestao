"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { BeneficiariaForm } from "./beneficiaria-form";
import { deleteBeneficiaria } from "./actions";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Beneficiaria } from "./schemas";

interface BeneficiariasClientProps {
  beneficiarias: any[];
}

export function BeneficiariasClient({ beneficiarias }: BeneficiariasClientProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [selectedBeneficiaria, setSelectedBeneficiaria] = useState<Beneficiaria | null>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [beneficiariaToDelete, setBeneficiariaToDelete] = useState<number | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const handleNew = () => {
    setSelectedBeneficiaria(null);
    setFormOpen(true);
  };

  const handleEdit = (beneficiaria: any) => {
    setSelectedBeneficiaria(beneficiaria);
    setFormOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setBeneficiariaToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!beneficiariaToDelete) return;

    setIsDeleting(true);
    try {
      const result = await deleteBeneficiaria(beneficiariaToDelete);

      if (result.success) {
        toast.success(result.message);
        setDeleteDialogOpen(false);
        setBeneficiariaToDelete(null);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Erro ao excluir beneficiária");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Função auxiliar para formatar CPF
  const formatCPF = (cpf: string | null | undefined): string => {
    if (!cpf) return "-";
    // Remove formatação existente e formata novamente
    const cpfLimpo = cpf.replace(/\D/g, "");
    if (cpfLimpo.length !== 11) return cpf;
    return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  // Função auxiliar para extrair telefone do JSON
  const getTelefone = (contato: any): string => {
    if (!contato) return "-";
    if (typeof contato === "string") {
      try {
        const parsed = JSON.parse(contato);
        return parsed?.telefone || "-";
      } catch {
        return contato;
      }
    }
    return contato?.telefone || "-";
  };

  // Função auxiliar para calcular idade
  const calcularIdade = (dataNascimento: string | null | undefined): string => {
    if (!dataNascimento) return "-";
    try {
      const hoje = new Date();
      const nascimento = new Date(dataNascimento);
      let idade = hoje.getFullYear() - nascimento.getFullYear();
      const mes = hoje.getMonth() - nascimento.getMonth();
      if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
        idade--;
      }
      return `${idade} anos`;
    } catch {
      return "-";
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Beneficiárias</h1>
          <p className="text-muted-foreground">
            Gerencie o cadastro das mulheres atendidas pelo sistema
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Beneficiária
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Idade</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {beneficiarias.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-8"
                >
                  Nenhuma beneficiária cadastrada
                </TableCell>
              </TableRow>
            ) : (
              beneficiarias.map((beneficiaria) => (
                <TableRow key={beneficiaria.id}>
                  <TableCell className="font-medium">
                    {beneficiaria.nome_completo}
                  </TableCell>
                  <TableCell>{formatCPF(beneficiaria.cpf)}</TableCell>
                  <TableCell>{getTelefone(beneficiaria.contato)}</TableCell>
                  <TableCell>
                    {calcularIdade(beneficiaria.data_nascimento)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(beneficiaria)}
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(beneficiaria.id)}
                        title="Excluir"
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

      <BeneficiariaForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setSelectedBeneficiaria(null);
          }
        }}
        beneficiaria={selectedBeneficiaria}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A beneficiária será excluída
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
