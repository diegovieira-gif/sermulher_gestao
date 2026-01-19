"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Printer, CheckCircle2, XCircle } from "lucide-react";
import type { MatriculaComPerformance } from "../../actions";

interface ResultadosClientProps {
  performance: MatriculaComPerformance[];
}

export function ResultadosClient({ performance }: ResultadosClientProps) {
  const router = useRouter();

  const handlePrintCertificado = (matriculaId: number) => {
    // Abre nova aba com o certificado
    window.open(`/admin/escola/certificado/${matriculaId}`, "_blank");
  };

  if (performance.length === 0) {
    return (
      <div className="rounded-md border p-6 text-center text-muted-foreground">
        Nenhuma aluna matriculada para exibir resultados.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Resultados e Certificação</h3>
        <p className="text-sm text-muted-foreground">
          Frequência das alunas e opção de impressão de certificados
        </p>
      </div>

      {/* Tabela de Resultados */}
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Nome da Aluna</TableHead>
              <TableHead className="text-right">Presenças</TableHead>
              <TableHead className="text-right">Frequência</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {performance.map((item) => (
              <TableRow key={item.id}>
                {/* Nome da Aluna */}
                <TableCell className="font-medium">
                  {item.beneficiaria.nome_completo}
                </TableCell>

                {/* Presenças */}
                <TableCell className="text-right">
                  {item.presencas} / {item.aulas_totais}
                </TableCell>

                {/* Barra de Frequência + Percentual */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    {/* Barra de progresso visual */}
                    <div className="flex-1">
                      <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            item.frequencia_percentual >= 75
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${item.frequencia_percentual}%` }}
                        />
                      </div>
                    </div>
                    {/* Percentual */}
                    <span className="text-right text-sm font-semibold min-w-[50px]">
                      {item.frequencia_percentual.toFixed(1)}%
                    </span>
                  </div>
                </TableCell>

                {/* Status (Aprovada/Reprovada) */}
                <TableCell className="text-center">
                  {item.aprovada ? (
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="text-sm font-semibold">Aprovada</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-red-600">
                      <XCircle className="h-5 w-5" />
                      <span className="text-sm font-semibold">Reprovada</span>
                    </div>
                  )}
                </TableCell>

                {/* Botão de Imprimir Certificado */}
                <TableCell className="text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePrintCertificado(item.id)}
                    disabled={!item.aprovada}
                    title={
                      item.aprovada
                        ? "Imprimir certificado"
                        : "Aluna não atingiu 75% de frequência"
                    }
                    className="gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    <span className="hidden sm:inline">Certificado</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Resumo Estatístico */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total de Alunas */}
        <div className="rounded-md border p-4">
          <p className="text-sm text-muted-foreground">Total de Alunas</p>
          <p className="text-2xl font-bold">{performance.length}</p>
        </div>

        {/* Aprovadas */}
        <div className="rounded-md border p-4 border-green-200 bg-green-50">
          <p className="text-sm text-green-600">Aprovadas</p>
          <p className="text-2xl font-bold text-green-600">
            {performance.filter((p) => p.aprovada).length}
          </p>
        </div>

        {/* Reprovadas */}
        <div className="rounded-md border p-4 border-red-200 bg-red-50">
          <p className="text-sm text-red-600">Reprovadas</p>
          <p className="text-2xl font-bold text-red-600">
            {performance.filter((p) => !p.aprovada).length}
          </p>
        </div>
      </div>
    </div>
  );
}
