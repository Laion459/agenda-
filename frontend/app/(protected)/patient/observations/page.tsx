'use client';

import { useEffect, useState } from "react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { clsx } from "clsx";
import { handleApiError } from "@/lib/handle-api-error";
import { fetchPatientObservations } from "@/services/observation-service";
import { Observation } from "@/types";

export default function PatientObservationsPage() {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetchPatientObservations({ per_page: 50 });
        setObservations(response.data ?? []);
      } catch (error) {
        handleApiError(error, 'Não foi possível carregar o histórico');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Histórico clínico</CardTitle>
          <CardDescription>Observações registradas pelos médicos após suas consultas.</CardDescription>
        </div>
      </CardHeader>
      <div className="p-6">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : observations.length === 0 ? (
          <EmptyState>Nenhuma observação registrada até o momento.</EmptyState>
        ) : (
          <ul className="space-y-4">
            {observations.map((observation, index) => (
              <li 
                key={observation.id} 
                className={clsx(
                  "rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm",
                  "hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200",
                  "animate-fade-in"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {observation.doctor?.name ?? 'Profissional'}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {observation.appointment
                        ? new Date(observation.appointment.scheduled_at).toLocaleString('pt-BR', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })
                        : new Date(observation.created_at).toLocaleString('pt-BR', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                    </p>
                  </div>
                  <span className="rounded-full bg-blue-50 dark:bg-blue-900/30 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 transition-all duration-200">
                    {observation.appointment?.status ?? 'REGISTRADA'}
                  </span>
                </div>

                <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500">Anamnese</p>
                    <p>{observation.anamnesis}</p>
                  </div>
                  {observation.diagnosis && (
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">Diagnóstico</p>
                      <p className="text-slate-800 dark:text-slate-200">{observation.diagnosis}</p>
                    </div>
                  )}
                  {observation.prescription && (
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">Prescrição</p>
                      <p className="text-slate-800 dark:text-slate-200">{observation.prescription}</p>
                    </div>
                  )}
                  {observation.notes && (
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">Notas adicionais</p>
                      <p className="text-slate-800 dark:text-slate-200">{observation.notes}</p>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}


