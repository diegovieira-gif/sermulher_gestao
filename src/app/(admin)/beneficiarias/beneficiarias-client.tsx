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
  const [selectedBeneficiaria, setSelectedBeneficiaria] = useState<Beneficiaria | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [beneficiariaToDelete, setBeneficiariaToDelete] = useState<number | null>(null);
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

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Beneficiárias</h1>
          <p className="text-muted-foreground">
            Gerencie as beneficiárias cadastradas no sistema
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
              <TableHead>Email</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {beneficiarias.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nenhuma beneficiária cadastrada
                </TableCell>
              </TableRow>
            ) : (
              beneficiarias.map((beneficiaria) => (
                <TableRow key={beneficiaria.id}>
                  <TableCell className="font-medium">
                    {beneficiaria.nome_completo}
                  </TableCell>
                  <TableCell>{beneficiaria.cpf}</TableCell>
                  <TableCell>
                    {beneficiaria.contato?.telefone || "-"}
                  </TableCell>
                  <TableCell>
                    {beneficiaria.contato?.email || "-"}
                  </TableCell>
                  <TableCell>
                    {beneficiaria.endereco?.cidade || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(beneficiaria)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(beneficiaria.id)}
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
        onOpenChange={setFormOpen}
        beneficiaria={selectedBeneficiaria}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A beneficiária será excluída permanentemente.
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
