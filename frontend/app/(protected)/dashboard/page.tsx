'use client';

import Link from "next/link";
import { useEffect, useState } from "react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { handleApiError } from "@/lib/handle-api-error";
import { fetchAppointments } from "@/services/appointment-service";
import { fetchDoctors } from "@/services/doctor-service";
import { Appointment, Doctor } from "@/types";
import { APPOINTMENT_STATUS_OPTIONS } from "@/constants/appointments";
import { useAuthStore } from "@/store/auth-store";

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((state) => state.user);
  const role = user?.role;

  useEffect(() => {
    async function load() {
      try {
        const [appointmentsResponse, doctorsResponse] = await Promise.all([
          fetchAppointments({ per_page: 5 }),
          fetchDoctors({ per_page: 5 }),
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

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold text-slate-900">Bem-vindo ao Agenda+</h1>
        <p className="text-sm text-slate-500">Acompanhe suas consultas e profissionais em um só lugar.</p>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="order-2 lg:order-none">
          <CardHeader>
            <div>
              <CardTitle>Consultas recentes</CardTitle>
              <CardDescription>As 5 próximas consultas agendadas</CardDescription>
            </div>
          </CardHeader>
          <div className="space-y-3">
            {loading ? (
              <>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </>
            ) : appointments.length === 0 ? (
              <EmptyState className="border-none bg-transparent p-0">
                Você ainda não possui consultas agendadas.
              </EmptyState>
            ) : (
              <>
                {appointments.map((appointment) => (
                  <div key={appointment.id} className="rounded-md border border-slate-200 p-3 text-sm">
                    <p className="font-medium text-slate-800">
                      {appointment.doctor?.name ?? "---"}
                    </p>
                    <p className="text-slate-500">
                      {new Date(appointment.scheduled_at).toLocaleString("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </p>
                    <StatusBadge status={appointment.status} />
                  </div>
                ))}
                <Link href="/appointments" className="text-sm font-medium text-blue-600 hover:underline">
                  Ver todas as consultas
                </Link>
              </>
            )}
          </div>
        </Card>
        <Card className="order-1 lg:order-none lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Médicos disponíveis</CardTitle>
              <CardDescription>Profissionais cadastrados na plataforma</CardDescription>
            </div>
          </CardHeader>
          <div className="grid gap-3 md:grid-cols-2">
            {loading ? (
              <>
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </>
            ) : doctors.length === 0 ? (
              <EmptyState className="border-none bg-transparent p-0">
                Nenhum médico cadastrado até o momento.
              </EmptyState>
            ) : (
              doctors.map((doctor) => (
                <div key={doctor.id} className="rounded-md border border-slate-200 p-3">
                  <p className="text-sm font-medium text-slate-900">{doctor.name}</p>
                  <p className="text-xs text-slate-500">CRM {doctor.crm}</p>
                  <p className="mt-1 text-xs text-slate-600">{doctor.specialty}</p>
                </div>
              ))
            )}
          </div>
          {!loading && (
            <Link href="/doctors" className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline">
              Ver todos os médicos
            </Link>
          )}
        </Card>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Fluxo rápido</CardTitle>
              <CardDescription>Atalhos para as ações mais comuns.</CardDescription>
            </div>
          </CardHeader>
          <div className="flex flex-wrap gap-3 p-6 pt-0">
            <Link
              href="/appointments"
              className="flex-1 min-w-[140px] rounded-md border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:text-blue-600"
            >
              Ver agenda completa
            </Link>
            {role === "DOCTOR" && (
              <Link
                href="/doctor/schedules"
                className="flex-1 min-w-[140px] rounded-md border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:text-blue-600"
              >
                Gerenciar horários
              </Link>
            )}
            {role === "ADMIN" && (
              <>
                <Link
                  href="/admin/doctors"
                  className="flex-1 min-w-[140px] rounded-md border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:text-blue-600"
                >
                  Gerenciar médicos
                </Link>
                <Link
                  href="/admin/patients"
                  className="flex-1 min-w-[140px] rounded-md border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:text-blue-600"
                >
                  Gerenciar pacientes
                </Link>
                <Link
                  href="/admin/health-insurances"
                  className="flex-1 min-w-[140px] rounded-md border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:text-blue-600"
                >
                  Convênios
                </Link>
              </>
            )}
          </div>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Status principais</CardTitle>
              <CardDescription>Situação atual das suas consultas.</CardDescription>
            </div>
          </CardHeader>
          <div className="grid gap-3 p-6 pt-0 md:grid-cols-2">
            {APPOINTMENT_STATUS_OPTIONS.filter((status) => status.value !== '').map((option) => {
              const count = appointments.filter((appointment) => appointment.status === option.value).length;

              return (
                <div key={option.value} className="rounded-md border border-slate-200 p-3">
                  <p className="text-xs uppercase text-slate-500">{option.label}</p>
                  <p className="text-2xl font-semibold text-slate-900">{count}</p>
                  <StatusBadge status={option.value} />
                </div>
              );
            })}
          </div>
        </Card>
      </section>
    </div>
  );
}


