import Link from "next/link";
import {
  Activity,
  CalendarCheck,
  Gift,
  GraduationCap,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateDisplay } from "@/lib/utils";
import type { EventoLinhaDoTempo } from "../actions";

/**
 * Linha do tempo unificada da beneficiária: atendimentos, CRAM, benefícios,
 * eventos e cursos numa única visão cronológica — o "resumo do caso" que uma
 * técnica consulta antes de atender.
 */

const ESTILO: Record<
  EventoLinhaDoTempo["tipo"],
  { icone: LucideIcon; cor: string; rotulo: string }
> = {
  atendimento: { icone: Activity, cor: "bg-fuchsia-100 text-fuchsia-700", rotulo: "Atendimento" },
  cram: { icone: ShieldAlert, cor: "bg-red-100 text-red-700", rotulo: "CRAM" },
  beneficio: { icone: Gift, cor: "bg-emerald-100 text-emerald-700", rotulo: "Benefício" },
  evento: { icone: CalendarCheck, cor: "bg-sky-100 text-sky-700", rotulo: "Evento" },
  curso: { icone: GraduationCap, cor: "bg-indigo-100 text-indigo-700", rotulo: "Curso" },
};

export function LinhaDoTempoTab({
  eventos,
  parcial,
}: {
  eventos: EventoLinhaDoTempo[];
  parcial?: boolean;
}) {
  if (eventos.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Nenhum registro ainda — atendimentos, benefícios, eventos e cursos
          aparecerão aqui em ordem cronológica.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        {parcial && (
          <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Alguns módulos não puderam ser consultados — a linha do tempo pode
            estar incompleta.
          </p>
        )}
        <ol className="relative space-y-6 border-l border-border pl-6">
          {eventos.map((evento, i) => {
            const estilo = ESTILO[evento.tipo];
            const Icone = estilo.icone;
            const conteudo = (
              <div className="flex flex-col gap-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${estilo.cor}`}
                  >
                    <Icone className="size-3" aria-hidden />
                    {estilo.rotulo}
                  </span>
                  <time className="text-xs font-medium text-muted-foreground">
                    {formatDateDisplay(evento.data)}
                  </time>
                </div>
                <p className="text-sm font-medium text-foreground">
                  {evento.titulo}
                </p>
                {evento.detalhe && (
                  <p className="text-xs text-muted-foreground">{evento.detalhe}</p>
                )}
              </div>
            );

            return (
              <li key={`${evento.tipo}-${evento.data}-${i}`} className="relative">
                <span
                  className={`absolute -left-[31px] top-0.5 flex size-5 items-center justify-center rounded-full ring-4 ring-background ${estilo.cor}`}
                >
                  <Icone className="size-3" aria-hidden />
                </span>
                {evento.href ? (
                  <Link
                    href={evento.href}
                    className="block rounded-md p-1 -m-1 transition-colors hover:bg-muted/60"
                  >
                    {conteudo}
                  </Link>
                ) : (
                  conteudo
                )}
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
