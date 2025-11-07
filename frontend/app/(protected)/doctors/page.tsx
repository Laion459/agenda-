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
          <EmptyState>Nenhum profissional encontrado.</EmptyState>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDoctors.map((doctor) => (
              <div key={doctor.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-base font-semibold text-slate-900">{doctor.name}</p>
                <p className="text-xs text-slate-500">CRM {doctor.crm}</p>
                <p className="mt-2 text-sm text-slate-700">{doctor.specialty}</p>
                {doctor.health_insurances && doctor.health_insurances.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <p className="text-xs font-semibold uppercase text-slate-500">Convênios</p>
                    <ul className="text-xs text-slate-600">
                      {doctor.health_insurances.map((plan) => (
                        <li key={plan.id}>{plan.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}


