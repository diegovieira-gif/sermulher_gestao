"use client";

import {
  endOfMonth,
  format,
  isSameMonth,
  isWeekend,
  startOfMonth,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import type { CalendarEvent } from "./actions";

/**
 * Documento impresso da Agenda Institucional.
 *
 * NÃO é a grade do calendário no papel. A grade existe para dar noção de
 * densidade num relance: cada célula cabe uma linha por evento, o título vem
 * truncado e local e descrição simplesmente não aparecem. Impressa, ela vira
 * um retrato ilegível de uma tela.
 *
 * Aqui a agenda é reorganizada como o documento que alguém leva para uma
 * reunião: ordem cronológica, um bloco por dia, e cada compromisso com hora,
 * local, origem e descrição por extenso.
 *
 * Fica oculto na tela (`hidden print:block`) e só aparece na impressão, então
 * a experiência de uso do calendário não muda.
 */

interface AgendaImpressaoProps {
  eventos: CalendarEvent[];
  /** Mês exibido no calendário — o documento acompanha a navegação. */
  mesReferencia: Date;
  /** Origens desligadas na legenda: o papel reflete o que está na tela. */
  origensOcultas: Set<string>;
}

const ROTULO_ORIGEM: Record<string, string> = {
  manual: "Evento",
  escola: "Escola",
  sala_azul: "Sala Azul",
};

export function AgendaImpressao({
  eventos,
  mesReferencia,
  origensOcultas,
}: AgendaImpressaoProps) {
  const inicio = startOfMonth(mesReferencia);
  const fim = endOfMonth(mesReferencia);

  const doMes = eventos
    .filter((e) => isSameMonth(e.start, inicio))
    .filter((e) => !origensOcultas.has(e.type))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  // Agrupa por dia preservando a ordem cronológica.
  const porDia = new Map<string, CalendarEvent[]>();
  for (const evento of doMes) {
    const chave = format(evento.start, "yyyy-MM-dd");
    if (!porDia.has(chave)) porDia.set(chave, []);
    porDia.get(chave)!.push(evento);
  }

  const totalPorOrigem = (tipo: string) =>
    doMes.filter((e) => e.type === tipo).length;

  const emitidoEm = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

  return (
    <div id="agenda-impressao" className="hidden print:block">
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 14mm 12mm;
          }
          /* Esconde a aplicação inteira e mostra apenas o documento. */
          body * {
            visibility: hidden;
          }
          #agenda-impressao,
          #agenda-impressao * {
            visibility: visible;
          }
          #agenda-impressao {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
          }
          /* Um dia nunca deve começar no rodapé e continuar na página seguinte. */
          .dia-bloco {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          /* As cores das tarjas precisam sobreviver à impressão. */
          .tarja {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      {/* Cabeçalho institucional */}
      <header className="mb-5 border-b-2 border-black pb-3 text-center">
        <h1 className="text-base font-bold uppercase tracking-wide">
          Prefeitura Municipal de Aracaju
        </h1>
        <h2 className="text-sm font-semibold uppercase">
          Secretaria Municipal do Respeito às Políticas para as Mulheres
        </h2>
        <p className="mt-3 inline-block border border-black px-6 py-1 text-base font-bold uppercase">
          Agenda Institucional
        </p>
        <p className="mt-2 text-sm font-semibold uppercase">
          {format(inicio, "MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </header>

      {/* Resumo do período */}
      <section className="mb-5">
        <table className="w-full border-collapse border border-black text-xs">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-black p-1.5 text-left">
                Compromissos no período
              </th>
              <th className="border border-black p-1.5 text-center w-24">
                Quantidade
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black p-1.5">
                Eventos e campanhas da Secretaria
              </td>
              <td className="border border-black p-1.5 text-center font-semibold">
                {totalPorOrigem("manual")}
              </td>
            </tr>
            <tr>
              <td className="border border-black p-1.5">
                Escola da Mulher (turmas)
              </td>
              <td className="border border-black p-1.5 text-center font-semibold">
                {totalPorOrigem("escola")}
              </td>
            </tr>
            <tr>
              <td className="border border-black p-1.5">
                Sala Azul (sessões de grupo reflexivo)
              </td>
              <td className="border border-black p-1.5 text-center font-semibold">
                {totalPorOrigem("sala_azul")}
              </td>
            </tr>
            <tr className="bg-gray-100">
              <td className="border border-black p-1.5 text-right font-bold">
                TOTAL
              </td>
              <td className="border border-black p-1.5 text-center text-sm font-bold">
                {doMes.length}
              </td>
            </tr>
          </tbody>
        </table>
        {origensOcultas.size > 0 && (
          <p className="mt-1.5 text-[10px] italic text-gray-600">
            * Este documento reflete os filtros aplicados na tela — há
            categorias ocultas.
          </p>
        )}
      </section>

      {/* Corpo: um bloco por dia */}
      {doMes.length === 0 ? (
        <p className="py-8 text-center text-sm italic text-gray-600">
          Nenhum compromisso registrado neste mês.
        </p>
      ) : (
        <section className="space-y-3">
          {Array.from(porDia.entries()).map(([chave, doDia]) => {
            const data = doDia[0].start;
            const fimDeSemana = isWeekend(data);

            return (
              <div key={chave} className="dia-bloco">
                {/* Faixa do dia */}
                <div
                  className={`flex items-baseline gap-2 border-l-4 border-black px-2 py-1 ${
                    fimDeSemana ? "bg-gray-200" : "bg-gray-100"
                  }`}
                >
                  <span className="text-sm font-bold">
                    {format(data, "dd/MM", { locale: ptBR })}
                  </span>
                  <span className="text-xs font-semibold uppercase">
                    {format(data, "EEEE", { locale: ptBR })}
                  </span>
                  <span className="ml-auto text-[10px] text-gray-600">
                    {doDia.length}{" "}
                    {doDia.length === 1 ? "compromisso" : "compromissos"}
                  </span>
                </div>

                {/* Compromissos do dia */}
                <table className="w-full border-collapse text-xs">
                  <tbody>
                    {doDia.map((evento) => (
                      <tr
                        key={evento.id}
                        className="border-b border-gray-300 align-top"
                      >
                        {/* Horário */}
                        <td className="w-16 py-1.5 pl-2 pr-1 font-mono text-[11px] font-semibold">
                          {evento.allDay ? (
                            <span className="text-gray-600">dia todo</span>
                          ) : (
                            format(evento.start, "HH:mm")
                          )}
                        </td>

                        {/* Origem: tarja colorida + rótulo, para o documento
                            continuar legível impresso em preto e branco. */}
                        <td className="w-24 py-1.5 pr-2">
                          <span className="flex items-center gap-1">
                            <span
                              className="tarja inline-block h-2.5 w-2.5 shrink-0 rounded-sm border border-gray-500"
                              style={{ backgroundColor: evento.color }}
                            />
                            <span className="text-[10px] uppercase tracking-wide">
                              {ROTULO_ORIGEM[evento.type] ?? evento.type}
                            </span>
                          </span>
                        </td>

                        {/* Título, local e descrição */}
                        <td className="py-1.5 pr-2">
                          <p className="font-semibold leading-tight">
                            {evento.title}
                          </p>
                          {evento.description && (
                            <p className="mt-0.5 text-[11px] leading-snug text-gray-700">
                              {evento.description}
                            </p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </section>
      )}

      {/* Rodapé */}
      <footer className="mt-6 border-t border-gray-400 pt-2 text-[10px] text-gray-600">
        <div className="flex justify-between">
          <span>
            Emitido pelo SIGMA em {emitidoEm} — período de{" "}
            {format(inicio, "dd/MM/yyyy")} a {format(fim, "dd/MM/yyyy")}.
          </span>
          <span>Página 1</span>
        </div>
      </footer>

      {/* Assinaturas: o documento circula impresso entre coordenação e equipe. */}
      <div className="mt-10 grid grid-cols-2 gap-12 text-center text-[11px]">
        <div className="border-t border-black pt-1">Responsável pela Agenda</div>
        <div className="border-t border-black pt-1">Coordenação</div>
      </div>
    </div>
  );
}
