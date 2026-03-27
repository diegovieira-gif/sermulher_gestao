"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import { deleteContato } from "../actions";

interface Contato {
  id: string;
  nome: string;
  email: string;
  mensagem: string;
}

interface ContatosClientProps {
  initialData: Contato[];
}

export function ContatosClient({ initialData }: ContatosClientProps) {
  const [isPending, startTransition] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;

    startTransition(async () => {
      const result = await deleteContato(deleteId);
      if (result.success) {
        toast.success("Contato apagado com sucesso.");
      } else {
        toast.error(`Erro ao apagar contato: ${result.error}`);
      }
      setDeleteId(null);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center bg-white p-4 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium">Lista de Contatos</h3>
      </div>

      <div className="rounded-md border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Mensagem</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  Nenhum contato encontrado.
                </TableCell>
              </TableRow>
            ) : (
              initialData.map((contato) => (
                <TableRow key={contato.id}>
                  <TableCell className="font-medium">{contato.nome}</TableCell>
                  <TableCell>{contato.email}</TableCell>
                  <TableCell className="max-w-[520px] truncate">
                    {contato.mensagem}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteId(contato.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Apagar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isto excluirá permanentemente a
              mensagem de contato.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={isPending}
            >
              Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
