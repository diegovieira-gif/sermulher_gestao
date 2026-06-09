import Link from "next/link";
import {
  HeartHandshake,
  LayoutGrid,
  Briefcase,
  Megaphone,
  GraduationCap,
  FileText,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getCampanhas,
  getCategorias,
  getContatos,
  getCursos,
  getProjetos,
  getServicos,
  getSonhos,
} from "./actions";

const APP_AMAR_SECTIONS = [
  {
    title: "Categorias",
    description: "Organize os temas e classificações do App Amar.",
    href: "/app-amar/categorias",
    icon: LayoutGrid,
  },
  {
    title: "Serviços",
    description: "Cadastre e mantenha os serviços disponíveis no aplicativo.",
    href: "/app-amar/servicos",
    icon: Briefcase,
  },
  {
    title: "Campanhas",
    description: "Gerencie postagens e campanhas de divulgação.",
    href: "/app-amar/campanhas",
    icon: Megaphone,
  },
  {
    title: "Sonhos",
    description: "Acompanhe sonhos, metas e arrecadações.",
    href: "/app-amar/sonhos",
    icon: HeartHandshake,
  },
  {
    title: "Cursos",
    description: "Gerencie cursos vinculados às categorias do App Amar.",
    href: "/app-amar/cursos",
    icon: GraduationCap,
  },
  {
    title: "Contatos",
    description: "Visualize e trate mensagens enviadas pelo site público.",
    href: "/app-amar/contatos",
    icon: FileText,
  },
  {
    title: "Projetos",
    description: "Mantenha os projetos e conteúdos institucionais.",
    href: "/app-amar/projetos",
    icon: Calendar,
  },
];

export const dynamic = "force-dynamic";

export default async function AppAmarPage() {
  const [categorias, servicos, campanhas, sonhos, cursos, contatos, projetos] =
    await Promise.all([
      getCategorias(),
      getServicos(),
      getCampanhas(),
      getSonhos(),
      getCursos(),
      getContatos(),
      getProjetos(),
    ]);

  const totalizadores = [
    {
      label: "Categorias",
      total: Array.isArray(categorias) ? categorias.length : 0,
    },
    { label: "Serviços", total: Array.isArray(servicos) ? servicos.length : 0 },
    {
      label: "Campanhas",
      total: Array.isArray(campanhas) ? campanhas.length : 0,
    },
    { label: "Sonhos", total: Array.isArray(sonhos) ? sonhos.length : 0 },
    { label: "Cursos", total: Array.isArray(cursos) ? cursos.length : 0 },
    { label: "Contatos", total: Array.isArray(contatos) ? contatos.length : 0 },
    { label: "Projetos", total: Array.isArray(projetos) ? projetos.length : 0 },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">App Amar</h1>
          <p className="text-gray-500">
            Painel de gestão de conteúdo e relacionamento do aplicativo.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {totalizadores.map((item) => (
          <Card key={item.label} className="shadow-sm">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm text-muted-foreground">
                {item.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-900">{item.total}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {APP_AMAR_SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <Card
              key={section.href}
              className="shadow-sm hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {section.description}
                </p>
                <Button asChild className="w-full justify-between">
                  <Link href={section.href}>
                    Acessar
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
