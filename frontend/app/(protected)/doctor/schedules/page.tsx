'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { handleApiError } from "@/lib/handle-api-error";
import {
  createSchedule,
  deleteSchedule,
  fetchDoctorSchedules,
  Schedule,
} from "@/services/schedule-service";

const schema = z.object({
  day_of_week: z.string().min(1),
  start_time: z.string().min(1),
  end_time: z.string().min(1),
  slot_duration_minutes: z.coerce
    .number()
    .min(10, "Duração mínima de 10 minutos")
    .max(120, "Duração máxima de 120 minutos"),
});

type ScheduleForm = z.input<typeof schema>;

const days = [
  { label: "Segunda", value: "1" },
  { label: "Terça", value: "2" },
  { label: "Quarta", value: "3" },
  { label: "Quinta", value: "4" },
  { label: "Sexta", value: "5" },
  { label: "Sábado", value: "6" },
  { label: "Domingo", value: "7" },
];

export default function DoctorSchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ScheduleForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      day_of_week: "1",
      start_time: "08:00",
      end_time: "12:00",
      slot_duration_minutes: 30,
    },
  });

  useEffect(() => {
    async function load() {
      try {
        const response = await fetchDoctorSchedules();
        setSchedules(response.data ?? []);
      } catch (error) {
        handleApiError(error, "Não foi possível carregar a agenda.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const refresh = async () => {
    const response = await fetchDoctorSchedules();
    setSchedules(response.data ?? []);
  };

  const onSubmit = async (values: ScheduleForm) => {
    try {
      // Parse os valores usando o schema para obter os valores transformados
      const parsed = schema.parse(values);
      await createSchedule({
        ...parsed,
        day_of_week: Number(parsed.day_of_week),
      });
      toast.success("Horário registrado com sucesso.");
      reset();
      await refresh();
    } catch (error) {
      handleApiError(error, "Erro ao registrar horário.");
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await deleteSchedule(id);
      toast.success("Horário removido.");
      await refresh();
    } catch (error) {
      handleApiError(error, "Não foi possível remover.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Novo horário</CardTitle>
          <CardDescription>Configure horários disponíveis para seus pacientes.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6 pt-0">
          <div className="space-y-2">
            <Label htmlFor="day_of_week">Dia da semana</Label>
            <select
              id="day_of_week"
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register("day_of_week")}
            >
              {days.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="start_time">Início</Label>
              <Input id="start_time" type="time" {...register("start_time")} />
              {errors.start_time && <p className="text-xs text-red-500">{errors.start_time.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">Fim</Label>
              <Input id="end_time" type="time" {...register("end_time")} />
              {errors.end_time && <p className="text-xs text-red-500">{errors.end_time.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="slot_duration_minutes">Duração (min)</Label>
            <Input
              id="slot_duration_minutes"
              type="number"
              min={10}
              max={120}
              {...register("slot_duration_minutes")}
            />
            {errors.slot_duration_minutes && (
              <p className="text-xs text-red-500">{errors.slot_duration_minutes.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full">
            Salvar horário
          </Button>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Minhas agendas</CardTitle>
          <CardDescription>Horários já cadastrados</CardDescription>
        </CardHeader>
        <div className="max-h-[520px] overflow-y-auto border-t border-slate-200">
          {loading ? (
            <div className="space-y-3 p-6">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : schedules.length === 0 ? (
            <EmptyState className="m-4">Nenhum horário cadastrado.</EmptyState>
          ) : (
            <ul className="divide-y divide-slate-200">
              {schedules.map((schedule) => (
                <li key={schedule.id} className="flex items-center justify-between px-6 py-4 text-sm">
                  <div>
                    <p className="font-medium text-slate-800">
                      {days.find((d) => Number(d.value) === schedule.day_of_week)?.label}
                    </p>
                    <p className="text-xs text-slate-500">
                      {schedule.start_time} - {schedule.end_time} • {schedule.slot_duration_minutes} min
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => handleDelete(schedule.id)}
                    disabled={deletingId === schedule.id}
                  >
                    {deletingId === schedule.id ? "Removendo..." : "Excluir"}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
}
