'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Lock, Plus, CheckCircle2, Clock, User } from 'lucide-react';
import Link from 'next/link';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fetchAppointments } from '@/services/appointment-service';
import { Appointment } from '@/types';
import { handleApiError } from '@/lib/handle-api-error';
import { getStatusColors } from '@/constants/colors';
import {
  formatDate,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameWeek,
} from '@/lib/date-utils';

export default function DoctorDashboardPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const daysInMonth = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = viewMode === 'daily' 
        ? formatDate(selectedDate, 'yyyy-MM-dd')
        : formatDate(startOfWeek(selectedDate), 'yyyy-MM-dd');
      
      const endDate = viewMode === 'daily'
        ? formatDate(selectedDate, 'yyyy-MM-dd')
        : formatDate(endOfWeek(selectedDate), 'yyyy-MM-dd');

      const response = await fetchAppointments({
        start_date: startDate,
        end_date: endDate,
        per_page: 100,
      });
      setAppointments(response.data ?? []);
    } catch (error) {
      handleApiError(error, 'Erro ao carregar consultas');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, viewMode]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const getDayAppointments = (date: Date) => {
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.scheduled_at);
      return isSameDay(aptDate, date);
    });
  };

  const getDayStats = (date: Date) => {
    const dayAppointments = getDayAppointments(date);
    return {
      total: dayAppointments.length,
      confirmed: dayAppointments.filter((a) => a.status === 'CONFIRMED').length,
      pending: dayAppointments.filter((a) => a.status === 'PENDING').length,
      free: 0, // Calcular baseado nos horários disponíveis
    };
  };

  const todayStats = getDayStats(selectedDate);
  const selectedDayAppointments = getDayAppointments(selectedDate).sort((a, b) => 
    new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
  );

  const getStatusColor = (status: string) => {
    const colors = getStatusColors(status);
    return `${colors.bg} ${colors.text} ${colors.border}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'PENDING':
        return <Clock className="h-4 w-4" />;
      default:
        return null;
    }
  };

  // Componente de Visualização Semanal
  function WeeklyView({ 
    selectedDate, 
    appointments, 
    getStatusColor, 
    getStatusIcon 
  }: { 
    selectedDate: Date; 
    appointments: Appointment[];
    getStatusColor: (status: string) => string;
    getStatusIcon: (status: string) => React.ReactElement | null;
  }) {
    const weekStart = startOfWeek(selectedDate);
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const weekDayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    const getDayAppointments = (date: Date) => {
      return appointments.filter((apt) => {
        const aptDate = new Date(apt.scheduled_at);
        return isSameDay(aptDate, date);
      }).sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
    };

    return (
      <div className="space-y-4">
        {/* Cabeçalho da semana */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {weekDayNames.map((dayName, idx) => {
            const day = weekDays[idx];
            const isToday = isSameDay(day, new Date());
            const dayAppointments = getDayAppointments(day);
            
            return (
              <div
                key={idx}
                className={`text-center p-2 rounded-lg ${
                  isToday ? 'bg-purple-100 border-2 border-purple-500' : 'bg-slate-50'
                }`}
              >
                <p className="text-xs font-medium text-slate-600 mb-1">{dayName}</p>
                <p className={`text-lg font-bold ${isToday ? 'text-purple-900' : 'text-slate-900'}`}>
                  {formatDate(day, 'd')}
                </p>
                {dayAppointments.length > 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    {dayAppointments.length} {dayAppointments.length === 1 ? 'consulta' : 'consultas'}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Consultas por dia */}
        <div className="space-y-4">
          {weekDays.map((day, dayIdx) => {
            const dayAppointments = getDayAppointments(day);
            if (dayAppointments.length === 0) return null;

            return (
              <div key={dayIdx} className="border-l-4 border-l-purple-500 pl-4">
                <h4 className="font-semibold text-slate-900 mb-2">
                  {formatDate(day, "EEEE, d 'de' MMMM")}
                </h4>
                <div className="space-y-2">
                  {dayAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className={`rounded-lg border-2 p-3 ${getStatusColor(appointment.status)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            {getStatusIcon(appointment.status)}
                            <span className="font-semibold">
                              {formatDate(new Date(appointment.scheduled_at), 'HH:mm')}
                            </span>
                            <User className="h-4 w-4 ml-2" />
                            <span className="font-medium text-sm">
                              {appointment.patient?.name ?? '---'}
                            </span>
                          </div>
                          <p className="text-xs opacity-90">
                            {appointment.type === 'FIRST' ? 'Primeira Consulta' :
                             appointment.type === 'RETURN' ? 'Retorno' :
                             appointment.type === 'EXAM_REVIEW' ? 'Avaliação de Exames' :
                             appointment.type === 'URGENCY' ? 'Urgência' : appointment.type}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {appointments.filter(apt => {
          const aptDate = new Date(apt.scheduled_at);
          return isSameWeek(aptDate, selectedDate);
        }).length === 0 && (
          <div className="text-center py-12 text-slate-500">
            Nenhuma consulta agendada para esta semana.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Minha Agenda</h1>
          <p className="text-sm text-slate-600">
            {formatDate(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy")}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'daily' ? 'default' : 'outline'}
            onClick={() => setViewMode('daily')}
            className={viewMode === 'daily' ? 'bg-slate-200 text-slate-900' : ''}
          >
            Diária
          </Button>
          <Button
            variant={viewMode === 'weekly' ? 'default' : 'outline'}
            onClick={() => setViewMode('weekly')}
            className={viewMode === 'weekly' ? 'bg-slate-200 text-slate-900' : ''}
          >
            Semanal
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        {/* Sidebar - Calendário e Estatísticas */}
        <div className="space-y-6">
          {/* Calendário */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">
                {formatDate(currentDate, 'MMMM yyyy')}
              </h3>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Dias da semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-slate-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendário */}
            <div className="grid grid-cols-7 gap-1">
              {daysInMonth.map((day, idx) => {
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isSelected = isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());
                const dayAppointments = getDayAppointments(day);

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedDate(day);
                      if (!isSameMonth(day, currentDate)) {
                        setCurrentDate(day);
                      }
                    }}
                    className={`
                      aspect-square rounded-lg text-sm transition-colors
                      ${!isCurrentMonth ? 'text-slate-300' : 'text-slate-900'}
                      ${isSelected ? 'bg-purple-600 text-white font-bold' : ''}
                      ${isToday && !isSelected ? 'bg-purple-100 text-purple-900' : ''}
                      ${!isSelected && !isToday && isCurrentMonth ? 'hover:bg-slate-100' : ''}
                      ${dayAppointments.length > 0 && !isSelected ? 'font-semibold' : ''}
                    `}
                  >
                    {formatDate(day, 'd')}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Estatísticas do Dia */}
          <Card className="p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Estatísticas do Dia</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Total de Consultas</span>
                <span className="px-3 py-1 rounded-md bg-slate-100 text-slate-900 font-semibold">
                  {todayStats.total}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Confirmadas</span>
                <span className="px-3 py-1 rounded-md bg-green-100 text-green-800 font-semibold">
                  {todayStats.confirmed}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Pendentes</span>
                <span className="px-3 py-1 rounded-md bg-yellow-100 text-yellow-800 font-semibold">
                  {todayStats.pending}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Horários Livres</span>
                <span className="px-3 py-1 rounded-md bg-slate-100 text-slate-900 font-semibold">
                  {todayStats.free}
                </span>
              </div>
            </div>
          </Card>

          {/* Ações Rápidas */}
          <Card className="p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Ações Rápidas</h3>
            <div className="space-y-2">
              <Link href="/doctor/schedules">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <div>
                    <Lock className="h-4 w-4 mr-2" />
                    Gerenciar Horários
                  </div>
                </Button>
              </Link>
              <Link href="/appointments">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <div>
                    <Plus className="h-4 w-4 mr-2" />
                    Ver Todas Consultas
                  </div>
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Main Content - Agenda */}
        <Card className="p-6">
          <h3 className="font-semibold text-slate-900 mb-4">
            {viewMode === 'daily' ? 'Agenda do Dia' : 'Agenda Semanal'}
          </h3>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : viewMode === 'weekly' ? (
            <WeeklyView 
              selectedDate={selectedDate} 
              appointments={appointments}
              getStatusColor={getStatusColor}
              getStatusIcon={getStatusIcon}
            />
          ) : selectedDayAppointments.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              Nenhuma consulta agendada para este dia.
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDayAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className={`rounded-lg border-2 p-4 ${getStatusColor(appointment.status)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getStatusIcon(appointment.status)}
                        <span className="font-semibold">
                          {formatDate(new Date(appointment.scheduled_at), 'HH:mm')}
                        </span>
                        <User className="h-4 w-4 ml-2" />
                        <span className="font-medium">
                          {appointment.patient?.name ?? '---'}
                        </span>
                      </div>
                      <p className="text-sm opacity-90 mb-1">
                        {appointment.type === 'FIRST' ? 'Primeira Consulta' :
                         appointment.type === 'RETURN' ? 'Retorno' :
                         appointment.type === 'EXAM_REVIEW' ? 'Avaliação de Exames' :
                         appointment.type === 'URGENCY' ? 'Urgência' : appointment.type}
                      </p>
                      {appointment.notes && (
                        <p className="text-sm italic opacity-75">
                          Obs: {appointment.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" >
                        Detalhes
                      </Button>
                      <Button variant="ghost" >
                        Reagendar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

