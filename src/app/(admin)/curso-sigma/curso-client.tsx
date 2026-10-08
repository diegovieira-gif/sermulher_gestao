"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  PlayCircle,
  Search,
  Users,
  MonitorPlay,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  agruparPorModulo,
  formatarDuracao,
  LIMIAR_CONCLUSAO,
  mesclarTrechos,
  percentualAssistido,
  progressoDoCurso,
  type Trecho,
} from "@/lib/curso-sigma";
import { registrarProgresso, type AulaCurso, type ProgressoAula, type ProgressoEquipe } from "./actions";

const ENVIO_A_CADA_MS = 15000;
const PROXIMA_EM_SEG = 5;

type Props = {
  aulas: AulaCurso[];
  progressoInicial: Record<string, ProgressoAula>;
  aulaInicial: number | null;
  equipe: ProgressoEquipe[] | null;
  erroEquipe: string | null;
};

export function CursoClient({ aulas, progressoInicial, aulaInicial, equipe, erroEquipe }: Props) {
  const router = useRouter();
  const [progresso, setProgresso] = useState(progressoInicial);

  // aula aberta: a do endereço, senão a primeira ainda não concluída
  const [aulaId, setAulaId] = useState<number | null>(() => {
    if (aulaInicial && aulas.some((a) => a.id === aulaInicial)) return aulaInicial;
    return (aulas.find((a) => !progressoInicial[String(a.id)]?.concluida) ?? aulas[0])?.id ?? null;
  });
  const indice = aulas.findIndex((a) => a.id === aulaId);
  const aula = indice >= 0 ? aulas[indice] : null;
  const anterior = indice > 0 ? aulas[indice - 1] : null;
  const proxima = indice >= 0 && indice < aulas.length - 1 ? aulas[indice + 1] : null;

  const abrir = useCallback(
    (id: number) => {
      setAulaId(id);
      router.replace(`/curso-sigma?aula=${id}`, { scroll: false });
    },
    [router],
  );

  const curso = useMemo(
    () =>
      progressoDoCurso(
        aulas.map((a) => a.id),
        Object.fromEntries(Object.entries(progresso).map(([k, v]) => [k, v.percentual])),
      ),
    [aulas, progresso],
  );

  if (!aulas.length) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
            <MonitorPlay className="size-10" />
            <p>Nenhuma aula publicada ainda. Volte em breve.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const conteudo = (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-4">
        {aula && (
          <Player
            key={aula.id}
            aula={aula}
            progresso={progresso[String(aula.id)]}
            proxima={proxima}
            onProgresso={(p) => setProgresso((atual) => ({ ...atual, [String(aula.id)]: p }))}
            onProxima={() => proxima && abrir(proxima.id)}
          />
        )}
        {aula && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>Aula {aula.codigo}</span>
              <span aria-hidden>·</span>
              <span>Módulo {aula.modulo}</span>
              {progresso[String(aula.id)]?.concluida && (
                <Badge className="gap-1 bg-green-600 hover:bg-green-600">
                  <CheckCircle2 className="size-3.5" /> Concluída
                </Badge>
              )}
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">{aula.titulo}</h2>
            {aula.descricao && <p className="max-w-3xl text-muted-foreground">{aula.descricao}</p>}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button variant="outline" disabled={!anterior} onClick={() => anterior && abrir(anterior.id)}>
                <ChevronLeft className="size-4" /> Aula anterior
              </Button>
              <Button disabled={!proxima} onClick={() => proxima && abrir(proxima.id)}>
                Próxima aula <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <Card className="h-fit lg:sticky lg:top-4">
        <CardHeader className="space-y-3 pb-3">
          <CardTitle className="text-base">Conteúdo do curso</CardTitle>
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{curso.percentual.toFixed(0)}% concluído</span>
              <span className="text-muted-foreground">
                {curso.concluidas} de {curso.total} aulas
              </span>
            </div>
            <Progress value={curso.percentual} aria-label="Progresso no curso" />
          </div>
        </CardHeader>
        <CardContent className="max-h-[70vh] space-y-4 overflow-y-auto px-3 pb-4">
          {agruparPorModulo(aulas).map((g) => (
            <div key={g.modulo} className="space-y-1">
              <p className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Módulo {g.modulo}
              </p>
              {g.aulas.map((a) => {
                const p = progresso[String(a.id)];
                const atual = a.id === aulaId;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => abrir(a.id)}
                    aria-current={atual ? "true" : undefined}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted",
                      atual && "bg-primary/10 hover:bg-primary/15",
                    )}
                  >
                    {p?.concluida ? (
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-600" aria-label="Concluída" />
                    ) : atual ? (
                      <PlayCircle className="mt-0.5 size-4 shrink-0 text-primary" aria-label="Assistindo" />
                    ) : (
                      <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                    )}
                    <span className="min-w-0 flex-1 space-y-1">
                      <span className={cn("block leading-snug", atual && "font-medium")}>
                        {a.codigo} · {a.titulo}
                      </span>
                      <span className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="size-3" /> {formatarDuracao(a.duracao_segundos)}
                        {p && !p.concluida && p.percentual > 0 && <span>· {p.percentual.toFixed(0)}% assistido</span>}
                      </span>
                      {p && !p.concluida && p.percentual > 0 && <Progress value={p.percentual} className="h-1" />}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Curso Sigma</h1>
        <p className="text-muted-foreground">Vídeo-aulas para aprender a usar o SIGMA, no seu ritmo.</p>
      </div>
      {equipe || erroEquipe ? (
        <Tabs defaultValue="aulas">
          <TabsList>
            <TabsTrigger value="aulas" className="gap-2">
              <MonitorPlay className="size-4" /> Aulas
            </TabsTrigger>
            <TabsTrigger value="equipe" className="gap-2">
              <Users className="size-4" /> Progresso da equipe
            </TabsTrigger>
          </TabsList>
          <TabsContent value="aulas" className="mt-4">
            {conteudo}
          </TabsContent>
          <TabsContent value="equipe" className="mt-4">
            {erroEquipe ? <p className="text-sm text-destructive">{erroEquipe}</p> : <Equipe linhas={equipe ?? []} />}
          </TabsContent>
        </Tabs>
      ) : (
        conteudo
      )}
    </div>
  );
}

/**
 * O player conta só o que TOCOU: cada atualização de tempo até 2 s depois da
 * anterior vira um trecho assistido; um salto (arrastar a barra) não conta.
 * Os trechos vão ao servidor a cada 15 s, ao pausar, ao terminar e ao sair.
 */
function Player({
  aula,
  progresso,
  proxima,
  onProgresso,
  onProxima,
}: {
  aula: AulaCurso;
  progresso: ProgressoAula | undefined;
  proxima: AulaCurso | null;
  onProgresso: (p: ProgressoAula) => void;
  onProxima: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const ultimo = useRef<number | null>(null);
  const pendentes = useRef<Trecho[]>([]);
  const conhecidos = useRef<Trecho[]>(progresso?.trechos ?? []);
  const concluida = useRef(!!progresso?.concluida);
  const enviando = useRef(false);
  const [contagem, setContagem] = useState<number | null>(null);
  const duracao = aula.duracao_segundos;

  const atualizarTela = useCallback(() => {
    const trechos = mesclarTrechos(conhecidos.current, pendentes.current);
    const percentual = Math.max(percentualAssistido(trechos, duracao), progresso?.percentual ?? 0);
    concluida.current = concluida.current || percentual >= LIMIAR_CONCLUSAO;
    onProgresso({
      trechos,
      percentual,
      concluida: concluida.current,
      posicao_segundos: video.current?.currentTime ?? 0,
    });
  }, [duracao, onProgresso, progresso?.percentual]);

  const enviar = useCallback(async () => {
    if (enviando.current || !pendentes.current.length) return;
    enviando.current = true;
    const lote = mesclarTrechos(pendentes.current);
    pendentes.current = [];
    try {
      const r = await registrarProgresso(aula.id, lote, video.current?.currentTime ?? 0);
      if (r.success) {
        conhecidos.current = mesclarTrechos(conhecidos.current, lote);
        concluida.current = concluida.current || r.concluida;
      } else {
        pendentes.current = mesclarTrechos(pendentes.current, lote); // tenta de novo no próximo envio
      }
    } catch {
      pendentes.current = mesclarTrechos(pendentes.current, lote);
    } finally {
      enviando.current = false;
    }
  }, [aula.id]);

  useEffect(() => {
    const intervalo = setInterval(enviar, ENVIO_A_CADA_MS);
    const aoSair = () => {
      if (document.visibilityState === "hidden") void enviar();
    };
    document.addEventListener("visibilitychange", aoSair);
    return () => {
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", aoSair);
      void enviar(); // troca de aula ou saída da página
    };
  }, [enviar]);

  // contagem regressiva para a próxima aula
  useEffect(() => {
    if (contagem === null) return;
    if (contagem <= 0) {
      setContagem(null);
      onProxima();
      return;
    }
    const t = setTimeout(() => setContagem((c) => (c === null ? null : c - 1)), 1000);
    return () => clearTimeout(t);
  }, [contagem, onProxima]);

  return (
    <div className="relative overflow-hidden rounded-xl bg-black shadow-lg">
      <video
        ref={video}
        className="aspect-video w-full"
        src={`/api/curso-sigma/${aula.id}/video`}
        poster={aula.temCapa ? `/api/curso-sigma/${aula.id}/capa` : undefined}
        controls
        controlsList="nodownload"
        playsInline
        preload="metadata"
        onContextMenu={(e) => e.preventDefault()}
        onLoadedMetadata={(e) => {
          // retoma de onde parou (se não estava no começo nem no fim)
          const pos = progresso?.posicao_segundos ?? 0;
          const v = e.currentTarget;
          if (pos > 5 && pos < (v.duration || duracao) - 5) v.currentTime = pos;
        }}
        onPlay={() => {
          setContagem(null);
          ultimo.current = video.current?.currentTime ?? null;
        }}
        onSeeking={() => {
          ultimo.current = null;
        }}
        onSeeked={(e) => {
          ultimo.current = e.currentTarget.currentTime;
        }}
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          const t = v.currentTime;
          const antes = ultimo.current;
          if (antes !== null && !v.seeking && t > antes && t - antes <= 2) {
            pendentes.current = mesclarTrechos(pendentes.current, [[antes, t]]);
            atualizarTela();
          }
          ultimo.current = t;
        }}
        onPause={() => void enviar()}
        onEnded={() => {
          void enviar();
          if (proxima) setContagem(PROXIMA_EM_SEG);
        }}
      />
      {contagem !== null && proxima && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80 p-6 text-center text-white">
          <p className="text-sm uppercase tracking-wide text-white/70">Próxima aula em {contagem}s</p>
          <p className="text-xl font-semibold">
            {proxima.codigo} · {proxima.titulo}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setContagem(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setContagem(null);
                onProxima();
              }}
            >
              Assistir agora <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Equipe({ linhas }: { linhas: ProgressoEquipe[] }) {
  const [busca, setBusca] = useState("");
  const filtradas = linhas.filter((l) =>
    `${l.nome} ${l.email} ${l.perfil}`.toLowerCase().includes(busca.trim().toLowerCase()),
  );
  const comecaram = linhas.filter((l) => l.percentual > 0).length;
  const terminaram = linhas.filter((l) => l.total > 0 && l.concluidas === l.total).length;

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base">Progresso da equipe no curso</CardTitle>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, e-mail ou perfil..."
              className="pl-8"
            />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {linhas.length} usuárias ativas · {comecaram} começaram · {terminaram} concluíram todas as aulas publicadas
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuária</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead className="w-[240px]">Progresso</TableHead>
              <TableHead className="text-center">Aulas concluídas</TableHead>
              <TableHead>Última atividade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtradas.map((l) => (
              <TableRow key={l.id}>
                <TableCell>
                  <div className="font-medium">{l.nome}</div>
                  <div className="text-xs text-muted-foreground">{l.email}</div>
                </TableCell>
                <TableCell>{l.perfil}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Progress value={l.percentual} className="h-2 flex-1" />
                    <span className="w-12 text-right text-sm font-medium">{l.percentual.toFixed(0)}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {l.concluidas} / {l.total}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {l.ultimaAtividade ? new Date(l.ultimaAtividade).toLocaleString("pt-BR") : "Ainda não começou"}
                </TableCell>
              </TableRow>
            ))}
            {!filtradas.length && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Nenhuma usuária encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
