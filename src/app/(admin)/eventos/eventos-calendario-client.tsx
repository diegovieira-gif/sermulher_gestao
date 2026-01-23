"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventoForm } from "./evento-form";
import type { CalendarEvent } from "./actions";

interface EventosCalendarioClientProps {
  initialEvents: CalendarEvent[];
  tiposEventoOptions: { id: number; nome: string; icone?: string }[];
}

export function EventosCalendarioClient({
  initialEvents,
  tiposEventoOptions,
}: EventosCalendarioClientProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Navegação
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Geração do Grid
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  // Filtra eventos do dia
  const getEventsForDay = (day: Date) => {
    return initialEvents.filter((evt) => isSameDay(evt.start, day));
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-white rounded-lg border shadow-sm overflow-hidden">
      {/* --- HEADER DO CALENDÁRIO --- */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-800 capitalize flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-purple-600" />
            {format(currentDate, "MMMM yyyy", { locale: ptBR })}
          </h2>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" onClick={goToToday} className="text-sm">
              Hoje
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Legenda */}
          <div className="hidden md:flex gap-3 text-xs">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-emerald-600"></span>{" "}
              Escola
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-blue-600"></span> Sala
              Azul
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-indigo-500"></span>{" "}
              Eventos
            </div>
          </div>

          {/* Botão Novo Evento */}
          <Button
            className="bg-purple-600 hover:bg-purple-700 gap-2"
            onClick={() => setIsFormOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Novo Evento
          </Button>

          {/* Formulário (Modal) */}
          <EventoForm
            open={isFormOpen}
            onOpenChange={setIsFormOpen}
            tiposEventoOptions={tiposEventoOptions}
            onSuccess={() => router.refresh()}
          />
        </div>
      </div>

      {/* --- GRID DO CALENDÁRIO --- */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="grid grid-cols-7 border-b bg-gray-50">
          {weekDays.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-gray-200 gap-px overflow-y-auto">
          {calendarDays.map((day, idx) => {
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isTodayDate = isToday(day);
            const dayEvents = getEventsForDay(day);

            return (
              <div
                key={day.toString()}
                className={`bg-white p-2 min-h-[100px] flex flex-col gap-1 transition-colors hover:bg-gray-50 ${
                  !isCurrentMonth ? "bg-gray-50/50 text-gray-400" : ""
                } ${isTodayDate ? "bg-purple-50/50" : ""}`}
                onClick={() => handleDayClick(day)}
              >
                <div className="flex justify-between items-start">
                  <span
                    className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                      isTodayDate ? "bg-purple-600 text-white shadow-sm" : ""
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                </div>

                <div className="flex-1 w-full overflow-y-auto max-h-[100px] custom-scrollbar">
                  <div className="flex flex-col gap-1 mt-1">
                    {dayEvents.map((evt) => (
                      <div
                        key={evt.id}
                        className="text-[10px] px-1.5 py-0.5 rounded border border-transparent truncate font-medium flex items-center gap-1 shadow-sm opacity-90 hover:opacity-100 cursor-pointer"
                        style={{
                          backgroundColor: `${evt.color}15`,
                          color: evt.color,
                          borderColor: `${evt.color}30`,
                        }}
                        title={evt.title}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: evt.color }}
                        />
                        {evt.allDay ? "" : format(evt.start, "HH:mm")}{" "}
                        {evt.title}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
