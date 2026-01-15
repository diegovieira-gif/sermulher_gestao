"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { AtendimentoForm } from "./atendimento-form";
import { Plus, Pencil, Loader2 } from "lucide-react";
import { updateStatus } from "./actions";
import { StatusAtendimento } from "./schemas";
import { toast } from "sonner";

type BeneficiariaOption = { id: number; nome_completo: string };
type OrigemOption = { id: number; nome: string };
type PrioridadeOption = { id: number; nome: string; cor?: string };

function formatDateBR(dateValue?: string | null) {
  if (!dateValue) return "-";
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("pt-BR").format(d);
}

function prioridadeBadgeVariant(prioridade?: string | null) {
  if (prioridade === "Emergência" || prioridade === "Urgente") return "destructive";
  return "secondary";
}

function statusBadgeVariant(status?: string | null) {
  if (status === "Concluído") return "success";
  if (status === "Em andamento") return "info";
  if (status === "Arquivado") return "outline";
  return "warning"; // Aberto (default)
}

interface AtendimentosClientProps {
  atendimentos: any[];
  beneficiariasOptions: BeneficiariaOption[];
  origensOptions: OrigemOption[];
  prioridadesOptions: PrioridadeOption[];
}

export function AtendimentosClient({
  atendimentos,
  beneficiariasOptions,
  origensOptions,
  prioridadesOptions,
}: AtendimentosClientProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [selectedAtendimento, setSelectedAtendimento] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [updatingStatusId, setUpdatingStatusId] = useState<number | string | null>(null);

  const sortedAtendimentos = useMemo(() => {
    return [...atendimentos].sort((a, b) => {
      const da = a?.data_abertura ? new Date(a.data_abertura).getTime() : 0;
      const db = b?.data_abertura ? new Date(b.data_abertura).getTime() : 0;
      return db - da;
    });
  }, [atendimentos]);

  const filteredAtendimentos = useMemo(() => {
    if (statusFilter === "Todos") {
      return sortedAtendimentos;
    }
    return sortedAtendimentos.filter(
      (item) => item.status === statusFilter
    );
  }, [sortedAtendimentos, statusFilter]);

  const handleStatusChange = async (atendimentoId: number | string, newStatus: string) => {
    setUpdatingStatusId(atendimentoId);
    try {
      const result = await updateStatus(atendimentoId, newStatus);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Erro ao atualizar status");
      console.error(error);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleNew = () => {
    setSelectedAtendimento(null);
    setFormOpen(true);
  };

  const handleEdit = (atendimento: any) => {
    setSelectedAtendimento(atendimento);
    setFormOpen(true);
  };

  const statusOptions = [
    "Todos",
    StatusAtendimento.ABERTO,
    StatusAtendimento.EM_ANDAMENTO,
    StatusAtendimento.CONCLUIDO,
    StatusAtendimento.ARQUIVADO,
  ];

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Atendimentos</h1>
          <p className="text-muted-foreground">
            Vincule beneficiárias a novos casos e acompanhe o status
          </p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <label htmlFor="status-filter" className="text-sm font-medium">
              Filtrar por Status:
            </label>
            <Select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-[180px]"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </div>
          <Button onClick={handleNew}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Atendimento
          </Button>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Beneficiária</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAtendimentos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  {statusFilter === "Todos"
                    ? "Nenhum atendimento cadastrado"
                    : `Nenhum atendimento com status "${statusFilter}"`}
                </TableCell>
              </TableRow>
            ) : (
              filteredAtendimentos.map((item) => {
                // Acessa origem_id - pode vir como objeto expandido ou apenas ID
                const origemNome = item.origem_id?.nome || 
                  (typeof item.origem_id === "number" 
                    ? origensOptions.find((o) => o.id === item.origem_id)?.nome 
                    : null) || "-";

                // Acessa prioridade_id - pode vir como objeto expandido ou apenas ID
                const prioridadeObj = 
                  typeof item.prioridade_id === "object" && item.prioridade_id !== null
                    ? item.prioridade_id
                    : typeof item.prioridade_id === "number"
                    ? prioridadesOptions.find((p) => p.id === item.prioridade_id)
                    : null;

                const prioridadeNome = prioridadeObj?.nome || "-";
                const prioridadeCor = prioridadeObj?.cor;

                const badgeStyle = prioridadeCor
                  ? { backgroundColor: prioridadeCor, color: "white", border: "transparent" }
                  : undefined;

                return (
                  <TableRow key={item.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDateBR(item.data_abertura)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {typeof item.beneficiaria === "object" && item.beneficiaria !== null
                        ? item.beneficiaria?.nome_completo
                        : beneficiariasOptions.find((b) => b.id === item.beneficiaria)?.nome_completo || "-"}
                    </TableCell>
                    <TableCell>{origemNome}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Select
                          value={item.status || StatusAtendimento.ABERTO}
                          onChange={(e) => handleStatusChange(item.id, e.target.value)}
                          disabled={updatingStatusId === item.id}
                          className="w-[160px]"
                        >
                          {Object.values(StatusAtendimento).map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </Select>
                        {updatingStatusId === item.id && (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {prioridadeCor ? (
                        <Badge style={badgeStyle}>{prioridadeNome}</Badge>
                      ) : (
                        <Badge variant={prioridadeBadgeVariant(prioridadeNome) as any}>
                          {prioridadeNome}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(item)}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
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
        onOpenChange={setFormOpen}
        beneficiariasOptions={beneficiariasOptions}
        origensOptions={origensOptions}
        prioridadesOptions={prioridadesOptions}
        atendimento={selectedAtendimento}
      />
    </>
  );
}

