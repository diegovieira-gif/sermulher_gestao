"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
  FileEdit,
  Trash2,
  FileText,
  Printer,
  ShieldAlert,
  Gavel,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
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
import { useRouter } from "next/navigation";
import { InfratorForm } from "./infrator-form";
import { deleteInfrator } from "./actions";
import type { Infrator } from "./schemas";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface InfratoresClientProps {
  initialData: any[];
  niveis: any[];
  statusLegais: any[];
  tiposAgressao: any[];
}

export function InfratoresClient({
  initialData,
  niveis,
  statusLegais,
  tiposAgressao,
}: InfratoresClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInfrator, setEditingInfrator] = useState<Infrator | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Filtragem local
  const filteredData = initialData.filter(
    (item) =>
      item.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.cpf?.includes(searchTerm) ||
      item.numero_processo?.includes(searchTerm),
  );

  const handleEdit = (infrator: Infrator) => {
    setEditingInfrator(infrator);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      const result = await deleteInfrator(deletingId);
      if (result.success) {
        toast.success("Autor removido com sucesso");
        router.refresh();
      } else {
        toast.error("Erro ao remover: " + result.error);
      }
    } catch (error) {
      toast.error("Erro interno ao remover autor");
    } finally {
      setDeletingId(null);
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingInfrator(null);
    router.refresh();
    toast.success(
      editingInfrator ? "Autor atualizado!" : "Autor cadastrado!",
    );
  };

  const getNivelColor = (nivel: string) => {
    switch (nivel?.toLowerCase()) {
      case "alto":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-200 dark:border-red-800";
      case "médio":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-200 dark:border-yellow-800";
      case "baixo":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-200 dark:border-green-800";
      default:
        return "bg-muted text-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* --- ÁREA DE TELA (DASHBOARD) --- */}
      <div className="print:hidden space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 text-primary" />
              Gestão de Autores
            </h2>
            <p className="text-sm text-muted-foreground">
              Gerencie os participantes dos grupos reflexivos
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              Exportar Relatório
            </Button>
            <Button
              onClick={() => {
                setEditingInfrator(null);
                setIsFormOpen(true);
              }}
              className="bg-primary hover:bg-primary/90 gap-2"
            >
              <Plus className="h-4 w-4" />
              Novo Autor
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-2 bg-card p-2 rounded-lg border shadow-sm">
          <Search className="h-4 w-4 text-muted-foreground ml-2" />
          <Input
            placeholder="Buscar por nome, CPF ou processo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-0 focus-visible:ring-0"
          />
        </div>

        {/* Tabela Interativa */}
        <div className="rounded-md border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Nome Completo</TableHead>
                <TableHead>Status Legal</TableHead>
                <TableHead>Nível de Risco</TableHead>
                <TableHead>Processo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Nenhum autor encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item) => (
                  <TableRow
                    key={item.id}
                    className="hover:bg-blue-50/30 transition-colors dark:hover:bg-blue-950/30"
                  >
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span className="text-foreground">
                          {item.nome_completo}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {item.cpf}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-muted/50">
                        <Gavel className="h-3 w-3 mr-1 text-muted-foreground" />
                        Status Legal
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium border`}
                      >
                        Nível
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground font-mono">
                      {item.numero_processo || "---"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/sala-azul/infratores/${item.id}`)
                            }
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(item)}>
                            <FileEdit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeletingId(item.id as number)}
                            className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* --- ÁREA DE IMPRESSÃO (RELATÓRIO) --- */}
      <div className="hidden print:fixed print:inset-0 print:z-50 print:bg-white print:block print:w-screen print:h-screen print:overflow-visible p-8 md:p-12">
        {/* Cabeçalho do Relatório */}
        <div className="mb-8 border-b pb-4">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">
                Relatório de Autores
              </h1>
              <p className="text-sm text-muted-foreground">
                Sala Azul - Grupos Reflexivos para Homens
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Data de Emissão</p>
              <p className="font-mono font-medium">
                {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>
        </div>

        {/* Tabela de Relatório */}
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b-2 border-gray-800">
              <th className="py-2 font-bold text-foreground">
                Nome Completo / CPF
              </th>
              <th className="py-2 font-bold text-foreground">Processo</th>
              <th className="py-2 font-bold text-foreground">Status Legal</th>
              <th className="py-2 font-bold text-foreground">Nível Risco</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, index) => (
              <tr
                key={item.id}
                className={`border-b border-border ${index % 2 === 0 ? "bg-muted/50" : "bg-card"}`}
              >
                <td className="py-3 pr-4">
                  <div className="font-semibold text-foreground">
                    {item.nome_completo}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {item.cpf || "CPF não informado"}
                  </div>
                </td>
                <td className="py-3 font-mono text-foreground">
                  {item.numero_processo || "---"}
                </td>
                <td className="py-3 text-foreground">Status Legal</td>
                <td className="py-3">
                  <span className={`text-xs font-bold uppercase text-foreground`}>
                    Nível
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Rodapé do Relatório */}
        <div className="mt-12 pt-8 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
          <p>Sistema de Gestão Integrada - SERMULHER</p>
          <p>Página 1 de 1</p>
        </div>
      </div>

      {/* --- MODAIS (Mantidos Intactos) --- */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingInfrator ? "Editar Autor" : "Novo Autor"}
            </DialogTitle>
          </DialogHeader>
          <InfratorForm
            onSuccess={handleFormSuccess}
            initialData={editingInfrator || undefined}
            niveis={niveis}
            statusLegais={statusLegais}
            tiposAgressao={tiposAgressao}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o
              registro do autor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
