"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Check, Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatarData } from "@/lib/datas";
import { mascararCpf, mascararTelefone } from "@/lib/utils";
import type { SugestaoCpf } from "@/lib/busca-cpf";
import {
  buscarCpfDaFicha,
  confirmarCpf,
  descartarSugestoes,
  type FichaLocalizar,
} from "./actions";

type Filtro = "pendentes" | "nao_buscadas" | "sem_resultado" | "descartadas" | "todas";

const ROTULOS: Record<Filtro, string> = {
  pendentes: "Para conferir",
  nao_buscadas: "Ainda não buscadas",
  sem_resultado: "Sem resultado",
  descartadas: "Descartadas",
  todas: "Todas",
};

function situacao(f: FichaLocalizar): Filtro {
  if (!f.sugestoes) return "nao_buscadas";
  if (f.sugestoes.situacao === "pendente") return "pendentes";
  if (f.sugestoes.situacao === "descartada") return "descartadas";
  return "sem_resultado";
}

export function LocalizarCpfClient({ fichasIniciais }: { fichasIniciais: FichaLocalizar[] }) {
  const [fichas, setFichas] = useState(fichasIniciais);
  const [filtro, setFiltro] = useState<Filtro>(
    fichasIniciais.some((f) => situacao(f) === "pendentes") ? "pendentes" : "nao_buscadas",
  );
  const [busca, setBusca] = useState("");
  const [ocupada, setOcupada] = useState<number | null>(null);

  const contagem = useMemo(() => {
    const c: Record<Filtro, number> = { pendentes: 0, nao_buscadas: 0, sem_resultado: 0, descartadas: 0, todas: fichas.length };
    for (const f of fichas) c[situacao(f)]++;
    return c;
  }, [fichas]);

  const visiveis = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return fichas
      .filter((f) => filtro === "todas" || situacao(f) === filtro)
      .filter((f) => !q || String(f.nome_completo).toLowerCase().includes(q));
  }, [fichas, filtro, busca]);

  const atualizar = (id: number, mudar: (f: FichaLocalizar) => FichaLocalizar | null) =>
    setFichas((lista) => lista.flatMap((f) => (f.id === id ? (mudar(f) ? [mudar(f)!] : []) : [f])));

  const buscar = async (f: FichaLocalizar) => {
    setOcupada(f.id);
    try {
      const r = await buscarCpfDaFicha(f.id);
      if (!r.success) return toast.error(r.error);
      atualizar(f.id, () => r.data);
      const n = r.data.sugestoes?.candidatos.length ?? 0;
      if (n) toast.success(`${n} candidato(s) para conferir.`);
      else toast.info("Nenhum cadastro encontrado no Hub para esta ficha.");
    } finally {
      setOcupada(null);
    }
  };

  const confirmar = async (f: FichaLocalizar, c: SugestaoCpf) => {
    if (!window.confirm(`Gravar o CPF ${mascararCpf(c.cpf)} na ficha de ${f.nome_completo}?`)) return;
    setOcupada(f.id);
    try {
      const r = await confirmarCpf(f.id, c.cpf);
      if (!r.success) return toast.error(r.error);
      toast.success("CPF gravado. Abra a ficha para completar os demais dados.");
      atualizar(f.id, () => null);
    } finally {
      setOcupada(null);
    }
  };

  const descartar = async (f: FichaLocalizar) => {
    setOcupada(f.id);
    try {
      const r = await descartarSugestoes(f.id);
      if (!r.success) return toast.error(r.error);
      atualizar(f.id, (x) => (x.sugestoes ? { ...x, sugestoes: { ...x.sugestoes, situacao: "descartada" } } : x));
    } finally {
      setOcupada(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 border-b border-border pb-5">
        <Link href="/mulheres/beneficiarias">
          <Button variant="ghost" size="icon" aria-label="Voltar">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Localizar CPF</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
            Fichas sem CPF, buscadas no Hub de Dados da Prefeitura por nome, telefone e nascimento. O
            resultado são <strong>candidatos</strong>: confira se é a mesma mulher antes de confirmar. Cada
            busca fica registrada na auditoria do Hub.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(ROTULOS) as Filtro[]).map((k) => (
          <Button key={k} size="sm" variant={filtro === k ? "default" : "outline"} onClick={() => setFiltro(k)}>
            {ROTULOS[k]} ({contagem[k]})
          </Button>
        ))}
        <Input
          placeholder="Filtrar por nome"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="ml-auto w-full sm:w-64"
        />
      </div>

      {visiveis.length === 0 ? (
        <p className="text-sm text-muted-foreground py-10 text-center">Nenhuma ficha nesta lista.</p>
      ) : (
        <ul className="space-y-3">
          {visiveis.map((f) => {
            const sug = f.sugestoes;
            const ocupadaAqui = ocupada === f.id;
            return (
              <li key={f.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <Link href={`/mulheres/beneficiarias/${f.id}`} className="font-semibold text-foreground hover:underline">
                    {f.nome_completo}
                  </Link>
                  <span className="text-xs text-muted-foreground">Ficha nº {f.id}</span>
                  <span className="text-sm text-muted-foreground">{f.telefone ? mascararTelefone(f.telefone) : "sem telefone"}</span>
                  <span className="text-sm text-muted-foreground">
                    {f.data_nascimento ? `nasc. ${formatarData(f.data_nascimento)}` : "sem nascimento"}
                  </span>
                  <Button size="sm" variant="outline" className="ml-auto" disabled={ocupadaAqui} onClick={() => buscar(f)}>
                    {ocupadaAqui ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Search className="h-3 w-3 mr-1" />}
                    {sug ? "Buscar de novo" : "Buscar no Hub"}
                  </Button>
                </div>

                {sug && (
                  <div className="text-xs text-muted-foreground">
                    Buscado em {formatarData(sug.buscado_em)} por {sug.buscas.join("; ")}.
                    {sug.truncado && " Havia mais resultados que o limite: confira com atenção."}
                    {sug.situacao === "descartada" && " Candidatos descartados."}
                  </div>
                )}

                {sug && sug.situacao !== "descartada" && sug.candidatos.length > 0 && (
                  <div className="space-y-2">
                    {sug.candidatos.map((c) => (
                      <div key={c.cpf} className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/40 px-3 py-2">
                        <span className="font-medium text-sm">{c.nome}</span>
                        <span className="font-mono text-sm">{mascararCpf(c.cpf)}</span>
                        <span className="text-sm text-muted-foreground">{c.data_nascimento ? formatarData(c.data_nascimento) : "-"}</span>
                        <Badge variant={c.nome_confere ? "default" : "outline"} className="text-[10px]">
                          {c.nome_confere ? "nome confere" : "nome diferente"}
                        </Badge>
                        {f.data_nascimento && (
                          <Badge variant={c.nascimento_confere ? "default" : "outline"} className="text-[10px]">
                            {c.nascimento_confere ? "nascimento confere" : "nascimento diferente"}
                          </Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground">achado por {c.criterios.join(", ")}</span>
                        <Button size="sm" className="ml-auto" disabled={ocupadaAqui} onClick={() => confirmar(f, c)}>
                          <Check className="h-3 w-3 mr-1" /> É ela
                        </Button>
                      </div>
                    ))}
                    <Button size="sm" variant="ghost" disabled={ocupadaAqui} onClick={() => descartar(f)}>
                      <X className="h-3 w-3 mr-1" /> Nenhum é ela
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
