"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Repeat } from "lucide-react";

type TipoEventoOption = { id: number; nome: string; icone?: string };

interface EventosCalendarioClientProps {
  eventos: any[];
  tiposEventoOptions: TipoEventoOption[];
}

// Formatar data para exibição
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

// Formatar data curta (dia/mês)
function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

// Verificar se duas datas são do mesmo dia
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

// Verificar se uma data está dentro de um intervalo
function isDateInRange(date: Date, startDate: Date, endDate: Date): boolean {
  const dateTime = date.getTime();
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  return dateTime >= startTime && dateTime <= endTime;
}

// Função para calcular o status do evento
function calcularStatus(dataInicio: string, dataFim: string): "Encerrado" | "Em Andamento" | "Breve" {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const inicio = new Date(dataInicio);
  inicio.setHours(0, 0, 0, 0);

  const fim = new Date(dataFim);
  fim.setHours(0, 0, 0, 0);

  if (hoje > fim) {
    return "Encerrado";
  } else if (hoje >= inicio && hoje <= fim) {
    return "Em Andamento";
  } else {
    return "Breve";
  }
}

// Gerar calendário para o mês
function generateCalendar(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  const days: Date[] = [];
  const current = new Date(startDate);

  // 42 dias = 6 semanas
  for (let i = 0; i < 42; i++) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return days;
}

// Converter eventos para formato do calendário
function transformarEventos(eventos: any[], tiposEventoOptions: TipoEventoOption[]) {
  return eventos.map((evento) => {
    const dataInicio = new Date(evento.data_inicio);
    dataInicio.setHours(0, 0, 0, 0);
    const dataFim = new Date(evento.data_fim);
    dataFim.setHours(0, 0, 0, 0);

    const tipoObj = 
      typeof evento.tipo_id === "object" && evento.tipo_id !== null
        ? evento.tipo_id
        : typeof evento.tipo_id === "number"
        ? tiposEventoOptions.find((t) => t.id === evento.tipo_id)
        : null;

    return {
      id: evento.id,
      nome: evento.nome,
      dataInicio,
      dataFim,
      tipoNome: tipoObj?.nome || "Sem tipo",
      status: calcularStatus(evento.data_inicio, evento.data_fim),
      recorrencia: evento.recorrencia || "nao_recorrente",
      publico_alvo: evento.publico_alvo || "",
      descricao: evento.descricao || "",
    };
  });
}

export function EventosCalendarioClient({ eventos, tiposEventoOptions }: EventosCalendarioClientProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<Date | null>(today);

  // Transformar eventos
  const eventosTransformados = useMemo(() => {
    return transformarEventos(eventos, tiposEventoOptions);
  }, [eventos, tiposEventoOptions]);

  // Navegar para o mês anterior
  const goToPreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  // Navegar para o próximo mês
  const goToNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  // Eventos do dia selecionado (ou que incluem o dia selecionado)
  const eventsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return eventosTransformados.filter((evento) =>
      isDateInRange(selectedDate, evento.dataInicio, evento.dataFim)
    );
  }, [eventosTransformados, selectedDate]);

  // Próximos eventos do mês atual
  const upcomingEvents = useMemo(() => {
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);

    return eventosTransformados
      .filter((evento) => {
        // Evento começa no mês ou termina no mês ou está dentro do mês
        return (
          (evento.dataInicio >= monthStart && evento.dataInicio <= monthEnd) ||
          (evento.dataFim >= monthStart && evento.dataFim <= monthEnd) ||
          (evento.dataInicio <= monthStart && evento.dataFim >= monthEnd)
        );
      })
      .sort((a, b) => a.dataInicio.getTime() - b.dataInicio.getTime())
      .slice(0, 10); // Limitar a 10 eventos
  }, [eventosTransformados, currentMonth]);

  // Calendário do mês atual
  const calendarDays = useMemo(() => {
    return generateCalendar(
      currentMonth.getFullYear(),
      currentMonth.getMonth()
    );
  }, [currentMonth]);

  // Dias com eventos no calendário
  const daysWithEvents = useMemo(() => {
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);

    const daysSet = new Set<number>();

    eventosTransformados.forEach((evento) => {
      // Se o evento está dentro do mês, adiciona os dias
      const start = evento.dataInicio > monthStart ? evento.dataInicio : monthStart;
      const end = evento.dataFim < monthEnd ? evento.dataFim : monthEnd;

      if (start <= monthEnd && end >= monthStart) {
        const current = new Date(start);
        while (current <= end && current <= monthEnd) {
          daysSet.add(current.getTime());
          current.setDate(current.getDate() + 1);
        }
      }
    });

    return Array.from(daysSet);
  }, [eventosTransformados, currentMonth]);

  const monthName = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(currentMonth);

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const getStatusBadgeVariant = (status: "Encerrado" | "Em Andamento" | "Breve") => {
    switch (status) {
      case "Encerrado":
        return "secondary";
      case "Em Andamento":
        return "success";
      case "Breve":
        return "info";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Planejamento Anual</h1>
        <p className="text-muted-foreground">
          Visualize os eventos e campanhas em formato de calendário
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendário */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="capitalize">{monthName}</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={goToPreviousMonth}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={goToNextMonth}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1">
                {/* Cabeçalho dos dias da semana */}
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="p-2 text-center text-sm font-medium text-muted-foreground"
                  >
                    {day}
                  </div>
                ))}

                {/* Dias do calendário */}
                {calendarDays.map((day, index) => {
                  const dayTime = day.getTime();
                  const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                  const isToday = isSameDay(day, today);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const hasEvents = daysWithEvents.includes(dayTime);

                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedDate(new Date(day))}
                      className={`
                        p-2 text-center text-sm rounded-md transition-colors
                        ${!isCurrentMonth ? "text-muted-foreground opacity-40" : ""}
                        ${isToday ? "bg-primary text-primary-foreground font-bold" : ""}
                        ${isSelected && !isToday ? "bg-accent" : ""}
                        ${!isSelected && !isToday && isCurrentMonth ? "hover:bg-accent/50" : ""}
                        relative
                      `}
                    >
                      {day.getDate()}
                      {hasEvents && (
                        <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Eventos do Dia Selecionado */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedDate ? formatDate(selectedDate) : "Selecione um dia"}
              </CardTitle>
              <CardDescription>
                {selectedDate && eventsForSelectedDate.length === 0
                  ? "Nenhum evento agendado"
                  : `${eventsForSelectedDate.length} evento(s)`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedDate && eventsForSelectedDate.length > 0 ? (
                eventsForSelectedDate.map((evento) => (
                  <div
                    key={evento.id}
                    className="p-3 border rounded-lg space-y-2 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{evento.nome}</p>
                          {evento.recorrencia !== "nao_recorrente" && (
                            <Repeat className="h-3 w-3 text-muted-foreground" title="Evento recorrente" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {evento.tipoNome}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDateShort(evento.dataInicio)} - {formatDateShort(evento.dataFim)}
                        </p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(evento.status)}>
                        {evento.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : selectedDate ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum evento agendado para este dia
                </p>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Clique em um dia no calendário para ver os eventos
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Próximos Eventos do Mês */}
      <Card>
        <CardHeader>
          <CardTitle>Eventos do Mês</CardTitle>
          <CardDescription>
            Eventos programados para {monthName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingEvents.map((evento) => (
                <div
                  key={evento.id}
                  className="p-4 border rounded-lg space-y-2 hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedDate(evento.dataInicio)}
                >
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarIcon className="h-4 w-4" />
                    <span>{formatDateShort(evento.dataInicio)} - {formatDateShort(evento.dataFim)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{evento.nome}</p>
                    {evento.recorrencia !== "nao_recorrente" && (
                      <Repeat className="h-3 w-3 text-muted-foreground" title="Evento recorrente" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {evento.tipoNome}
                    </Badge>
                    <Badge variant={getStatusBadgeVariant(evento.status)} className="text-xs">
                      {evento.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum evento agendado para este mês
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
