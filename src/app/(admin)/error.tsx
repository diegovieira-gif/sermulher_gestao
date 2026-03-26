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
    // Log the error to an error reporting service if needed
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md shadow-lg border-destructive/20">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-semibold text-destructive">
            Ops! Algo deu errado
          </CardTitle>
          <CardDescription className="text-base">
            Ocorreu um erro inesperado ao carregar os dados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 p-4 rounded-md border text-sm font-mono text-muted-foreground overflow-auto">
            {error.message || 'Erro desconhecido'}
          </div>
        </CardContent>
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
