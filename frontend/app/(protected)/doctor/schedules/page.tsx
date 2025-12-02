'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { handleApiError } from "@/lib/handle-api-error";
import {
  createSchedule,
  deleteSchedule,
  fetchDoctorSchedules,
  Schedule,
} from "@/services/schedule-service";
import {
  createScheduleException,
  deleteScheduleException,
  fetchScheduleExceptions,
  ScheduleException,
  updateScheduleException,
} from "@/services/schedule-exception-service";
import {
  createAvailabilityPeriod,
  deleteAvailabilityPeriod,
  fetchAvailabilityPeriods,
  AvailabilityPeriod,
  updateAvailabilityPeriod,
} from "@/services/availability-period-service";
import { Trash2, Calendar, Clock, X } from "lucide-react";

const scheduleSchema = z.object({
  day_of_week: z.string().min(1),
  start_time: z.string().min(1),
  end_time: z.string().min(1),
  slot_duration_minutes: z.coerce
    .number()
    .min(10, "Duração mínima de 10 minutos")
    .max(120, "Duração máxima de 120 minutos"),
});

const exceptionSchema = z.object({
  date: z.string().min(1, "Selecione uma data"),
  type: z.enum(['BLOCKED', 'CUSTOM_HOURS', 'UNAVAILABLE']),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  reason: z.string().optional(),
}).refine((data) => {
  if (data.type === 'CUSTOM_HOURS') {
    return data.start_time && data.end_time;
  }
  return true;
}, {
  message: "Horários customizados requerem início e fim",
  path: ["start_time"],
});

const periodSchema = z.object({
  start_date: z.string().min(1, "Data de início obrigatória"),
  end_date: z.string().min(1, "Data de fim obrigatória"),
  is_active: z.boolean().optional(),
  description: z.string().optional(),
}).refine((data) => {
  if (data.start_date && data.end_date) {
    return new Date(data.start_date) <= new Date(data.end_date);
  }
  return true;
}, {
  message: "Data de fim deve ser posterior ou igual à data de início",
  path: ["end_date"],
});

type ScheduleForm = z.input<typeof scheduleSchema>;
type ExceptionForm = z.input<typeof exceptionSchema>;
type PeriodForm = z.input<typeof periodSchema>;

const days = [
  { label: "Segunda", value: "1" },
  { label: "Terça", value: "2" },
  { label: "Quarta", value: "3" },
  { label: "Quinta", value: "4" },
  { label: "Sexta", value: "5" },
  { label: "Sábado", value: "6" },
  { label: "Domingo", value: "7" },
];

const exceptionTypes = [
  { label: "Bloqueado", value: "BLOCKED", description: "Data completamente bloqueada" },
  { label: "Horários Customizados", value: "CUSTOM_HOURS", description: "Horários específicos para esta data" },
  { label: "Indisponível", value: "UNAVAILABLE", description: "Médico indisponível nesta data" },
];

export default function DoctorSchedulesPage() {
  const [activeTab, setActiveTab] = useState("schedules");
  
  // Schedules
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(true);
  const [deletingScheduleId, setDeletingScheduleId] = useState<number | null>(null);

  // Exceptions
  const [exceptions, setExceptions] = useState<ScheduleException[]>([]);
  const [exceptionsLoading, setExceptionsLoading] = useState(true);
  const [deletingExceptionId, setDeletingExceptionId] = useState<number | null>(null);
  const [showExceptionForm, setShowExceptionForm] = useState(false);

  // Periods
  const [periods, setPeriods] = useState<AvailabilityPeriod[]>([]);
  const [periodsLoading, setPeriodsLoading] = useState(true);
  const [deletingPeriodId, setDeletingPeriodId] = useState<number | null>(null);
  const [showPeriodForm, setShowPeriodForm] = useState(false);

  // Forms
  const scheduleForm = useForm<ScheduleForm>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      day_of_week: "1",
      start_time: "08:00",
      end_time: "12:00",
      slot_duration_minutes: 30,
    },
  });

  const exceptionForm = useForm<ExceptionForm>({
    resolver: zodResolver(exceptionSchema),
    defaultValues: {
      type: 'BLOCKED',
      date: '',
    },
  });

  const periodForm = useForm<PeriodForm>({
    resolver: zodResolver(periodSchema),
    defaultValues: {
      is_active: true,
    },
  });

  const watchedExceptionType = exceptionForm.watch('type');

  // Load data
  useEffect(() => {
    loadSchedules();
    loadExceptions();
    loadPeriods();
  }, []);

  async function loadSchedules() {
    try {
      setSchedulesLoading(true);
      const response = await fetchDoctorSchedules();
      setSchedules(response.data ?? []);
    } catch (error) {
      handleApiError(error, "Não foi possível carregar a agenda.");
    } finally {
      setSchedulesLoading(false);
    }
  }

  async function loadExceptions() {
    try {
      setExceptionsLoading(true);
      const response = await fetchScheduleExceptions();
      setExceptions(response.data ?? []);
    } catch (error) {
      handleApiError(error, "Não foi possível carregar as exceções.");
    } finally {
      setExceptionsLoading(false);
    }
  }

  async function loadPeriods() {
    try {
      setPeriodsLoading(true);
      const response = await fetchAvailabilityPeriods();
      setPeriods(response.data ?? []);
    } catch (error) {
      handleApiError(error, "Não foi possível carregar os períodos.");
    } finally {
      setPeriodsLoading(false);
    }
  }

  // Schedule handlers
  const onScheduleSubmit = async (values: ScheduleForm) => {
    try {
      const parsed = scheduleSchema.parse(values);
      await createSchedule({
        ...parsed,
        day_of_week: Number(parsed.day_of_week),
      });
      toast.success("Horário registrado com sucesso.");
      scheduleForm.reset();
      await loadSchedules();
    } catch (error) {
      handleApiError(error, "Erro ao registrar horário.");
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    setDeletingScheduleId(id);
    try {
      await deleteSchedule(id);
      toast.success("Horário removido.");
      await loadSchedules();
    } catch (error) {
      handleApiError(error, "Não foi possível remover.");
    } finally {
      setDeletingScheduleId(null);
    }
  };

  // Exception handlers
  const onExceptionSubmit = async (values: ExceptionForm) => {
    try {
      const parsed = exceptionSchema.parse(values);
      await createScheduleException({
        date: parsed.date,
        type: parsed.type,
        start_time: parsed.start_time,
        end_time: parsed.end_time,
        reason: parsed.reason,
      });
      toast.success("Exceção registrada com sucesso.");
      exceptionForm.reset({ type: 'BLOCKED', date: '' });
      setShowExceptionForm(false);
      await loadExceptions();
    } catch (error) {
      handleApiError(error, "Erro ao registrar exceção.");
    }
  };

  const handleDeleteException = async (id: number) => {
    setDeletingExceptionId(id);
    try {
      await deleteScheduleException(id);
      toast.success("Exceção removida.");
      await loadExceptions();
    } catch (error) {
      handleApiError(error, "Não foi possível remover.");
    } finally {
      setDeletingExceptionId(null);
    }
  };

  // Period handlers
  const onPeriodSubmit = async (values: PeriodForm) => {
    try {
      const parsed = periodSchema.parse(values);
      await createAvailabilityPeriod({
        start_date: parsed.start_date,
        end_date: parsed.end_date,
        is_active: parsed.is_active ?? true,
        description: parsed.description,
      });
      toast.success("Período registrado com sucesso.");
      periodForm.reset({ is_active: true });
      setShowPeriodForm(false);
      await loadPeriods();
    } catch (error) {
      handleApiError(error, "Erro ao registrar período.");
    }
  };

  const handleDeletePeriod = async (id: number) => {
    setDeletingPeriodId(id);
    try {
      await deleteAvailabilityPeriod(id);
      toast.success("Período removido.");
      await loadPeriods();
    } catch (error) {
      handleApiError(error, "Não foi possível remover.");
    } finally {
      setDeletingPeriodId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr + 'T00:00:00'); // Adiciona hora para evitar problemas de timezone
      return date.toLocaleDateString('pt-BR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestão de Agenda</CardTitle>
          <CardDescription>
            Configure seus horários padrão, exceções e períodos de disponibilidade.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="schedules">Horários Padrão</TabsTrigger>
          <TabsTrigger value="exceptions">Exceções</TabsTrigger>
          <TabsTrigger value="periods">Períodos</TabsTrigger>
        </TabsList>

        {/* Aba: Horários Padrão */}
        <TabsContent value="schedules" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Novo horário</CardTitle>
                <CardDescription>Configure horários disponíveis para seus pacientes.</CardDescription>
              </CardHeader>
              <form onSubmit={scheduleForm.handleSubmit(onScheduleSubmit)} className="space-y-4 p-6 pt-0">
                <div className="space-y-2">
                  <Label htmlFor="day_of_week">Dia da semana</Label>
                  <select
                    id="day_of_week"
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...scheduleForm.register("day_of_week")}
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
                    <Input id="start_time" type="time" {...scheduleForm.register("start_time")} />
                    {scheduleForm.formState.errors.start_time && (
                      <p className="text-xs text-red-500">{scheduleForm.formState.errors.start_time.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_time">Fim</Label>
                    <Input id="end_time" type="time" {...scheduleForm.register("end_time")} />
                    {scheduleForm.formState.errors.end_time && (
                      <p className="text-xs text-red-500">{scheduleForm.formState.errors.end_time.message}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slot_duration_minutes">Duração (min)</Label>
                  <Input
                    id="slot_duration_minutes"
                    type="number"
                    min={10}
                    max={120}
                    {...scheduleForm.register("slot_duration_minutes")}
                  />
                  {scheduleForm.formState.errors.slot_duration_minutes && (
                    <p className="text-xs text-red-500">
                      {scheduleForm.formState.errors.slot_duration_minutes.message}
                    </p>
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
                {schedulesLoading ? (
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
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          disabled={deletingScheduleId === schedule.id}
                        >
                          {deletingScheduleId === schedule.id ? "Removendo..." : "Excluir"}
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Aba: Exceções */}
        <TabsContent value="exceptions" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Exceções de Agenda</CardTitle>
                  <CardDescription>
                    Bloqueie datas específicas ou defina horários customizados para datas específicas.
                  </CardDescription>
                </div>
                <Button onClick={() => setShowExceptionForm(!showExceptionForm)}>
                  {showExceptionForm ? <X className="h-4 w-4 mr-2" /> : <Calendar className="h-4 w-4 mr-2" />}
                  {showExceptionForm ? "Cancelar" : "Nova Exceção"}
                </Button>
              </div>
            </CardHeader>
            {showExceptionForm && (
              <form
                onSubmit={exceptionForm.handleSubmit(onExceptionSubmit)}
                className="space-y-4 p-6 pt-0 border-t border-slate-200"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="exception_date">Data *</Label>
                    <Input
                      id="exception_date"
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      {...exceptionForm.register("date")}
                    />
                    {exceptionForm.formState.errors.date && (
                      <p className="text-xs text-red-500">{exceptionForm.formState.errors.date.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exception_type">Tipo *</Label>
                    <select
                      id="exception_type"
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      {...exceptionForm.register("type")}
                    >
                      {exceptionTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    {exceptionForm.formState.errors.type && (
                      <p className="text-xs text-red-500">{exceptionForm.formState.errors.type.message}</p>
                    )}
                  </div>
                </div>
                {watchedExceptionType === 'CUSTOM_HOURS' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="exception_start_time">Horário de Início *</Label>
                      <Input
                        id="exception_start_time"
                        type="time"
                        {...exceptionForm.register("start_time")}
                      />
                      {exceptionForm.formState.errors.start_time && (
                        <p className="text-xs text-red-500">
                          {exceptionForm.formState.errors.start_time.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="exception_end_time">Horário de Fim *</Label>
                      <Input
                        id="exception_end_time"
                        type="time"
                        {...exceptionForm.register("end_time")}
                      />
                      {exceptionForm.formState.errors.end_time && (
                        <p className="text-xs text-red-500">
                          {exceptionForm.formState.errors.end_time.message}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="exception_reason">Motivo (opcional)</Label>
                  <Input
                    id="exception_reason"
                    placeholder="Ex: Feriado, Férias, etc."
                    {...exceptionForm.register("reason")}
                  />
                </div>
                <Button type="submit" className="w-full">
                  Salvar Exceção
                </Button>
              </form>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Exceções Cadastradas</CardTitle>
              <CardDescription>Lista de datas bloqueadas ou com horários customizados</CardDescription>
            </CardHeader>
            <div className="max-h-[520px] overflow-y-auto border-t border-slate-200">
              {exceptionsLoading ? (
                <div className="space-y-3 p-6">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : exceptions.length === 0 ? (
                <EmptyState className="m-4">Nenhuma exceção cadastrada.</EmptyState>
              ) : (
                <ul className="divide-y divide-slate-200">
                  {exceptions.map((exception) => (
                    <li key={exception.id} className="flex items-center justify-between px-6 py-4 text-sm">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-500" />
                          <p className="font-medium text-slate-800">{formatDate(exception.date)}</p>
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                            {exceptionTypes.find((t) => t.value === exception.type)?.label}
                          </span>
                        </div>
                        {exception.type === 'CUSTOM_HOURS' && exception.start_time && exception.end_time && (
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {exception.start_time} - {exception.end_time}
                          </p>
                        )}
                        {exception.reason && (
                          <p className="text-xs text-slate-500 mt-1">{exception.reason}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteException(exception.id)}
                        disabled={deletingExceptionId === exception.id}
                      >
                        {deletingExceptionId === exception.id ? (
                          "Removendo..."
                        ) : (
                          <Trash2 className="h-4 w-4 text-red-500" />
                        )}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Aba: Períodos */}
        <TabsContent value="periods" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Períodos de Disponibilidade</CardTitle>
                  <CardDescription>
                    Defina períodos em que você estará disponível para agendamentos.
                  </CardDescription>
                </div>
                <Button onClick={() => setShowPeriodForm(!showPeriodForm)}>
                  {showPeriodForm ? <X className="h-4 w-4 mr-2" /> : <Calendar className="h-4 w-4 mr-2" />}
                  {showPeriodForm ? "Cancelar" : "Novo Período"}
                </Button>
              </div>
            </CardHeader>
            {showPeriodForm && (
              <form
                onSubmit={periodForm.handleSubmit(onPeriodSubmit)}
                className="space-y-4 p-6 pt-0 border-t border-slate-200"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="period_start_date">Data de Início *</Label>
                    <Input
                      id="period_start_date"
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      {...periodForm.register("start_date")}
                    />
                    {periodForm.formState.errors.start_date && (
                      <p className="text-xs text-red-500">
                        {periodForm.formState.errors.start_date.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="period_end_date">Data de Fim *</Label>
                    <Input
                      id="period_end_date"
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      {...periodForm.register("end_date")}
                    />
                    {periodForm.formState.errors.end_date && (
                      <p className="text-xs text-red-500">
                        {periodForm.formState.errors.end_date.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="period_description">Descrição (opcional)</Label>
                  <Textarea
                    id="period_description"
                    placeholder="Ex: Próximos 3 meses, Período de férias, etc."
                    rows={2}
                    {...periodForm.register("description")}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="period_is_active"
                    className="rounded border-slate-300"
                    {...periodForm.register("is_active")}
                  />
                  <Label htmlFor="period_is_active" className="font-normal cursor-pointer">
                    Período ativo
                  </Label>
                </div>
                <Button type="submit" className="w-full">
                  Salvar Período
                </Button>
              </form>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Períodos Cadastrados</CardTitle>
              <CardDescription>Lista de períodos de disponibilidade</CardDescription>
            </CardHeader>
            <div className="max-h-[520px] overflow-y-auto border-t border-slate-200">
              {periodsLoading ? (
                <div className="space-y-3 p-6">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : periods.length === 0 ? (
                <EmptyState className="m-4">Nenhum período cadastrado.</EmptyState>
              ) : (
                <ul className="divide-y divide-slate-200">
                  {periods.map((period) => (
                    <li key={period.id} className="flex items-center justify-between px-6 py-4 text-sm">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-500" />
                          <p className="font-medium text-slate-800">
                            {formatDate(period.start_date)} - {formatDate(period.end_date)}
                          </p>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              period.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {period.is_active ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                        {period.description && (
                          <p className="text-xs text-slate-500 mt-1">{period.description}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePeriod(period.id)}
                        disabled={deletingPeriodId === period.id}
                      >
                        {deletingPeriodId === period.id ? (
                          "Removendo..."
                        ) : (
                          <Trash2 className="h-4 w-4 text-red-500" />
                        )}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
