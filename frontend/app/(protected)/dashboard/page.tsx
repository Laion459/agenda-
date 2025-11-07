'use client';

import Link from "next/link";
import { useEffect, useState } from "react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { handleApiError } from "@/lib/handle-api-error";
import { fetchAppointments } from "@/services/appointment-service";
import { fetchDoctors } from "@/services/doctor-service";
import { Appointment, Doctor } from "@/types";

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

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

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
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
                    <span className="mt-1 inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {appointment.status}
                    </span>
                  </div>
                ))}
                <Link href="/appointments" className="text-sm font-medium text-blue-600 hover:underline">
                  Ver todas as consultas
                </Link>
              </>
            )}
          </div>
        </Card>
        <Card className="md:col-span-2">
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
    </div>
  );
}


