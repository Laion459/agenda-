'use client';

import { useEffect, useMemo, useState } from "react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { handleApiError } from "@/lib/handle-api-error";
import { fetchDoctors } from "@/services/doctor-service";
import { Doctor } from "@/types";

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const filteredDoctors = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return doctors;
    return doctors.filter((doctor) =>
      [doctor.name, doctor.specialty, doctor.crm]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(query))
    );
  }, [doctors, search]);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetchDoctors({ per_page: 50 });
        setDoctors(response.data ?? []);
      } catch (error) {
        handleApiError(error, "Erro ao carregar profissionais");
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
          <CardTitle>Profissionais de saúde</CardTitle>
          <CardDescription>Médicos disponíveis na rede Agenda+.</CardDescription>
        </div>
      </CardHeader>
      <div className="space-y-4 p-4">
        <div>
          <Input
            placeholder="Buscar por nome, especialidade ou CRM"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : filteredDoctors.length === 0 ? (
          <EmptyState variant="no-data" title="Nenhum profissional encontrado" description="Tente ajustar sua busca." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDoctors.map((doctor, index) => (
              <Card
                key={doctor.id}
                variant="interactive"
                className="animate-fade-in hover:border-blue-300 dark:hover:border-blue-600"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 dark:text-blue-400 font-semibold text-lg">
                      {doctor.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-slate-900 dark:text-white truncate">{doctor.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">CRM {doctor.crm}</p>
                    <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{doctor.specialty}</p>
                    {doctor.health_insurances && doctor.health_insurances.length > 0 && (
                      <div className="mt-3 space-y-1">
                        <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Convênios</p>
                        <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
                          {doctor.health_insurances.slice(0, 3).map((plan) => (
                            <li key={plan.id} className="truncate">• {plan.name}</li>
                          ))}
                          {doctor.health_insurances.length > 3 && (
                            <li className="text-slate-500 dark:text-slate-500">
                              +{doctor.health_insurances.length - 3} mais
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}


