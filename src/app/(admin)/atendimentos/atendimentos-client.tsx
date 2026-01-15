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
import { AtendimentoForm } from "./atendimento-form";
import { Plus, Pencil } from "lucide-react";

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

  const sortedAtendimentos = useMemo(() => {
    return [...atendimentos].sort((a, b) => {
      const da = a?.data_abertura ? new Date(a.data_abertura).getTime() : 0;
      const db = b?.data_abertura ? new Date(b.data_abertura).getTime() : 0;
      return db - da;
    });
  }, [atendimentos]);

  const handleNew = () => {
    setSelectedAtendimento(null);
    setFormOpen(true);
  };

  const handleEdit = (atendimento: any) => {
    setSelectedAtendimento(atendimento);
    setFormOpen(true);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Atendimentos</h1>
          <p className="text-muted-foreground">
            Vincule beneficiárias a novos casos e acompanhe o status
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Atendimento
        </Button>
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
            {sortedAtendimentos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nenhum atendimento cadastrado
                </TableCell>
              </TableRow>
            ) : (
              sortedAtendimentos.map((item) => {
                const prioridadeCor = item.prioridade_id?.cor;
                const badgeStyle = prioridadeCor
                  ? { backgroundColor: prioridadeCor, color: "white", border: "transparent" }
                  : undefined;

                return (
                  <TableRow key={item.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDateBR(item.data_abertura)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.beneficiaria?.nome_completo || "-"}
                    </TableCell>
                    <TableCell>
                      {item.origem_id?.nome || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant(item.status) as any}>
                        {item.status || "-"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {prioridadeCor ? (
                        <Badge style={badgeStyle}>
                          {item.prioridade_id?.nome || "-"}
                        </Badge>
                      ) : (
                        <Badge variant={prioridadeBadgeVariant(item.prioridade_id?.nome) as any}>
                          {item.prioridade_id?.nome || "-"}
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

