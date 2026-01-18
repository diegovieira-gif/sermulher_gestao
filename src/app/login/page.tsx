'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { login } from './actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, LogIn, ShieldCheck } from 'lucide-react';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button 
      type="submit" 
      className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-lg transition-all duration-200"
      disabled={pending}
    >
      {pending ? (
        <>
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          Autenticando...
        </>
      ) : (
        <>
          <LogIn className="mr-2 h-4 w-4" />
          Entrar no Sistema
        </>
      )}
    </Button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState(login, undefined);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8 space-y-2">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 dark:bg-primary/20 p-4 rounded-2xl">
              <ShieldCheck className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Gestão SERMULHER
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Secretaria Municipal do Respeito às Políticas para as Mulheres
          </p>
        </div>

        {/* Card de Login */}
        <Card className="shadow-2xl border-slate-200 dark:border-slate-700">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold text-center">
              Acesso ao Sistema
            </CardTitle>
            <CardDescription className="text-center">
              Digite suas credenciais para continuar
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form action={formAction} className="space-y-5">
              {/* Mensagem de Erro */}
              {state?.error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 dark:text-red-300 font-medium">
                    {state.error}
                  </p>
                </div>
              )}

              {/* Campo Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu.email@exemplo.com"
                  required
                  autoComplete="email"
                  className="h-11 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:border-primary focus:ring-primary"
                />
              </div>

              {/* Campo Senha */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Senha
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="h-11 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:border-primary focus:ring-primary"
                />
              </div>

              {/* Botão de Submit */}
              <div className="pt-2">
                <SubmitButton />
              </div>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Protegido por autenticação segura
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Info Adicional */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Em caso de problemas de acesso, contate o administrador do sistema.
          </p>
        </div>
      </div>
    </div>
  );
}
