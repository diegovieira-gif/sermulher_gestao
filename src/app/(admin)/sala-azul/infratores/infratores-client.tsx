"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { InfratorForm } from "./infrator-form";
import { deleteInfrator } from "./actions";
import { Plus, Pencil, Trash2, AlertTriangle, ShieldAlert, Eye } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { Infrator } from "./schemas";
import type {
  NivelOption,
  StatusLegalOption,
  TipoAgressaoOption,
} from "./actions";

interface InfratoresClientProps {
  infratores: any[];
  options: {
    niveis: NivelOption[];
    statusLegal: StatusLegalOption[];
    tiposAgressao: TipoAgressaoOption[];
  };
}

export function InfratoresClient({
  infratores,
  options,
}: InfratoresClientProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [selectedInfrator, setSelectedInfrator] = useState<Infrator | null>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [infratorToDelete, setInfratorToDelete] = useState<number | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const handleNew = () => {
    setSelectedInfrator(null);
    setFormOpen(true);
  };

  const handleEdit = (infrator: any) => {
    setSelectedInfrator(infrator);
    setFormOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setInfratorToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!infratorToDelete) return;

    setIsDeleting(true);
    try {
      const result = await deleteInfrator(infratorToDelete);

      if (result.success) {
        toast.success(result.message);
        setDeleteDialogOpen(false);
        setInfratorToDelete(null);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Erro ao excluir infrator");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Função auxiliar para formatar tipos de agressão (array de IDs)
  const formatTiposAgressao = (ids: any) => {
    // Validação: deve ser array e ter itens
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return <span className="text-muted-foreground">-</span>;
    }

    return (
      <div className="flex flex-wrap gap-1">
        {ids.map((id: number) => {
          // LOOKUP: Encontra o nome na lista de opções que já temos em memória
          const opcao = options.tiposAgressao.find((opt) => opt.id === id);
          const nome = opcao?.nome || `ID: ${id}`; // Fallback se não achar

          return (
            <Badge key={id} variant="outline" className="text-xs">
              {nome}
            </Badge>
          );
        })}
      </div>
    );
  };

  // Função para obter a cor do badge baseado no nível
  const getNivelCor = (nivelId: any): string => {
    if (nivelId?.cor) {
      return nivelId.cor;
    }
    return "#6b7280"; // Cor padrão cinza
  };

  // Função auxiliar para formatar data para PT-BR
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
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
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShieldAlert className="h-8 w-8 text-destructive" />
            Gestão de Infratores
          </h1>
          <p className="text-muted-foreground">
            Gerencie os infratores cadastrados no sistema (Sala Azul)
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Infrator
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Info Pessoal</TableHead>
              <TableHead>Status Legal</TableHead>
              <TableHead>Nível de Periculosidade</TableHead>
              <TableHead>Tipos de Agressão</TableHead>
              <TableHead>Número do Processo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {infratores.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-muted-foreground"
                >
                  Nenhum infrator cadastrado
                </TableCell>
              </TableRow>
            ) : (
              infratores.map((infrator) => (
                <TableRow key={infrator.id}>
                  <TableCell className="font-medium">
                    {infrator.nome_completo}
                  </TableCell>
                  <TableCell>{infrator.cpf}</TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      <div>Nasc: {formatDate(infrator.data_nascimento)}</div>
                      <div>Tel: {infrator?.contato?.telefone || "-"}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span>{infrator.status_legal_id?.nome || "-"}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      style={{
                        backgroundColor: getNivelCor(infrator.nivel_id),
                        color: "white",
                      }}
                    >
                      {infrator.nivel_id?.nome || "-"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatTiposAgressao(infrator.tipos_agressao_lista)}
                  </TableCell>
                  <TableCell>
                    {infrator.numero_processo || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/sala-azul/infratores/${infrator.id}`}>
                        <Button variant="ghost" size="icon" title="Ver detalhes">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(infrator)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(infrator.id)}
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

      <InfratorForm
        open={formOpen}
        onOpenChange={setFormOpen}
        infrator={selectedInfrator}
        options={options}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O infrator será excluído
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
