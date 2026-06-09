import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEscolaStats } from "./actions";
import {
  GraduationCap,
  Users,
  BookOpen,
  UserPlus,
  ArrowRight,
  Award,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function EscolaDashboardPage() {
  const statsResult = await getEscolaStats();
  const stats =
    statsResult.success && statsResult.data
      ? statsResult.data
      : {
        totalAlunos: 0,
        turmasAtivas: 0,
        alunosCertificados: 0,
      };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Escola da Mulher</h1>
          <p className="text-gray-500">
            Gestão de qualificação profissional e autonomia.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/escola/cursos">
            <Button variant="outline" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Gerir Cursos
            </Button>
          </Link>
          <Link href="/escola/turmas">
            <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2">
              <GraduationCap className="h-4 w-4" />
              Gerir Turmas
            </Button>
          </Link>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Alunas
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">
              {stats.totalAlunos}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Matrículas realizadas
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Turmas Ativas
            </CardTitle>
            <BookOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">
              {stats.turmasAtivas}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Turmas em andamento
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Certificados Emitidos
            </CardTitle>
            <Award className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700">
              {stats.alunosCertificados}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Alunas formadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Atalhos Rápidos */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 hidden">
        {/* Hidden for now as requested layout is specific, but keeping code structure just in case */}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Atalhos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Acesso Rápido</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Link href="/escola/turmas">
              <Button className="w-full justify-start gap-3" variant="outline" size="lg">
                <div className="p-2 bg-emerald-100 rounded-full text-emerald-600">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-semibold">Nova Turma</span>
                  <span className="text-xs text-muted-foreground">Criar uma nova turma</span>
                </div>
                <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
              </Button>
            </Link>
            <Link href="/escola/matriculas">
              <Button className="w-full justify-start gap-3" variant="outline" size="lg">
                <div className="p-2 bg-primary/10 rounded-full text-primary">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-semibold">Nova Matrícula</span>
                  <span className="text-xs text-muted-foreground">Matricular aluna</span>
                </div>
                <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
              </Button>
            </Link>
            <Link href="/escola/turmas?status=concluida">
              <Button className="w-full justify-start gap-3" variant="outline" size="lg">
                <div className="p-2 bg-amber-100 rounded-full text-amber-600">
                  <Award className="h-5 w-5" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-semibold">Emitir Certificado</span>
                  <span className="text-xs text-muted-foreground">Buscar turma concluída</span>
                </div>
                <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Lista Recente (Placeholder - Idealmente buscaria do banco) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Últimas Turmas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground text-center py-8">
              Funcionalidade "Últimas Turmas" será implementada na próxima iteração.
              <br />
              <Link href="/escola/turmas" className="text-primary underline mt-2 inline-block">
                Ver todas as turmas
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
