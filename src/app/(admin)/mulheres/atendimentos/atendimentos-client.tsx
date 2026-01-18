"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
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
import { AtendimentoForm } from "./atendimento-form";
import { deleteAtendimento } from "./actions";
import { Plus, Pencil, Trash2, Eye, FileText } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import type {
  BeneficiariaOption,
  OrigemOption,
  PrioridadeOption,
  EncaminhamentoOption,
  TipoViolenciaOption,
} from "./actions";

interface AtendimentosClientProps {
  atendimentos: any[];
  beneficiariasOptions: BeneficiariaOption[];
  origensOptions: OrigemOption[];
  prioridadesOptions: PrioridadeOption[];
  encaminhamentosOptions: EncaminhamentoOption[];
  tiposViolenciaOptions: TipoViolenciaOption[];
}

export function AtendimentosClient({
  atendimentos,
  beneficiariasOptions,
  origensOptions,
  prioridadesOptions,
  encaminhamentosOptions,
  tiposViolenciaOptions,
}: AtendimentosClientProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [selectedAtendimento, setSelectedAtendimento] = useState<any | null>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [atendimentoToDelete, setAtendimentoToDelete] = useState<number | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtros
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [origemFilter, setOrigemFilter] = useState<string>("todos");
  const [prioridadeFilter, setPrioridadeFilter] = useState<string>("todos");
  const [encaminhamentoFilter, setEncaminhamentoFilter] = useState<string>("todos");
  const [tipoViolenciaFilter, setTipoViolenciaFilter] = useState<string>("todos");

  const handleNew = () => {
    setSelectedAtendimento(null);
    setFormOpen(true);
  };

  const handleEdit = (atendimento: any) => {
    setSelectedAtendimento(atendimento);
    setFormOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setAtendimentoToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!atendimentoToDelete) return;

    setIsDeleting(true);
    try {
      const result = await deleteAtendimento(atendimentoToDelete);

      if (result.success) {
        toast.success(result.message);
        setDeleteDialogOpen(false);
        setAtendimentoToDelete(null);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Erro ao excluir atendimento");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Função auxiliar para formatar data (dd/MM/yyyy)
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pt-BR");
    } catch {
      return dateString;
    }
  };

  // Função auxiliar para formatar CPF
  const formatCPF = (cpf: string | null | undefined): string => {
    if (!cpf) return "";
    const cpfLimpo = cpf.replace(/\D/g, "");
    if (cpfLimpo.length !== 11) return cpf;
    return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  // Função para obter nome da beneficiária
  const getBeneficiariaNome = (beneficiaria: any): string => {
    if (typeof beneficiaria === "object" && beneficiaria !== null) {
      return beneficiaria.nome_completo || "-";
    }
    const found = beneficiariasOptions.find((b) => b.id === beneficiaria);
    return found?.nome_completo || "-";
  };

  // Função para obter CPF da beneficiária
  const getBeneficiariaCPF = (beneficiaria: any): string => {
    if (typeof beneficiaria === "object" && beneficiaria !== null) {
      return formatCPF(beneficiaria.cpf) || "";
    }
    const found = beneficiariasOptions.find((b) => b.id === beneficiaria);
    return formatCPF(found?.cpf) || "";
  };

  // Função para obter nome da origem
  const getOrigemNome = (origemId: any): string => {
    if (typeof origemId === "object" && origemId !== null) {
      return origemId.nome || "-";
    }
    const found = origensOptions.find((o) => o.id === origemId);
    return found?.nome || "-";
  };

  // Função para obter dados da prioridade
  const getPrioridade = (prioridadeId: any) => {
    if (typeof prioridadeId === "object" && prioridadeId !== null) {
      return {
        nome: prioridadeId.nome || "-",
        cor: prioridadeId.cor,
      };
    }
    const found = prioridadesOptions.find((p) => p.id === prioridadeId);
    return {
      nome: found?.nome || "-",
      cor: found?.cor,
    };
  };

  // Auxiliares para filtros
  const normalizeId = (val: any): number | undefined => {
    if (val == null) return undefined;
    if (typeof val === "object") return val?.id ?? undefined;
    if (typeof val === "string") {
      const n = Number(val);
      return Number.isNaN(n) ? undefined : n;
    }
    if (typeof val === "number") return val;
    return undefined;
  };

  const atendimentoHasTipoViolencia = (item: any, tipoId: number): boolean => {
    // Pode vir como lista m2m (tipos_violencia_lista) ou array simples (tipos_violencia)
    const lista = Array.isArray(item?.tipos_violencia_lista)
      ? item.tipos_violencia_lista
      : Array.isArray(item?.tipos_violencia)
      ? item.tipos_violencia
      : [];

    return lista.some((it: any) => {
      if (it?.config_tipos_agressao_id) {
        const id = normalizeId(it.config_tipos_agressao_id);
        return id === tipoId;
      }
      const id = normalizeId(it);
      return id === tipoId;
    });
  };

  const filteredAtendimentos = atendimentos.filter((a) => {
    const statusOk =
      statusFilter === "todos" || (a.status || "Aberto") === statusFilter;
    const origemOk =
      origemFilter === "todos" || normalizeId(a.origem_id) === Number(origemFilter);
    const prioridadeOk =
      prioridadeFilter === "todos" || normalizeId(a.prioridade_id) === Number(prioridadeFilter);
    const encaminhamentoOk =
      encaminhamentoFilter === "todos" || normalizeId(a.encaminhamento_id) === Number(encaminhamentoFilter);
    const tipoOk =
      tipoViolenciaFilter === "todos" || atendimentoHasTipoViolencia(a, Number(tipoViolenciaFilter));
    return statusOk && origemOk && prioridadeOk && encaminhamentoOk && tipoOk;
  });

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Atendimentos</h1>
          <p className="text-muted-foreground">
            Gerencie os atendimentos das beneficiárias - Capa do Processo
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Atendimento
        </Button>
      </div>

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap gap-3">
        {/* Filtro de Status */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="Aberto">Aberto</SelectItem>
            <SelectItem value="Em andamento">Em andamento</SelectItem>
            <SelectItem value="Concluído">Concluído</SelectItem>
            <SelectItem value="Arquivado">Arquivado</SelectItem>
          </SelectContent>
        </Select>

        {/* Filtro de Origem */}
        <Select value={origemFilter} onValueChange={setOrigemFilter}>
          <SelectTrigger className="w-[200px] bg-white">
            <SelectValue placeholder="Origem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as origens</SelectItem>
            {origensOptions.map((opt) => (
              <SelectItem key={opt.id} value={String(opt.id)}>
                {opt.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filtro de Prioridade */}
        <Select value={prioridadeFilter} onValueChange={setPrioridadeFilter}>
          <SelectTrigger className="w-[200px] bg-white">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as prioridades</SelectItem>
            {prioridadesOptions.map((opt) => (
              <SelectItem key={opt.id} value={String(opt.id)}>
                {opt.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filtro de Encaminhamento */}
        <Select value={encaminhamentoFilter} onValueChange={setEncaminhamentoFilter}>
          <SelectTrigger className="w-[220px] bg-white">
            <SelectValue placeholder="Encaminhamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os encaminhamentos</SelectItem>
            {encaminhamentosOptions.map((opt) => (
              <SelectItem key={opt.id} value={String(opt.id)}>
                {opt.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filtro de Tipo de Violência */}
        <Select value={tipoViolenciaFilter} onValueChange={setTipoViolenciaFilter}>
          <SelectTrigger className="w-[240px] bg-white">
            <SelectValue placeholder="Tipo de Violência" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            {tiposViolenciaOptions.map((opt) => (
              <SelectItem key={opt.id} value={String(opt.id)}>
                {opt.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Beneficiária</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAtendimentos.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-8"
                >
                  Nenhum atendimento cadastrado
                </TableCell>
              </TableRow>
            ) : (
              filteredAtendimentos.map((atendimento) => {
                const prioridade = getPrioridade(atendimento.prioridade_id);
                const beneficiariaNome = getBeneficiariaNome(atendimento.beneficiaria);
                const beneficiariaCPF = getBeneficiariaCPF(atendimento.beneficiaria);

                return (
                  <TableRow key={atendimento.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{beneficiariaNome}</span>
                        {beneficiariaCPF && (
                          <span className="text-xs text-muted-foreground">
                            CPF: {beneficiariaCPF}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(atendimento.data_abertura)}</TableCell>
                    <TableCell>
                      {prioridade.cor ? (
                        <Badge
                          style={{
                            backgroundColor: prioridade.cor,
                            color: "white",
                            border: "transparent",
                          }}
                        >
                          {prioridade.nome}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">{prioridade.nome}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{atendimento.status || "Aberto"}</Badge>
                    </TableCell>
                    <TableCell>{getOrigemNome(atendimento.origem_id)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/mulheres/atendimentos/${atendimento.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Ver detalhes / Prontuário"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(atendimento)}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(atendimento.id)}
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AtendimentoForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setSelectedAtendimento(null);
          }
        }}
        beneficiariasOptions={beneficiariasOptions}
        origensOptions={origensOptions}
        prioridadesOptions={prioridadesOptions}
        encaminhamentosOptions={encaminhamentosOptions}
        tiposViolenciaOptions={tiposViolenciaOptions}
        atendimento={selectedAtendimento}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O atendimento será excluído
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
