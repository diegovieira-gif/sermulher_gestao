import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEscolaStats } from "./actions";
import {
  GraduationCap,
  Users,
  BookOpen,
  UserPlus,
  ArrowRight,
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
          total_turmas: 0,
          turmas_ativas: 0,
          total_cursos: 0,
          total_matriculas: 0,
          matriculas_ativas: 0,
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Turmas Ativas</CardTitle>
            <GraduationCap className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.turmas_ativas}</div>
            <p className="text-xs text-muted-foreground">
              de {stats.total_turmas} turmas totais
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Alunas Matriculadas
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.matriculas_ativas}</div>
            <p className="text-xs text-muted-foreground">
              Estudando neste momento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Catálogo de Cursos
            </CardTitle>
            <BookOpen className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_cursos}</div>
            <p className="text-xs text-muted-foreground">
              Cursos disponíveis na base
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Histórico
            </CardTitle>
            <UserPlus className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_matriculas}</div>
            <p className="text-xs text-muted-foreground">
              Matrículas realizadas desde o início
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Atalhos Rápidos */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-emerald-50 border-emerald-100">
          <CardHeader>
            <CardTitle className="text-emerald-900">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link
              href="/escola/matriculas"
              className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Users className="h-4 w-4 text-emerald-700" />
                </div>
                <span className="font-medium text-gray-700">
                  Ver todas as matrículas
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-emerald-600" />
            </Link>
            <Link
              href="/escola/cursos"
              className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-purple-700" />
                </div>
                <span className="font-medium text-gray-700">
                  Cadastrar novo curso
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-purple-600" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
