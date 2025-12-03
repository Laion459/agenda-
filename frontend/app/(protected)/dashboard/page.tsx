'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, User, Stethoscope, AlertCircle, CheckCircle2, XCircle, CalendarPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { handleApiError } from "@/lib/handle-api-error";
import { fetchAppointments } from "@/services/appointment-service";
import { fetchDoctors } from "@/services/doctor-service";
import { Appointment, Doctor } from "@/types";
import { useAuthStore } from "@/store/auth-store";

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  // Redireciona médicos para o dashboard específico
  useEffect(() => {
    if (user && user.role === 'DOCTOR') {
      router.replace('/doctor/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    async function load() {
      try {
        const [appointmentsResponse, doctorsResponse] = await Promise.all([
          fetchAppointments({ per_page: 10 }),
          fetchDoctors({ per_page: 6 }),
        ]);

        setAppointments(appointmentsResponse.data ?? []);
        setDoctors(doctorsResponse.data ?? []);
      } catch (error) {
        handleApiError(error, "Falha ao carregar resumo inicial");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const upcomingAppointments = appointments
    .filter((apt) => new Date(apt.scheduled_at) >= new Date())
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    .slice(0, 5);

  const pastAppointments = appointments
    .filter((apt) => new Date(apt.scheduled_at) < new Date())
    .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())
    .slice(0, 3);

  const stats = {
    total: appointments.length,
    confirmed: appointments.filter((a) => a.status === 'CONFIRMED').length,
    pending: appointments.filter((a) => a.status === 'PENDING').length,
    cancelled: appointments.filter((a) => a.status === 'CANCELLED').length,
  };

  return (
    <div className="space-y-8">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Dashboard' }]} />
      
      {/* Header */}
      <section>
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          Bem-vindo, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-base text-slate-700">
          Acompanhe suas consultas e profissionais em um só lugar.
        </p>
      </section>

      {/* Estatísticas Rápidas */}
      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card variant="interactive" className="border-l-4 border-l-blue-500 dark:border-l-blue-400 animate-fade-in">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Total de Consultas
              </CardTitle>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg transition-transform duration-200 hover:scale-110">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardHeader>
          <div className="px-4 sm:px-6 pb-4 sm:pb-6">
            <p className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-1 transition-all duration-300">{stats.total}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Todas as consultas</p>
          </div>
        </Card>

        <Card variant="interactive" className="border-l-4 border-l-emerald-500 dark:border-l-emerald-400 animate-fade-in" style={{ animationDelay: '50ms' }}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Confirmadas
              </CardTitle>
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg transition-transform duration-200 hover:scale-110">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardHeader>
          <div className="px-4 sm:px-6 pb-4 sm:pb-6">
            <p className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-1 transition-all duration-300">{stats.confirmed}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Consultas confirmadas</p>
          </div>
        </Card>

        <Card variant="interactive" className="border-l-4 border-l-amber-500 dark:border-l-amber-400 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Pendentes
              </CardTitle>
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg transition-transform duration-200 hover:scale-110">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardHeader>
          <div className="px-4 sm:px-6 pb-4 sm:pb-6">
            <p className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-1 transition-all duration-300">{stats.pending}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Aguardando confirmação</p>
          </div>
        </Card>

        <Card variant="interactive" className="border-l-4 border-l-slate-400 dark:border-l-slate-500 animate-fade-in" style={{ animationDelay: '150ms' }}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Canceladas
              </CardTitle>
              <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg transition-transform duration-200 hover:scale-110">
                <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600 dark:text-slate-400" />
              </div>
            </div>
          </CardHeader>
          <div className="px-4 sm:px-6 pb-4 sm:pb-6">
            <p className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-1 transition-all duration-300">{stats.cancelled}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Consultas canceladas</p>
          </div>
        </Card>
      </section>

      {/* Próximas Consultas */}
      <section>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Próximas Consultas</CardTitle>
                <CardDescription className="text-base mt-1">Suas consultas agendadas</CardDescription>
              </div>
              <Link 
                href="/appointments"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors flex items-center gap-1"
              >
                Ver todas
                <Calendar className="h-4 w-4" />
              </Link>
            </div>
          </CardHeader>
          <div className="p-6 pt-0">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : upcomingAppointments.length === 0 ? (
              <EmptyState
                icon={<AlertCircle className="h-12 w-12 text-slate-400" />}
                title="Nenhuma consulta agendada"
                description="Você ainda não possui consultas agendadas. Agende sua primeira consulta agora."
              >
                <Link href="/appointments/new">
                  <Button size="lg" className="mt-4">
                    <CalendarPlus className="h-5 w-5 mr-2" />
                    Agendar consulta
                  </Button>
                </Link>
              </EmptyState>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {upcomingAppointments.map((appointment, index) => (
                  <div
                    key={appointment.id}
                    onClick={() => router.push('/appointments')}
                    className="group cursor-pointer rounded-xl border-2 border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 p-5 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50 hover:to-white dark:hover:from-blue-900/20 dark:hover:to-slate-800 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                        <Stethoscope className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <StatusBadge status={appointment.status} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                        {appointment.doctor?.name ?? "Médico não informado"}
                      </h3>
                      {appointment.doctor?.specialty && (
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                          {appointment.doctor.specialty}
                        </p>
                      )}
                      <div className="flex flex-col gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <Calendar className="h-4 w-4 text-slate-500" />
                          <span>
                            {new Date(appointment.scheduled_at).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <Clock className="h-4 w-4 text-slate-500" />
                          <span className="font-medium">
                            {new Date(appointment.scheduled_at).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </section>

      {/* Médicos Disponíveis */}
      <section>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Médicos Disponíveis</CardTitle>
                <CardDescription className="text-base mt-1">Profissionais cadastrados na plataforma</CardDescription>
              </div>
              <Link 
                href="/doctors"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors flex items-center gap-1"
              >
                Ver todos
                <Stethoscope className="h-4 w-4" />
              </Link>
            </div>
          </CardHeader>
          <div className="p-6 pt-0">
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : doctors.length === 0 ? (
              <EmptyState
                icon={<Stethoscope className="h-12 w-12 text-slate-400" />}
                title="Nenhum médico disponível"
                description="Não há médicos cadastrados no momento."
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {doctors.map((doctor, index) => (
                  <div
                    key={doctor.id}
                    className="group rounded-xl border-2 border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 p-5 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50 hover:to-white dark:hover:from-blue-900/20 dark:hover:to-slate-800 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <User className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors mb-1">
                          {doctor.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mb-1">
                          CRM {doctor.crm}
                        </p>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                          {doctor.specialty}
                        </p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                      <Link href="/appointments">
                        <Button 
                          variant="secondary" 
                          className="w-full group-hover:bg-blue-600 group-hover:text-white transition-colors"
                          size="sm"
                        >
                          <CalendarPlus className="h-4 w-4 mr-2" />
                          Agendar Consulta
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </section>

      {/* Ações Rápidas e Histórico */}
      <section className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Ações Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>Atalhos para as ações mais comuns</CardDescription>
          </CardHeader>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 p-4 sm:p-6 pt-0">
            <Link
              href="/appointments"
              className="flex flex-col items-center justify-center rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-center transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:shadow-md hover:-translate-y-0.5"
            >
              <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400 mb-2 transition-transform duration-200 group-hover:scale-110" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Agendar Consulta</span>
            </Link>
            <Link
              href="/notifications"
              className="flex flex-col items-center justify-center rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-center transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:shadow-md hover:-translate-y-0.5"
            >
              <AlertCircle className="h-6 w-6 text-blue-600 dark:text-blue-400 mb-2 transition-transform duration-200 group-hover:scale-110" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Notificações</span>
            </Link>
            <Link
              href="/profile"
              className="flex flex-col items-center justify-center rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-center transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:shadow-md hover:-translate-y-0.5"
            >
              <User className="h-6 w-6 text-blue-600 dark:text-blue-400 mb-2 transition-transform duration-200 group-hover:scale-110" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Meu Perfil</span>
            </Link>
            <Link
              href="/doctors"
              className="flex flex-col items-center justify-center rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-center transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:shadow-md hover:-translate-y-0.5"
            >
              <Stethoscope className="h-6 w-6 text-blue-600 dark:text-blue-400 mb-2 transition-transform duration-200 group-hover:scale-110" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Médicos</span>
            </Link>
          </div>
        </Card>

        {/* Histórico Recente */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico Recente</CardTitle>
            <CardDescription>Suas últimas consultas realizadas</CardDescription>
          </CardHeader>
          <div className="space-y-3 p-6 pt-0">
            {loading ? (
              <>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </>
            ) : pastAppointments.length === 0 ? (
              <EmptyState
                title="Nenhuma consulta realizada"
                description="Você ainda não realizou nenhuma consulta."
              />
            ) : (
              pastAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="rounded-lg border border-slate-200 p-3 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">
                        {appointment.doctor?.name ?? "---"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(appointment.scheduled_at).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <StatusBadge status={appointment.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}
