'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  // O erro de `assertAccess` é escrito para o usuário e pode ser exibido.
  // Qualquer outro `error.message` é detalhe interno (stack de SDK, URL de
  // serviço, nome de coleção) e NÃO deve vazar — mostramos texto genérico e o
  // `digest`, que permite localizar o erro real no log do servidor.
  const acessoNegado = error.message?.startsWith('Acesso negado');

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md shadow-lg border-destructive/20">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-semibold text-destructive">
            {acessoNegado ? 'Acesso não permitido' : 'Ops! Algo deu errado'}
          </CardTitle>
          <CardDescription className="text-base">
            {acessoNegado
              ? error.message
              : 'Ocorreu um erro inesperado ao carregar os dados. Tente novamente; se o problema continuar, informe o suporte.'}
          </CardDescription>
        </CardHeader>
        {!acessoNegado && error.digest && (
          <CardContent>
            <p className="text-center text-xs text-muted-foreground">
              Código para o suporte: <span className="font-mono">{error.digest}</span>
            </p>
          </CardContent>
        )}
        <CardFooter className="flex flex-col sm:flex-row gap-3">
          <Button
            className="w-full"
            onClick={() => reset()}
          >
            Tentar Novamente
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push('/login')}
          >
            Voltar para o Login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
