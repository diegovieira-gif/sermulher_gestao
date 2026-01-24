"use client";

import { useActionState } from "react";
import Image from "next/image";
import { login } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Estado inicial do formulário
const initialState = {
  message: "",
};

function SubmitButton({ isPending }: { isPending: boolean }) {
  return (
    <Button
      className="w-full bg-purple-600 hover:bg-purple-700"
      type="submit"
      disabled={isPending}
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Entrando...
        </>
      ) : (
        "Acessar Sistema"
      )}
    </Button>
  );
}

export default function LoginPage() {
  // ATUALIZAÇÃO: useFormState -> useActionState
  // O useActionState retorna [state, action, isPending] nativamente no React 19
  const [state, formAction, isPending] = useActionState(login, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo e Cabeçalho */}
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="relative mb-2 h-24 w-auto aspect-square">
            {/* ATUALIZAÇÃO: Uso da logo.png */}
            <Image
              src="/logo.png"
              alt="Logo SerMulher"
              width={120}
              height={120}
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            SerMulher
          </h1>
          <p className="text-sm text-gray-500">
            Sistema de Gestão Integrada de Políticas para as Mulheres
          </p>
        </div>

        <Card className="border-0 shadow-lg sm:rounded-xl">
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="text-xl text-center">Login</CardTitle>
            <CardDescription className="text-center">
              Entre com suas credenciais de acesso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu.email@exemplo.com"
                  required
                  className="bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="bg-gray-50"
                />
              </div>

              {state?.message && (
                <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md border border-red-100 text-center">
                  {state.message}
                </div>
              )}

              <div className="pt-2">
                <SubmitButton isPending={isPending} />
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2 text-center text-sm text-gray-500">
            <p>Esqueceu sua senha? Contate o administrador.</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
