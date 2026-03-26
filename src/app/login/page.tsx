"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Ocorreu um erro ao fazer login.");
        setIsLoading(false);
        return;
      }

      // Login com sucesso! O cookie já foi definido pela API.
      router.push("/dashboard");
      router.refresh(); // Força a atualização do layout do admin
    } catch (err) {
      setError("Erro de conexão. Tente novamente.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="hidden lg:flex w-1/2 bg-blue-600 flex-col justify-center items-center text-white p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <Image src="/globe.svg" alt="Background" fill className="object-cover" />
        </div>
        <div className="z-10 text-center">
          <Image src="/logo.png" alt="SerMulher" width={180} height={180} className="mb-8 mx-auto drop-shadow-lg" />
          <h1 className="text-5xl font-bold mb-4 tracking-tight">Portal SerMulher</h1>
          <p className="text-blue-100 text-lg max-w-md mx-auto">
            Sistema Integrado de Gestão, Monitoramento e Acolhimento
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:hidden mb-8">
            <Image src="/logo.png" alt="SerMulher" width={120} height={120} className="mx-auto" />
            <h2 className="text-2xl font-bold mt-4 text-gray-900">Portal SerMulher</h2>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Acesso ao Sistema</h2>
            <p className="mt-2 text-sm text-gray-600">Insira suas credenciais para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}
            <div className="space-y-4 rounded-md shadow-sm">
              <div>
                <Label htmlFor="email" className="text-gray-700">Email institucional</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full"
                  placeholder="nome@aracaju.se.gov.br"
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-gray-700">Senha</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all h-11 text-base font-semibold"
              disabled={isLoading}
            >
              {isLoading ? "Autenticando..." : "Entrar no Sistema"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
