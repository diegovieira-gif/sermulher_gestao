import { getAllMatriculas } from "../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MatriculasGlobalPage() {
  const result = await getAllMatriculas();
  const matriculas = result.success && result.data ? result.data : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            Matrículas Gerais
          </h1>
          <p className="text-gray-500">
            Visão unificada de todas as alunas em todas as turmas.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Buscar (esta tela exibe as últimas 100)..."
              className="pl-9"
              disabled
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluna</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Turma / Curso</TableHead>
                <TableHead>Data Matrícula</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matriculas.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-gray-500"
                  >
                    Nenhuma matrícula encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                matriculas.map((mat: any) => (
                  <TableRow key={mat.id}>
                    <TableCell className="font-medium">
                      {mat.beneficiaria?.nome_completo || "Nome não disponível"}
                    </TableCell>
                    <TableCell>{mat.beneficiaria?.cpf || "-"}</TableCell>
                    <TableCell>{mat.turma?.nome || "Turma removida"}</TableCell>
                    <TableCell>
                      {new Date(mat.data_matricula).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          mat.status === "ativa" || mat.status === "aprovada"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {mat.status?.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/escola/turmas/${mat.turma?.id}`}>
                        <Button variant="ghost" size="sm">
                          Ver Turma
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
