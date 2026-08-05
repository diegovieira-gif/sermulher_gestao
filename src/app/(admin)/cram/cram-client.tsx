"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Search,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import {
  deleteInstrumental,
  type InstrumentaisMeta,
  type InstrumentalListItem,
} from "./actions";
import { calcularRisco } from "./schemas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const formatarData = (valor?: string | null) => {
  if (!valor) return "—";
  const [ano, mes, dia] = valor.slice(0, 10).split("-");
  return dia && mes && ano ? `${dia}/${mes}/${ano}` : valor;
};

const formatarCpf = (cpf?: string) => {
  if (!cpf) return "";
  const digitos = cpf.replace(/\D/g, "");
  if (digitos.length !== 11) return cpf;
  return digitos.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

const CORES_RISCO: Record<string, string> = {
  Alto: "bg-red-100 text-red-800 border-red-200",
  Médio: "bg-amber-100 text-amber-800 border-amber-200",
  Baixo: "bg-yellow-50 text-yellow-800 border-yellow-200",
  "Sem sinais": "bg-slate-100 text-slate-600 border-slate-200",
};

const CORES_STATUS: Record<string, string> = {
  "Em preenchimento": "bg-blue-50 text-blue-700 border-blue-200",
  Concluído: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Arquivado: "bg-slate-100 text-slate-600 border-slate-200",
};

interface CramClientProps {
  initialData: InstrumentalListItem[];
  meta?: InstrumentaisMeta;
}

export function CramClient({ initialData, meta }: CramClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const buscaUrl = searchParams.get("q") ?? "";
  const [busca, setBusca] = useState(buscaUrl);
  const [paraExcluir, setParaExcluir] = useState<InstrumentalListItem | null>(null);
  const [excluindo, startExclusao] = useTransition();

  // A busca roda no servidor (nome ou CPF, via Directus) — filtrar só o que já
  // está no client deixava de fora qualquer registro além da página carregada.
  useEffect(() => {
    const handler = setTimeout(() => {
      if (busca !== buscaUrl) {
        const params = new URLSearchParams(searchParams.toString());
        if (busca.trim()) params.set("q", busca.trim());
        else params.delete("q");
        params.delete("page");
        router.push(`${pathname}?${params.toString()}`);
      }
    }, 400);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca]);

  // Ressincroniza quando a URL muda por fora (voltar/avançar do navegador).
  useEffect(() => {
    setBusca(buscaUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buscaUrl]);

  const irParaPagina = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (page <= 1) params.delete("page");
      else params.set("page", String(page));
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  const filtrados = initialData;

  const confirmarExclusao = () => {
    if (!paraExcluir) return;
    startExclusao(async () => {
      const resultado = await deleteInstrumental(paraExcluir.id);
      if (resultado.success) {
        toast.success("Atendimento excluído.");
        setParaExcluir(null);
        router.refresh();
      } else {
        toast.error(resultado.error || "Erro ao excluir.");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busca}
          onChange={(event) => setBusca(event.target.value)}
          placeholder="Buscar por nome ou CPF da assistida..."
          className="pl-9"
          aria-label="Buscar atendimento"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assistida</TableHead>
                <TableHead className="w-[120px]">Data</TableHead>
                <TableHead className="w-[90px]">Turno</TableHead>
                <TableHead>Violência</TableHead>
                <TableHead className="w-[140px]">Risco</TableHead>
                <TableHead className="w-[150px]">Status</TableHead>
                <TableHead className="w-[110px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    {buscaUrl
                      ? "Nenhum atendimento corresponde à busca."
                      : "Nenhum instrumental registrado ainda."}
                  </TableCell>
                </TableRow>
              ) : (
                filtrados.map((item) => {
                  const risco = calcularRisco(item.risco ?? {});
                  const violencias = Array.isArray(item.tipos_violencia)
                    ? item.tipos_violencia
                    : [];
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <Link
                            href={`/cram/${item.id}`}
                            className="font-medium hover:underline"
                          >
                            {item.beneficiaria?.nome_completo ?? "Assistida removida"}
                          </Link>
                          {item.beneficiaria?.cpf && (
                            <span className="text-xs text-muted-foreground">
                              CPF: {formatarCpf(item.beneficiaria.cpf)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatarData(item.data_atendimento)}</TableCell>
                      <TableCell>{item.turno ?? "—"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {violencias.length === 0 ? (
                            <span className="text-xs text-muted-foreground">—</span>
                          ) : (
                            violencias.map((tipo) => (
                              <Badge key={tipo} variant="secondary" className="text-xs">
                                {tipo}
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
                            CORES_RISCO[risco.nivel] ?? CORES_RISCO["Sem sinais"]
                          }`}
                        >
                          {risco.nivel !== "Sem sinais" && (
                            <ShieldAlert className="size-3" aria-hidden />
                          )}
                          {risco.nivel} ({risco.positivas}/{risco.total})
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${
                            CORES_STATUS[item.status] ?? CORES_STATUS.Arquivado
                          }`}
                        >
                          {item.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button asChild variant="ghost" size="icon" title="Abrir">
                            <Link href={`/cram/${item.id}`}>
                              <Pencil className="size-4" />
                              <span className="sr-only">Abrir atendimento</span>
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Excluir"
                            onClick={() => setParaExcluir(item)}
                          >
                            <Trash2 className="size-4 text-destructive" />
                            <span className="sr-only">Excluir atendimento</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {meta && meta.total > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 text-sm text-muted-foreground sm:flex-row">
          <div>
            Mostrando <strong>{(meta.page - 1) * meta.limit + 1}</strong> a{" "}
            <strong>{Math.min(meta.page * meta.limit, meta.total)}</strong> de{" "}
            <strong>{meta.total}</strong> atendimentos
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => irParaPagina(meta.page - 1)}
              disabled={meta.page <= 1}
            >
              <ChevronLeft className="mr-1 size-4" /> Anterior
            </Button>
            <span>
              Página {meta.page} de {meta.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => irParaPagina(meta.page + 1)}
              disabled={meta.page >= meta.totalPages}
            >
              Próxima <ChevronRight className="ml-1 size-4" />
            </Button>
          </div>
        </div>
      )}

      <AlertDialog
        open={paraExcluir !== null}
        onOpenChange={(aberto) => !aberto && setParaExcluir(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir instrumental?</AlertDialogTitle>
            <AlertDialogDescription>
              O atendimento de{" "}
              <strong>{paraExcluir?.beneficiaria?.nome_completo ?? "—"}</strong> em{" "}
              {formatarData(paraExcluir?.data_atendimento)} será removido, junto com a
              composição domiciliar registrada. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluindo}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                confirmarExclusao();
              }}
              disabled={excluindo}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {excluindo && <Loader2 className="mr-2 size-4 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
