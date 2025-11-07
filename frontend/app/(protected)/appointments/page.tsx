'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  cancelAppointment,
  confirmAppointment,
  createAppointment,
  fetchAppointment,
  fetchAppointments,
  rescheduleAppointment,
} from "@/services/appointment-service";
import { fetchDoctors } from "@/services/doctor-service";
import { createObservation } from "@/services/observation-service";
import { Appointment, Doctor } from "@/types";
import { useAuthStore } from "@/store/auth-store";
import { handleApiError } from "@/lib/handle-api-error";

const patientSchema = z.object({
  doctor_id: z.coerce.number(),
  scheduled_at: z.string().min(1, "Informe data e horário"),
  duration_minutes: z.coerce.number().min(15, "No mínimo 15 minutos").max(240, "Até 240 minutos"),
  type: z.enum(["PRESENTIAL", "ONLINE"]),
  notes: z.string().optional(),
});

type PatientForm = z.infer<typeof patientSchema>;

const observationSchema = z.object({
  anamnesis: z.string().min(1, "Informe a anamnese"),
  diagnosis: z.string().optional(),
  prescription: z.string().optional(),
  notes: z.string().optional(),
});

type ObservationForm = z.infer<typeof observationSchema>;

const rescheduleSchema = z.object({
  scheduled_at: z.string().min(1, "Informe a nova data"),
  duration_minutes: z.coerce.number().min(15).max(240),
});

type RescheduleForm = z.infer<typeof rescheduleSchema>;

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [selectedObservation, setSelectedObservation] = useState<Appointment | null>(null);
  const [selectedReschedule, setSelectedReschedule] = useState<Appointment | null>(null);
  const [detail, setDetail] = useState<Appointment | null>(null);
  const [detailLoadingId, setDetailLoadingId] = useState<number | null>(null);
  const user = useAuthStore((state) => state.user);

  const isDoctor = user?.role === 'DOCTOR';
  const isPatient = user?.role === 'PATIENT';

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PatientForm>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      type: 'PRESENTIAL',
      duration_minutes: 30,
    },
  });

  const {
    register: registerObservation,
    handleSubmit: handleObservationSubmit,
    formState: { errors: observationErrors },
    reset: resetObservation,
  } = useForm<ObservationForm>({
    resolver: zodResolver(observationSchema),
  });

  const {
    register: registerReschedule,
    handleSubmit: handleRescheduleSubmit,
    formState: { errors: rescheduleErrors },
    reset: resetReschedule,
    setValue: setRescheduleValue,
  } = useForm<RescheduleForm>({
    resolver: zodResolver(rescheduleSchema),
    defaultValues: {
      duration_minutes: 30,
    },
  });

  useEffect(() => {
    async function load() {
      try {
        const appointmentsResponse = await fetchAppointments({ per_page: 20 });
        setAppointments(appointmentsResponse.data ?? []);

        if (isPatient) {
          const doctorResponse = await fetchDoctors({ per_page: 50 });
          setDoctors(doctorResponse.data ?? []);
        }
      } catch (error) {
        handleApiError(error, 'Erro ao carregar consultas');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [isPatient]);

  const reloadAppointments = async () => {
    const response = await fetchAppointments({ per_page: 20 });
    setAppointments(response.data ?? []);
  };

  const onCreateAppointment = async (values: PatientForm) => {
    try {
      await createAppointment(values);
      toast.success('Consulta solicitada com sucesso');
      reset({ type: 'PRESENTIAL', duration_minutes: 30 } as Partial<PatientForm>);
      await reloadAppointments();
    } catch (error) {
      handleApiError(error, 'Não foi possível criar a consulta');
    }
  };

  const handleConfirm = async (id: number) => {
    setBusyId(id);
    try {
      await confirmAppointment(id);
      toast.success('Consulta confirmada');
      await reloadAppointments();
    } catch (error) {
      handleApiError(error, 'Falha ao confirmar');
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async (id: number) => {
    setBusyId(id);
    try {
      await cancelAppointment(id);
      toast.success('Consulta cancelada');
      await reloadAppointments();
    } catch (error) {
      handleApiError(error, 'Erro ao cancelar');
    } finally {
      setBusyId(null);
    }
  };

  const onCreateObservation = async (values: ObservationForm) => {
    if (!selectedObservation) return;
    setBusyId(selectedObservation.id);
    try {
      await createObservation(selectedObservation.id, values);
      toast.success('Observação registrada');
      resetObservation();
      setSelectedObservation(null);
      await reloadAppointments();
    } catch (error) {
      handleApiError(error, 'Erro ao registrar observação');
    } finally {
      setBusyId(null);
    }
  };

  const onReschedule = async (values: RescheduleForm) => {
    if (!selectedReschedule) return;
    setBusyId(selectedReschedule.id);
    try {
      await rescheduleAppointment(selectedReschedule.id, values);
      toast.success('Solicitação de remarcação enviada');
      resetReschedule();
      setSelectedReschedule(null);
      await reloadAppointments();
    } catch (error) {
      handleApiError(error, 'Erro ao remarcar');
    } finally {
      setBusyId(null);
    }
  };

  const handleViewDetail = async (appointment: Appointment) => {
    setDetailLoadingId(appointment.id);
    try {
      const response = await fetchAppointment(appointment.id);
      setDetail(response);
    } catch (error) {
      handleApiError(error, 'Não foi possível carregar detalhes');
    } finally {
      setDetailLoadingId(null);
    }
  };

  const doctorOptions = useMemo(
    () =>
      doctors.map((doctor) => ({
        value: doctor.id,
        label: `${doctor.name} • ${doctor.specialty}`,
      })),
    [doctors]
  );

  if (loading) {
    return <p className="text-sm text-slate-500">Carregando consultas...</p>;
  }

  return (
    <div className="space-y-6">
      {isPatient && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Agendar nova consulta</CardTitle>
              <CardDescription>Escolha o médico e o horário desejado.</CardDescription>
            </div>
          </CardHeader>
          <form onSubmit={handleSubmit(onCreateAppointment)} className="grid gap-4 p-6 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="doctor_id">Médico</Label>
              <select
                id="doctor_id"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('doctor_id')}
              >
                <option value="">Selecione</option>
                {doctorOptions.map((doctor) => (
                  <option key={doctor.value} value={doctor.value}>
                    {doctor.label}
                  </option>
                ))}
              </select>
              {errors.doctor_id && <p className="text-xs text-red-500">{errors.doctor_id.message as string}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduled_at">Data e hora</Label>
              <Input id="scheduled_at" type="datetime-local" {...register('scheduled_at')} />
              {errors.scheduled_at && <p className="text-xs text-red-500">{errors.scheduled_at.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration_minutes">Duração (min)</Label>
              <Input id="duration_minutes" type="number" {...register('duration_minutes', { valueAsNumber: true })} />
              {errors.duration_minutes && <p className="text-xs text-red-500">{errors.duration_minutes.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <select
                id="type"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('type')}
              >
                <option value="PRESENTIAL">Presencial</option>
                <option value="ONLINE">Online</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Observações</Label>
              <Input id="notes" placeholder="Informações adicionais (opcional)" {...register('notes')} />
            </div>
            <div className="md:col-span-2">
              <Button type="submit">Solicitar consulta</Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Consultas</CardTitle>
            <CardDescription>Acompanhe todas as suas consultas agendadas.</CardDescription>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="space-y-2 p-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">Data</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">Médico</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">Paciente</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">Status</th>
                  <th className="px-4 py-2 text-right font-medium text-slate-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {appointments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6">
                      <EmptyState className="border-none bg-transparent p-0">
                        Nenhuma consulta encontrada.
                      </EmptyState>
                    </td>
                  </tr>
                )}
                {appointments.map((appointment) => {
                const date = new Date(appointment.scheduled_at).toLocaleString('pt-BR', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                });
                const canConfirm =
                  isDoctor && appointment.status === 'PENDING';
                const canCancel = appointment.status !== 'CANCELLED';
              const canReschedule = appointment.status !== 'CANCELLED';
                const canObserve = isDoctor && appointment.status === 'COMPLETED';

                return (
                  <tr key={appointment.id}>
                    <td className="px-4 py-2 text-slate-700">{date}</td>
                    <td className="px-4 py-2 text-slate-700">{appointment.doctor?.name ?? '---'}</td>
                    <td className="px-4 py-2 text-slate-700">{appointment.patient?.name ?? '---'}</td>
                    <td className="px-4 py-2">
                      <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {appointment.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        {canConfirm && (
                          <Button
                            variant="secondary"
                            onClick={() => handleConfirm(appointment.id)}
                            disabled={busyId === appointment.id}
                          >
                            Confirmar
                          </Button>
                        )}
                        {canCancel && (
                          <Button
                            variant="ghost"
                            onClick={() => handleCancel(appointment.id)}
                            disabled={busyId === appointment.id}
                          >
                            Cancelar
                          </Button>
                        )}
                        {canReschedule && (
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setSelectedReschedule(appointment);
                              const iso = new Date(appointment.scheduled_at).toISOString().slice(0, 16);
                              setRescheduleValue('scheduled_at', iso);
                              setRescheduleValue('duration_minutes', appointment.duration_minutes);
                            }}
                          >
                            Remarcar
                          </Button>
                        )}
                        {canObserve && (
                          <Button
                            onClick={() => {
                              setSelectedObservation(appointment);
                              resetObservation();
                            }}
                          >
                            Registrar observação
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          onClick={() => handleViewDetail(appointment)}
                          disabled={detailLoadingId === appointment.id}
                        >
                          {detailLoadingId === appointment.id ? 'Carregando...' : 'Ver detalhes'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {selectedObservation && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Observações clínicas</CardTitle>
              <CardDescription>
                {selectedObservation.patient?.name ?? 'Paciente'} • Consulta em{' '}
                {new Date(selectedObservation.scheduled_at).toLocaleString('pt-BR', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
              </CardDescription>
            </div>
          </CardHeader>
          <form onSubmit={handleObservationSubmit(onCreateObservation)} className="grid gap-4 p-6">
            <div className="space-y-2">
              <Label htmlFor="anamnesis">Anamnese</Label>
              <Textarea id="anamnesis" rows={3} {...registerObservation('anamnesis')} />
              {observationErrors.anamnesis && (
                <p className="text-xs text-red-500">{observationErrors.anamnesis.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="diagnosis">Diagnóstico</Label>
              <Textarea id="diagnosis" rows={2} {...registerObservation('diagnosis')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prescription">Prescrição</Label>
              <Textarea id="prescription" rows={2} {...registerObservation('prescription')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas adicionais</Label>
              <Textarea id="notes" rows={2} {...registerObservation('notes')} />
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setSelectedObservation(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={busyId === selectedObservation.id}>
                Salvar observação
              </Button>
            </div>
          </form>
        </Card>
      )}

      {selectedReschedule && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Remarcar consulta</CardTitle>
              <CardDescription>
                {selectedReschedule.patient?.name ?? 'Paciente'} •{' '}
                {selectedReschedule.doctor?.name ?? 'Médico'}
              </CardDescription>
            </div>
          </CardHeader>
          <form onSubmit={handleRescheduleSubmit(onReschedule)} className="grid gap-4 p-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reschedule_datetime">Nova data e hora</Label>
              <Input id="reschedule_datetime" type="datetime-local" {...registerReschedule('scheduled_at')} />
              {rescheduleErrors.scheduled_at && (
                <p className="text-xs text-red-500">{rescheduleErrors.scheduled_at.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="reschedule_duration">Duração (min)</Label>
              <Input
                id="reschedule_duration"
                type="number"
                min={15}
                max={240}
                {...registerReschedule('duration_minutes', { valueAsNumber: true })}
              />
              {rescheduleErrors.duration_minutes && (
                <p className="text-xs text-red-500">{rescheduleErrors.duration_minutes.message}</p>
              )}
            </div>
            <div className="md:col-span-2 flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setSelectedReschedule(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={busyId === selectedReschedule.id}>
                Enviar remarcação
              </Button>
            </div>
          </form>
        </Card>
      )}

      {detail && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Detalhes da consulta</CardTitle>
              <CardDescription>
                {detail.patient?.name ?? 'Paciente'} • {detail.doctor?.name ?? 'Médico'}
              </CardDescription>
            </div>
          </CardHeader>
          <div className="grid gap-4 p-6">
            <div className="grid gap-2 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Status</p>
                <p className="text-sm text-slate-800">{detail.status}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Data</p>
                <p className="text-sm text-slate-800">
                  {new Date(detail.scheduled_at).toLocaleString('pt-BR', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Tipo</p>
                <p className="text-sm text-slate-800">{detail.type}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Duração</p>
                <p className="text-sm text-slate-800">{detail.duration_minutes} minutos</p>
              </div>
            </div>

            {detail.notes && (
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Notas</p>
                <p className="text-sm text-slate-700">{detail.notes}</p>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Observações clínicas</p>
              {detail.observations && detail.observations.length > 0 ? (
                <ul className="mt-2 space-y-3">
                  {detail.observations.map((obs) => (
                    <li key={obs.id} className="rounded-md border border-slate-200 p-3">
                      <p className="text-sm font-medium text-slate-800">
                        Registrado em {new Date(obs.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">Anamnese</p>
                      <p className="text-sm text-slate-700">{obs.anamnesis}</p>
                      {obs.diagnosis && (
                        <>
                          <p className="mt-2 text-xs text-slate-500">Diagnóstico</p>
                          <p className="text-sm text-slate-700">{obs.diagnosis}</p>
                        </>
                      )}
                      {obs.prescription && (
                        <>
                          <p className="mt-2 text-xs text-slate-500">Prescrição</p>
                          <p className="text-sm text-slate-700">{obs.prescription}</p>
                        </>
                      )}
                      {obs.notes && (
                        <>
                          <p className="mt-2 text-xs text-slate-500">Notas adicionais</p>
                          <p className="text-sm text-slate-700">{obs.notes}</p>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-500">Nenhuma observação registrada.</p>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Histórico de status</p>
              {detail.logs && detail.logs.length > 0 ? (
                <ul className="mt-2 space-y-2">
                  {detail.logs.map((log) => (
                    <li key={log.id} className="rounded-md border border-slate-200 p-3 text-sm">
                      <p className="font-medium text-slate-800">
                        {log.old_status ?? 'N/A'} → {log.new_status}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(log.changed_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                        {log.changed_by ? ` • ${log.changed_by.name}` : ''}
                      </p>
                      {log.reason && <p className="mt-1 text-xs text-slate-600">Motivo: {log.reason}</p>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-500">Sem histórico registrado.</p>
              )}
            </div>

            <div className="flex items-center justify-end">
              <Button variant="ghost" onClick={() => setDetail(null)}>
                Fechar
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}


