"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, CalendarClock, CalendarX, Megaphone, UserPlus } from "lucide-react";
import {
  getMinhasNotificacoes,
  marcarComoLida,
  marcarTodasComoLidas,
} from "@/app/(admin)/notificacoes-actions";
import type { NotificacaoRegistro } from "@/lib/notificacoes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Ícone e cor por tipo — o aviso de remoção precisa se distinguir à primeira vista. */
const ESTILO = {
  escala_evento: { icone: UserPlus, cor: "text-emerald-600 bg-emerald-500/10" },
  lembrete_evento: { icone: CalendarClock, cor: "text-sky-600 bg-sky-500/10" },
  remocao_evento: { icone: CalendarX, cor: "text-rose-600 bg-rose-500/10" },
  alteracao_evento: { icone: Megaphone, cor: "text-amber-600 bg-amber-500/10" },
} as const;

function tempoRelativo(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const min = Math.floor((Date.now() - d.getTime()) / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const dias = Math.floor(h / 24);
  if (dias === 1) return "ontem";
  if (dias < 7) return `há ${dias} dias`;
  return d.toLocaleDateString("pt-BR");
}

/**
 * Sino de notificações.
 *
 * Busca sob demanda ao abrir e faz uma verificação leve a cada 2 minutos só
 * para o contador — evitar polling curto é deliberado: o aviso é útil, não
 * urgente, e a base é pequena.
 */
export function SinoNotificacoes() {
  const router = useRouter();
  const [itens, setItens] = useState<NotificacaoRegistro[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [carregando, setCarregando] = useState(false);
  const [, startTransicao] = useTransition();

  const carregar = useCallback(async () => {
    try {
      const r = await getMinhasNotificacoes();
      setItens(r.itens);
      setNaoLidas(r.naoLidas);
    } catch {
      // Falha no sino nunca deve atrapalhar o resto da tela.
    }
  }, []);

  useEffect(() => {
    carregar();
    const t = setInterval(carregar, 120_000);
    return () => clearInterval(t);
  }, [carregar]);

  const aoAbrir = (aberto: boolean) => {
    if (!aberto) return;
    setCarregando(true);
    carregar().finally(() => setCarregando(false));
  };

  const abrir = (n: NotificacaoRegistro) => {
    startTransicao(async () => {
      if (!n.lida_em) {
        await marcarComoLida(n.id);
        setItens((atual) =>
          atual.map((i) =>
            i.id === n.id ? { ...i, lida_em: new Date().toISOString() } : i,
          ),
        );
        setNaoLidas((v) => Math.max(0, v - 1));
      }
      if (n.link) router.push(n.link);
    });
  };

  const lerTodas = () => {
    startTransicao(async () => {
      await marcarTodasComoLidas();
      const agora = new Date().toISOString();
      setItens((atual) => atual.map((i) => ({ ...i, lida_em: i.lida_em ?? agora })));
      setNaoLidas(0);
    });
  };

  return (
    <DropdownMenu onOpenChange={aoAbrir}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full"
          aria-label={
            naoLidas > 0
              ? `Notificações: ${naoLidas} não lida(s)`
              : "Notificações"
          }
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
          {naoLidas > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
              {naoLidas > 9 ? "9+" : naoLidas}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[22rem] p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <p className="text-sm font-semibold">Notificações</p>
          {naoLidas > 0 && (
            <button
              type="button"
              onClick={lerTodas}
              className="text-xs font-medium text-primary hover:underline"
            >
              Marcar todas como lidas
            </button>
          )}
        </div>

        <div className="max-h-[26rem] overflow-auto">
          {carregando && itens.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              Carregando…
            </p>
          ) : itens.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              Nenhuma notificação por aqui.
            </p>
          ) : (
            itens.map((n) => {
              const estilo = ESTILO[n.tipo] ?? ESTILO.escala_evento;
              const Icone = estilo.icone;
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => abrir(n)}
                  className={`flex w-full items-start gap-3 border-b px-3 py-3 text-left transition-colors last:border-b-0 hover:bg-muted/60 ${
                    n.lida_em ? "" : "bg-primary/5"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${estilo.cor}`}
                  >
                    <Icone className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span
                        className={`text-sm leading-tight ${n.lida_em ? "font-medium" : "font-semibold"}`}
                      >
                        {n.titulo}
                      </span>
                      {!n.lida_em && (
                        <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {n.mensagem}
                    </span>
                    <span className="mt-1 block text-[11px] text-muted-foreground">
                      {tempoRelativo(n.date_created)}
                    </span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
