'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Lock, Plus, CheckCircle2, Clock, User, Calendar, CalendarDays, TrendingUp, Activity, Stethoscope, Eye, CalendarClock } from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchAppointments } from '@/services/appointment-service';
import { Appointment } from '@/types';
import { handleApiError } from '@/lib/handle-api-error';
import { getStatusColors } from '@/constants/colors';
import { TYPOGRAPHY, COLORS, SPACING, TRANSITIONS, ELEVATION } from '@/constants/design-tokens';
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
      <div className="space-y-6">
        {/* Cabeçalho da semana */}
        <div className="grid grid-cols-7 gap-2 mb-6">
          {weekDayNames.map((dayName, idx) => {
            const day = weekDays[idx];
            const isToday = isSameDay(day, new Date());
            const dayAppointments = getDayAppointments(day);
            
            return (
              <div
                key={idx}
                className={clsx(
                  "text-center p-3 rounded-xl transition-all duration-200 hover:shadow-md",
                  isToday 
                    ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white border-2 border-blue-400 shadow-lg scale-105" 
                    : "bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700",
                  "animate-fade-in"
                )}
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <p className={clsx(
                  "text-xs font-semibold mb-1.5 uppercase tracking-wide",
                  isToday ? "text-blue-100" : COLORS.text.secondary
                )}>
                  {dayName}
                </p>
                <p className={clsx(
                  "text-xl font-bold mb-1",
                  isToday ? "text-white" : COLORS.text.primary
                )}>
                  {formatDate(day, 'd')}
                </p>
                {dayAppointments.length > 0 && (
                  <div className={clsx(
                    "inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold mt-1",
                    isToday 
                      ? "bg-white/20 text-white" 
                      : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  )}>
                    {dayAppointments.length} {dayAppointments.length === 1 ? 'consulta' : 'consultas'}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Consultas por dia - Profissionais */}
        <div className="space-y-6">
          {weekDays.map((day, dayIdx) => {
            const dayAppointments = getDayAppointments(day);
            if (dayAppointments.length === 0) return null;

            return (
              <div 
                key={dayIdx} 
                className={clsx(
                  "border-l-4 pl-5 rounded-r-lg bg-slate-50/50 dark:bg-slate-800/50 p-4",
                  "border-l-blue-500 dark:border-l-blue-400",
                  "animate-fade-in"
                )}
                style={{ animationDelay: `${dayIdx * 50}ms` }}
              >
                <h4 className={clsx(
                  TYPOGRAPHY.heading.h5,
                  COLORS.text.primary,
                  "mb-4 flex items-center gap-2"
                )}>
                  <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  {formatDate(day, "EEEE, d 'de' MMMM")}
                </h4>
                <div className="space-y-3">
                  {dayAppointments.map((appointment, aptIdx) => (
                    <div
                      key={appointment.id}
                      className={clsx(
                        "rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
                        getStatusColor(appointment.status),
                        "animate-fade-in"
                      )}
                      style={{ animationDelay: `${aptIdx * 30}ms` }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={clsx(
                              "p-1.5 rounded-lg",
                              appointment.status === 'CONFIRMED' && "bg-emerald-100 dark:bg-emerald-900/30",
                              appointment.status === 'PENDING' && "bg-amber-100 dark:bg-amber-900/30"
                            )}>
                              {getStatusIcon(appointment.status)}
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                              <span className={clsx(TYPOGRAPHY.body.base, "font-mono font-semibold")}>
                                {formatDate(new Date(appointment.scheduled_at), 'HH:mm')}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                              <span className={clsx(TYPOGRAPHY.body.base, "font-semibold truncate")}>
                                {appointment.patient?.name ?? '---'}
                              </span>
                            </div>
                          </div>
                          <p className={clsx(TYPOGRAPHY.body.small, "font-medium")}>
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
          <EmptyState
            variant="no-data"
            icon={<CalendarDays className="h-12 w-12 text-slate-400 dark:text-slate-500" />}
            title="Nenhuma consulta agendada"
            description="Não há consultas agendadas para esta semana. Seus pacientes podem agendar através do sistema."
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Sofisticado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={clsx(TYPOGRAPHY.heading.h1, COLORS.text.primary, "mb-2 animate-fade-in")}>
            Minha Agenda
          </h1>
          <p className={clsx(TYPOGRAPHY.body.base, COLORS.text.secondary, "flex items-center gap-2")}>
            <CalendarDays className="h-4 w-4 flex-shrink-0" />
            {formatDate(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'daily' ? 'primary' : 'outline'}
            onClick={() => setViewMode('daily')}
            size="sm"
            className={clsx(
              TRANSITIONS.common.all,
              viewMode === 'daily' && "shadow-md"
            )}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Diária
          </Button>
          <Button
            variant={viewMode === 'weekly' ? 'primary' : 'outline'}
            onClick={() => setViewMode('weekly')}
            size="sm"
            className={clsx(
              TRANSITIONS.common.all,
              viewMode === 'weekly' && "shadow-md"
            )}
          >
            <CalendarDays className="h-4 w-4 mr-2" />
            Semanal
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        {/* Sidebar - Calendário e Estatísticas */}
        <div className="space-y-6">
          {/* Calendário */}
          <Card variant="interactive" className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className={clsx(TYPOGRAPHY.heading.h5, COLORS.text.primary, "flex items-center gap-2")}>
                  <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  {formatDate(currentDate, 'MMMM yyyy')}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                    className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 hover:scale-110 active:scale-95"
                    aria-label="Mês anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                    className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 hover:scale-110 active:scale-95"
                    aria-label="Próximo mês"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>

              {/* Dias da semana */}
              <div className="grid grid-cols-7 gap-1 mb-3">
                {['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'].map((day) => (
                  <div key={day} className={clsx(
                    "text-center text-xs font-semibold py-2 uppercase tracking-wide",
                    COLORS.text.secondary
                  )}>
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendário */}
              <div className="grid grid-cols-7 gap-1.5">
                {daysInMonth.map((day, idx) => {
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isSelected = isSameDay(day, selectedDate);
                  const isToday = isSameDay(day, new Date());
                  const dayAppointments = getDayAppointments(day);
                  const hasAppointments = dayAppointments.length > 0;

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedDate(day);
                        if (!isSameMonth(day, currentDate)) {
                          setCurrentDate(day);
                        }
                      }}
                      className={clsx(
                        "aspect-square rounded-lg text-sm font-medium transition-all duration-200 relative group",
                        TRANSITIONS.common.all,
                        !isCurrentMonth && "text-slate-300 dark:text-slate-600 opacity-50",
                        isCurrentMonth && !isSelected && !isToday && COLORS.text.primary,
                        isSelected && "bg-gradient-to-br from-blue-600 to-blue-700 text-white font-bold shadow-lg scale-105 ring-2 ring-blue-400 ring-offset-2",
                        isToday && !isSelected && "bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-300 border-2 border-blue-500 font-semibold",
                        !isSelected && !isToday && isCurrentMonth && "hover:bg-slate-100 dark:hover:bg-slate-700 hover:scale-105 hover:shadow-md",
                        hasAppointments && !isSelected && "font-semibold"
                      )}
                      aria-label={`${formatDate(day, 'd')} de ${formatDate(day, 'MMMM')}${hasAppointments ? ` - ${dayAppointments.length} consulta(s)` : ''}`}
                    >
                      {formatDate(day, 'd')}
                      {hasAppointments && !isSelected && (
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas do Dia */}
          <Card variant="interactive" className="border-l-4 border-l-blue-500 dark:border-l-blue-400">
            <CardHeader className="pb-4">
              <CardTitle className={clsx(TYPOGRAPHY.heading.h5, COLORS.text.primary, "flex items-center gap-2")}>
                <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Estatísticas do Dia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={clsx(
                "flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700",
                "bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900",
                "hover:shadow-md transition-all duration-200 animate-fade-in"
              )}>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
                    <Calendar className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                  </div>
                  <span className={clsx(TYPOGRAPHY.body.small, COLORS.text.secondary)}>Total de Consultas</span>
                </div>
                <span className={clsx(
                  "px-3 py-1.5 rounded-lg font-bold text-lg",
                  "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white",
                  "shadow-sm"
                )}>
                  {todayStats.total}
                </span>
              </div>
              
              <div className={clsx(
                "flex items-center justify-between p-3 rounded-lg border border-emerald-200 dark:border-emerald-800",
                "bg-gradient-to-r from-emerald-50 to-white dark:from-emerald-900/20 dark:to-slate-900",
                "hover:shadow-md transition-all duration-200 animate-fade-in"
              )} style={{ animationDelay: '50ms' }}>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                    <CheckCircle2 className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                  </div>
                  <span className={clsx(TYPOGRAPHY.body.small, COLORS.text.secondary)}>Confirmadas</span>
                </div>
                <span className={clsx(
                  "px-3 py-1.5 rounded-lg font-bold text-lg",
                  "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300",
                  "shadow-sm"
                )}>
                  {todayStats.confirmed}
                </span>
              </div>
              
              <div className={clsx(
                "flex items-center justify-between p-3 rounded-lg border border-amber-200 dark:border-amber-800",
                "bg-gradient-to-r from-amber-50 to-white dark:from-amber-900/20 dark:to-slate-900",
                "hover:shadow-md transition-all duration-200 animate-fade-in"
              )} style={{ animationDelay: '100ms' }}>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <Clock className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                  </div>
                  <span className={clsx(TYPOGRAPHY.body.small, COLORS.text.secondary)}>Pendentes</span>
                </div>
                <span className={clsx(
                  "px-3 py-1.5 rounded-lg font-bold text-lg",
                  "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300",
                  "shadow-sm"
                )}>
                  {todayStats.pending}
                </span>
              </div>
              
              <div className={clsx(
                "flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700",
                "bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900",
                "hover:shadow-md transition-all duration-200 animate-fade-in"
              )} style={{ animationDelay: '150ms' }}>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
                    <TrendingUp className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                  </div>
                  <span className={clsx(TYPOGRAPHY.body.small, COLORS.text.secondary)}>Horários Livres</span>
                </div>
                <span className={clsx(
                  "px-3 py-1.5 rounded-lg font-bold text-lg",
                  "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white",
                  "shadow-sm"
                )}>
                  {todayStats.free}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Ações Rápidas */}
          <Card variant="interactive" className="border-l-4 border-l-purple-500 dark:border-l-purple-400">
            <CardHeader className="pb-4">
              <CardTitle className={clsx(TYPOGRAPHY.heading.h5, COLORS.text.primary, "flex items-center gap-2")}>
                <Stethoscope className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                Ações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/doctor/schedules" className="block">
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-auto py-3 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-200 hover:shadow-md group"
                >
                  <div className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-900/30 mr-3 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                    <Lock className="h-4 w-4 text-purple-700 dark:text-purple-400" />
                  </div>
                  <div className="text-left">
                    <div className={clsx(TYPOGRAPHY.body.base, "font-semibold")}>Gerenciar Horários</div>
                    <div className={clsx(TYPOGRAPHY.body.small, COLORS.text.secondary)}>Configurar disponibilidade</div>
                  </div>
                </Button>
              </Link>
              <Link href="/appointments" className="block">
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-auto py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 hover:shadow-md group"
                >
                  <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30 mr-3 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                    <Plus className="h-4 w-4 text-blue-700 dark:text-blue-400" />
                  </div>
                  <div className="text-left">
                    <div className={clsx(TYPOGRAPHY.body.base, "font-semibold")}>Ver Todas Consultas</div>
                    <div className={clsx(TYPOGRAPHY.body.small, COLORS.text.secondary)}>Visualizar histórico completo</div>
                  </div>
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card variant="interactive" className="overflow-hidden">
          <CardHeader className="border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className={clsx(TYPOGRAPHY.heading.h4, COLORS.text.primary, "flex items-center gap-2")}>
                  {viewMode === 'daily' ? (
                    <>
                      <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      Agenda do Dia
                    </>
                  ) : (
                    <>
                      <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      Agenda Semanal
                    </>
                  )}
                </CardTitle>
                <CardDescription className={clsx(TYPOGRAPHY.body.small, COLORS.text.secondary, "mt-1")}>
                  {viewMode === 'daily' 
                    ? `${selectedDayAppointments.length} consulta(s) agendada(s) para hoje`
                    : 'Visualize todas as consultas da semana'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
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
              <EmptyState
                variant="no-data"
                icon={<Calendar className="h-12 w-12 text-slate-400 dark:text-slate-500" />}
                title="Nenhuma consulta agendada"
                description="Não há consultas agendadas para este dia. Seus pacientes podem agendar através do sistema."
              />
            ) : (
              <div className="space-y-4">
                {selectedDayAppointments.map((appointment, index) => (
                  <div
                    key={appointment.id}
                    className={clsx(
                      "rounded-xl border-2 p-5 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5",
                      getStatusColor(appointment.status),
                      "animate-fade-in group"
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={clsx(
                            "p-2 rounded-lg",
                            appointment.status === 'CONFIRMED' && "bg-emerald-100 dark:bg-emerald-900/30",
                            appointment.status === 'PENDING' && "bg-amber-100 dark:bg-amber-900/30",
                            appointment.status === 'CANCELLED' && "bg-red-100 dark:bg-red-900/30"
                          )}>
                            {getStatusIcon(appointment.status)}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                            <span className={clsx(TYPOGRAPHY.heading.h6, "font-mono")}>
                              {formatDate(new Date(appointment.scheduled_at), 'HH:mm')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                            <span className={clsx(TYPOGRAPHY.body.base, "font-semibold truncate")}>
                              {appointment.patient?.name ?? '---'}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <p className={clsx(TYPOGRAPHY.body.small, "font-medium")}>
                            {appointment.type === 'FIRST' ? 'Primeira Consulta' :
                             appointment.type === 'RETURN' ? 'Retorno' :
                             appointment.type === 'EXAM_REVIEW' ? 'Avaliação de Exames' :
                             appointment.type === 'URGENCY' ? 'Urgência' : appointment.type}
                          </p>
                          {appointment.notes && (
                            <p className={clsx(TYPOGRAPHY.body.small, COLORS.text.secondary, "italic")}>
                              {appointment.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          <Eye className="h-4 w-4 mr-1.5" />
                          Detalhes
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="hover:bg-amber-50 dark:hover:bg-amber-900/20"
                        >
                          <CalendarClock className="h-4 w-4 mr-1.5" />
                          Reagendar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

