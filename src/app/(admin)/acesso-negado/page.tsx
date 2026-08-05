import Link from "next/link";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MENU_REGISTRY } from "@/lib/menu-registry";

/**
 * Página 403 real. O gate de navegação do layout redireciona para cá quando o
 * perfil não tem a chave do módulo — antes o usuário era jogado no dashboard
 * sem explicação nenhuma, o que parecia bug ("cliquei e voltou").
 */
export default async function AcessoNegadoPage({
  searchParams,
}: {
  searchParams: Promise<{ de?: string }>;
}) {
  const { de } = await searchParams;
  const modulo = MENU_REGISTRY.find((m) => m.key === de)?.label;

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader className="space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <ShieldX className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-semibold">
            Acesso não permitido
          </CardTitle>
          <CardDescription className="text-base">
            {modulo
              ? `Seu perfil não tem permissão para o módulo "${modulo}".`
              : "Seu perfil não tem permissão para esta área do sistema."}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Se você precisa deste acesso para o seu trabalho, solicite à
          administração do sistema a liberação do módulo para o seu perfil em
          Configurações → Permissões.
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full">
            <Link href="/dashboard">Voltar para o Dashboard</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
