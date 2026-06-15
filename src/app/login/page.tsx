"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2 as LucideLoader2, Eye as LucideEye, EyeOff as LucideEyeOff } from "lucide-react";

// Bypass global Object prototype pollution from n8n-workflows.d.ts (which defines global 'in' property)
const Loader2 = LucideLoader2 as React.ComponentType<any>;
const Eye = LucideEye as React.ComponentType<any>;
const EyeOff = LucideEyeOff as React.ComponentType<any>;
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("error") === "unauthorized") {
        setError("Sua sessão expirou ou o token é inválido. Por favor, faça login novamente.");
      }
    }
  }, []);


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

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Painel de marca */}
      <div className="relative hidden w-1/2 flex-col items-center justify-center overflow-hidden p-12 lg:flex bg-gradient-to-br from-violet-600 via-fuchsia-600 to-purple-700">
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "26px 26px",
          }}
        />
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-16 bottom-0 h-72 w-72 rounded-full bg-fuchsia-300/20 blur-3xl" />
        <div className="relative z-10 max-w-md text-center text-white">
          <div className="mx-auto mb-8 inline-flex h-32 w-32 items-center justify-center rounded-3xl bg-white/95 shadow-xl shadow-black/20">
            <Image
              src="/logo.png"
              alt="SERMULHER"
              width={104}
              height={104}
              className="object-contain"
              priority
            />
          </div>
          <h1 className="mb-3 text-4xl font-bold tracking-tight">
            Portal SERMULHER
          </h1>
          <p className="text-base leading-relaxed text-white/85">
            Sistema Integrado de Gestão, Monitoramento e Acolhimento
          </p>
        </div>
      </div>

      {/* Formulário */}
      <div className="flex w-full flex-col items-center justify-center bg-card p-6 sm:p-8 lg:w-1/2">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:hidden">
            <Image
              src="/logo.png"
              alt="SERMULHER"
              width={88}
              height={88}
              className="mx-auto"
              priority
            />
          </div>

          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Acesso ao Sistema
            </h2>
            <p className="text-sm text-muted-foreground">
              Insira suas credenciais para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
                <p className="text-sm font-medium text-destructive">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email institucional</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@aracaju.se.gov.br"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="h-11 w-full text-base font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Autenticando...
                </>
              ) : (
                "Entrar no Sistema"
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Secretaria Municipal do Respeito às Políticas para as Mulheres
          </p>
        </div>
      </div>
    </div>
  );
}
