'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, User, Stethoscope, AlertCircle, CheckCircle2, XCircle } from "lucide-react";

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
        <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                Total de Consultas
              </CardTitle>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <div className="px-6 pb-6">
            <p className="text-4xl font-bold text-slate-900 mb-1">{stats.total}</p>
            <p className="text-xs text-slate-500">Todas as consultas</p>
          </div>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                Confirmadas
              </CardTitle>
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardHeader>
          <div className="px-6 pb-6">
            <p className="text-4xl font-bold text-slate-900 mb-1">{stats.confirmed}</p>
            <p className="text-xs text-slate-500">Consultas confirmadas</p>
          </div>
        </Card>

        <Card className="border-l-4 border-l-amber-500 hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                Pendentes
              </CardTitle>
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardHeader>
          <div className="px-6 pb-6">
            <p className="text-4xl font-bold text-slate-900 mb-1">{stats.pending}</p>
            <p className="text-xs text-slate-500">Aguardando confirmação</p>
          </div>
        </Card>

        <Card className="border-l-4 border-l-red-500 hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                Canceladas
              </CardTitle>
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardHeader>
          <div className="px-6 pb-6">
            <p className="text-4xl font-bold text-slate-900 mb-1">{stats.cancelled}</p>
            <p className="text-xs text-slate-500">Consultas canceladas</p>
          </div>
        </Card>
      </section>

      {/* Próximas Consultas e Médicos */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Próximas Consultas */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Próximas Consultas</CardTitle>
                <CardDescription>Suas consultas agendadas</CardDescription>
              </div>
              <Link href="/appointments">
                <span className="text-sm font-medium text-purple-600 hover:text-purple-700">
                  Ver todas
                </span>
              </Link>
            </div>
          </CardHeader>
          <div className="space-y-3 p-6 pt-0">
            {loading ? (
              <>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </>
            ) : upcomingAppointments.length === 0 ? (
              <EmptyState
                icon={<AlertCircle className="h-8 w-8 text-slate-400" />}
                title="Nenhuma consulta agendada"
                description="Você ainda não possui consultas agendadas. Agende sua primeira consulta agora."
              >
                <Link href="/appointments">
                  <Button size="sm">Agendar consulta</Button>
                </Link>
              </EmptyState>
            ) : (
              upcomingAppointments.map((appointment) => (
                <Link
                  key={appointment.id}
                  href={`/appointments/${appointment.id}`}
                  className="block rounded-lg border-2 border-slate-200 bg-white p-4 hover:border-purple-300 hover:bg-purple-50/50 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-purple-100 rounded-md">
                          <Stethoscope className="h-4 w-4 text-purple-600" />
                        </div>
                        <p className="font-semibold text-slate-900 truncate">
                          {appointment.doctor?.name ?? "---"}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-700 mb-1">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-slate-500" />
                          <span>
                            {new Date(appointment.scheduled_at).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-slate-500" />
                          <span>
                            {new Date(appointment.scheduled_at).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                      {appointment.doctor?.specialty && (
                        <p className="text-xs text-slate-600 font-medium mt-1">
                          {appointment.doctor.specialty}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={appointment.status} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>

        {/* Médicos Favoritos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Médicos Disponíveis</CardTitle>
                <CardDescription>Profissionais cadastrados</CardDescription>
              </div>
              <Link href="/doctors">
                <span className="text-sm font-medium text-purple-600 hover:text-purple-700">
                  Ver todos
                </span>
              </Link>
            </div>
          </CardHeader>
          <div className="space-y-3 p-6 pt-0">
            {loading ? (
              <>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </>
            ) : doctors.length === 0 ? (
              <EmptyState
                title="Nenhum médico disponível"
                description="Não há médicos cadastrados no momento."
              />
            ) : (
              doctors.map((doctor) => (
                <Link
                  key={doctor.id}
                  href={`/doctors/${doctor.id}`}
                  className="block rounded-lg border border-slate-200 p-3 hover:border-purple-300 hover:bg-purple-50/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{doctor.name}</p>
                      <p className="text-xs text-slate-500">CRM {doctor.crm}</p>
                      <p className="text-xs text-slate-600 mt-1 truncate">{doctor.specialty}</p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>
      </section>

      {/* Ações Rápidas e Histórico */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Ações Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>Atalhos para as ações mais comuns</CardDescription>
          </CardHeader>
          <div className="grid grid-cols-2 gap-3 p-6 pt-0">
            <Link
              href="/appointments"
              className="flex flex-col items-center justify-center rounded-lg border-2 border-slate-200 bg-white p-4 text-center transition hover:border-purple-300 hover:bg-purple-50"
            >
              <Calendar className="h-6 w-6 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-slate-700">Agendar Consulta</span>
            </Link>
            <Link
              href="/notifications"
              className="flex flex-col items-center justify-center rounded-lg border-2 border-slate-200 bg-white p-4 text-center transition hover:border-purple-300 hover:bg-purple-50"
            >
              <AlertCircle className="h-6 w-6 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-slate-700">Notificações</span>
            </Link>
            <Link
              href="/profile"
              className="flex flex-col items-center justify-center rounded-lg border-2 border-slate-200 bg-white p-4 text-center transition hover:border-purple-300 hover:bg-purple-50"
            >
              <User className="h-6 w-6 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-slate-700">Meu Perfil</span>
            </Link>
            <Link
              href="/doctors"
              className="flex flex-col items-center justify-center rounded-lg border-2 border-slate-200 bg-white p-4 text-center transition hover:border-purple-300 hover:bg-purple-50"
            >
              <Stethoscope className="h-6 w-6 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-slate-700">Médicos</span>
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
