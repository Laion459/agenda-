'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge, getStatusLabel } from "@/components/ui/status-badge";
import {
  cancelAppointment,
  confirmAppointment,
  createAppointment,
  createAdminAppointment,
  fetchAppointment,
  fetchAppointments,
  rescheduleAppointment,
} from "@/services/appointment-service";
import { fetchDoctors, fetchAvailableSlots, fetchAvailableDates } from "@/services/doctor-service";
import { createObservation } from "@/services/observation-service";
import { fetchPatientObservationHistory } from "@/services/patient-observation-service";
import { fetchAdminPatients, createPatient } from "@/services/admin-patient-service";
import { Appointment, Doctor, Observation, Patient } from "@/types";
import { useAuthStore } from "@/store/auth-store";
import { handleApiError } from "@/lib/handle-api-error";
import { APPOINTMENT_STATUS_OPTIONS } from "@/constants/appointments";
import { Modal } from "@/components/ui/modal";
import { Plus, Clock, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

// Schema base para criação de consultas
const baseAppointmentSchema = z.object({
  doctor_id: z.coerce.number().min(1, "Selecione um médico"),
  patient_id: z.coerce.number().optional(),
  scheduled_at: z.string().min(1, "Informe data e horário"),
  duration_minutes: z.coerce.number().min(15, "No mínimo 15 minutos").max(240, "Até 240 minutos"),
  type: z.enum(["PRESENTIAL", "ONLINE"]),
  notes: z.string().optional(),
});

type PatientForm = z.input<typeof baseAppointmentSchema>;

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

type RescheduleForm = z.input<typeof rescheduleSchema>;

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [selectedObservation, setSelectedObservation] = useState<Appointment | null>(null);
  const [selectedReschedule, setSelectedReschedule] = useState<Appointment | null>(null);
  const [detail, setDetail] = useState<Appointment | null>(null);
  const [detailLoadingId, setDetailLoadingId] = useState<number | null>(null);
  const [patientHistory, setPatientHistory] = useState<Observation[] | null>(null);
  const [patientHistoryLoading, setPatientHistoryLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCreatePatientDialog, setShowCreatePatientDialog] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [doctorSearch, setDoctorSearch] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [doctorHasNoSchedules, setDoctorHasNoSchedules] = useState(false);
  const user = useAuthStore((state) => state.user);

  const isDoctor = user?.role === 'DOCTOR';
  const isPatient = user?.role === 'PATIENT';
  const isAdmin = user?.role === 'ADMIN';

  // Schema dinâmico baseado no role
  const appointmentSchema = useMemo(() => {
    if (isAdmin) {
      return baseAppointmentSchema.extend({
        patient_id: z.coerce.number().min(1, "Selecione um paciente"),
      });
    }
    return baseAppointmentSchema;
  }, [isAdmin]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<PatientForm>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      type: 'PRESENTIAL',
      duration_minutes: 30,
    },
  });

  const watchedDoctorId = watch('doctor_id');
  const watchedDuration = watch('duration_minutes') || 30;
  const watchedDate = watch('scheduled_at');

  // Carrega horários disponíveis quando médico e data são selecionados
  useEffect(() => {
    const loadAvailableSlots = async () => {
      if (!watchedDoctorId || !watchedDate) {
        setAvailableSlots([]);
        return;
      }

      try {
        // Extrai apenas a data (sem hora) do campo
        let dateOnly = '';
        if (watchedDate.includes('T')) {
          dateOnly = watchedDate.split('T')[0];
        } else if (watchedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
          dateOnly = watchedDate;
        } else {
          setAvailableSlots([]);
          return;
        }

        if (!dateOnly) {
          setAvailableSlots([]);
          return;
        }

        setLoadingSlots(true);
        const response = await fetchAvailableSlots(
          Number(watchedDoctorId),
          dateOnly,
          Number(watchedDuration)
        );
        setAvailableSlots(response.available_slots || []);
      } catch (error) {
        console.error('Erro ao carregar horários disponíveis:', error);
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    loadAvailableSlots();
  }, [watchedDoctorId, watchedDate, watchedDuration]);

  // Função para carregar dias disponíveis do mês
  const loadAvailableDates = async (doctorId: number) => {
    if (!doctorId) {
      setAvailableDates([]);
      setDoctorHasNoSchedules(false);
      return;
    }

    try {
      setLoadingDates(true);
      const response = await fetchAvailableDates(doctorId, currentMonth);
      setAvailableDates(response.available_dates || []);
      setDoctorHasNoSchedules(response.has_schedules === false);
    } catch (error) {
      console.error('Erro ao carregar dias disponíveis:', error);
      setAvailableDates([]);
      setDoctorHasNoSchedules(false);
    } finally {
      setLoadingDates(false);
    }
  };

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
        const appointmentsResponse = await fetchAppointments({ per_page: 20, status: statusFilter });
        setAppointments(appointmentsResponse.data ?? []);

        // Carrega médicos para pacientes ou admin
        if (isPatient || isAdmin) {
          const doctorResponse = await fetchDoctors({ per_page: 100 });
          setDoctors(doctorResponse.data ?? []);
        }

        // Carrega pacientes para admin
        if (isAdmin) {
          const patientResponse = await fetchAdminPatients({ per_page: 100 });
          setPatients(patientResponse.data ?? []);
        }
      } catch (error) {
        handleApiError(error, 'Erro ao carregar consultas');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [isPatient, isAdmin, statusFilter]);

  const reloadAppointments = async () => {
    const response = await fetchAppointments({ per_page: 20, status: statusFilter });
    setAppointments(response.data ?? []);
  };

  const onCreateAppointment = async (values: PatientForm) => {
    try {
      // Parse os valores usando o schema para obter os valores transformados
      const parsed = appointmentSchema.parse(values);
      
      // Converte datetime para formato que o backend espera
      if (parsed.scheduled_at) {
        // Garante que está no formato correto
        let dateTime: Date;
        
        if (typeof parsed.scheduled_at === 'string') {
          // Se já está no formato datetime-local (YYYY-MM-DDTHH:MM)
          if (parsed.scheduled_at.includes('T')) {
            dateTime = new Date(parsed.scheduled_at);
          } else if (parsed.scheduled_at.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/)) {
            // Se já está no formato YYYY-MM-DD HH:MM
            dateTime = new Date(parsed.scheduled_at.replace(' ', 'T'));
          } else {
            // Assume que é apenas data
            dateTime = new Date(parsed.scheduled_at + 'T09:00:00');
          }
        } else {
          dateTime = parsed.scheduled_at as unknown as Date;
        }
        
        // Valida se a data é válida
        if (isNaN(dateTime.getTime())) {
          throw new Error('Data/hora inválida');
        }
        
        // Converte para formato ISO sem timezone (formato que Laravel aceita melhor)
        const year = dateTime.getFullYear();
        const month = String(dateTime.getMonth() + 1).padStart(2, '0');
        const day = String(dateTime.getDate()).padStart(2, '0');
        const hours = String(dateTime.getHours()).padStart(2, '0');
        const minutes = String(dateTime.getMinutes()).padStart(2, '0');
        const seconds = String(dateTime.getSeconds()).padStart(2, '0');
        
        parsed.scheduled_at = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      }
      
      if (isAdmin) {
        // Admin usa endpoint específico que aceita patient_id
        await createAdminAppointment(parsed);
      } else {
        // Remove patient_id se não for admin (pacientes não podem escolher outro paciente)
        if ('patient_id' in parsed) {
          delete parsed.patient_id;
        }
        await createAppointment(parsed);
      }
      
      toast.success('Consulta agendada com sucesso');
      reset({ type: 'PRESENTIAL', duration_minutes: 30 } as Partial<PatientForm>);
      setShowCreateDialog(false);
      setPatientSearch('');
      setDoctorSearch('');
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
      // Parse os valores usando o schema para obter os valores transformados
      const parsed = rescheduleSchema.parse(values);
      
      // Converte datetime-local para formato ISO que o backend espera
      if (parsed.scheduled_at) {
        const dateTime = new Date(parsed.scheduled_at);
        parsed.scheduled_at = dateTime.toISOString().slice(0, 19).replace('T', ' ');
      }
      
      await rescheduleAppointment(selectedReschedule.id, parsed);
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
      setPatientHistory(null);
    } catch (error) {
      handleApiError(error, 'Não foi possível carregar detalhes');
    } finally {
      setDetailLoadingId(null);
    }
  };

  const filteredDoctors = useMemo(() => {
    if (!doctorSearch) return doctors;
    const search = doctorSearch.toLowerCase();
    return doctors.filter(
      (doctor) =>
        doctor.name.toLowerCase().includes(search) ||
        doctor.specialty?.toLowerCase().includes(search)
    );
  }, [doctors, doctorSearch]);

  const filteredPatients = useMemo(() => {
    if (!patientSearch) return patients;
    const search = patientSearch.toLowerCase();
    return patients.filter(
      (patient) =>
        patient.name.toLowerCase().includes(search) ||
        patient.cpf?.toLowerCase().includes(search) ||
        patient.email?.toLowerCase().includes(search)
    );
  }, [patients, patientSearch]);

  const doctorOptions = useMemo(
    () =>
      filteredDoctors.map((doctor) => ({
        value: doctor.id,
        label: `${doctor.name} • ${doctor.specialty}`,
      })),
    [filteredDoctors]
  );

  const patientOptions = useMemo(
    () =>
      filteredPatients.map((patient) => ({
        value: patient.id,
        label: `${patient.name}${patient.cpf ? ` • CPF: ${patient.cpf}` : ''}`,
      })),
    [filteredPatients]
  );

  const loadPatientHistory = async (patientId: number) => {
    setPatientHistoryLoading(true);
    try {
      const history = await fetchPatientObservationHistory(patientId);
      setPatientHistory(history);
    } catch (error) {
      handleApiError(error, 'Não foi possível carregar o histórico do paciente');
    } finally {
      setPatientHistoryLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Formulário de criação - para paciente (sempre visível) ou admin (em dialog) */}
      {isPatient && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Agendar nova consulta</CardTitle>
              <CardDescription>Escolha o médico e o horário desejado.</CardDescription>
            </div>
          </CardHeader>
          {loading ? (
            <div className="grid gap-4 p-6 md:grid-cols-2">
              <Skeleton className="h-10 w-full md:col-span-2" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full md:col-span-2" />
              <Skeleton className="h-10 w-32" />
            </div>
          ) : (
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
          )}
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Consultas</CardTitle>
              <CardDescription>
                {isAdmin ? 'Gerencie todas as consultas do sistema' : 'Acompanhe todas as suas consultas agendadas.'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {isAdmin && (
                <>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Consulta
                  </Button>
                  <Modal
                    isOpen={showCreateDialog}
                    onClose={() => setShowCreateDialog(false)}
                    title="Agendar Nova Consulta"
                    size="lg"
                  >
                    <div className="space-y-4">
                      <p className="text-sm text-slate-600">
                        Preencha os dados para criar uma nova consulta no sistema.
                      </p>
                      <form onSubmit={handleSubmit(onCreateAppointment)} className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="admin_patient_id">Paciente *</Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowCreatePatientDialog(true)}
                              className="text-xs"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Novo Paciente
                            </Button>
                          </div>
                          <Input
                            id="patient_search"
                            placeholder="Buscar paciente por nome, CPF ou email..."
                            value={patientSearch}
                            onChange={(e) => setPatientSearch(e.target.value)}
                            className="mb-2"
                          />
                          <select
                            id="admin_patient_id"
                            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            {...register('patient_id', { valueAsNumber: true })}
                          >
                            <option value="">Selecione um paciente</option>
                            {patientOptions.map((patient) => (
                              <option key={patient.value} value={patient.value}>
                                {patient.label}
                              </option>
                            ))}
                          </select>
                          {patientOptions.length === 0 && patientSearch && (
                            <p className="text-xs text-slate-500">Nenhum paciente encontrado. Clique em "Novo Paciente" para cadastrar.</p>
                          )}
                          {errors.patient_id && <p className="text-xs text-red-500">{errors.patient_id.message as string}</p>}
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="admin_doctor_id">Médico *</Label>
                          <Input
                            id="doctor_search"
                            placeholder="Buscar médico por nome ou especialidade..."
                            value={doctorSearch}
                            onChange={(e) => setDoctorSearch(e.target.value)}
                            className="mb-2"
                          />
                          <select
                            id="admin_doctor_id"
                            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            {...register('doctor_id', {
                              onChange: (e) => {
                                const doctorId = e.target.value;
                                if (doctorId) {
                                  loadAvailableDates(Number(doctorId));
                                } else {
                                  setAvailableDates([]);
                                  setDoctorHasNoSchedules(false);
                                }
                              },
                            })}
                          >
                            <option value="">Selecione um médico</option>
                            {doctorOptions.map((doctor) => (
                              <option key={doctor.value} value={doctor.value}>
                                {doctor.label}
                              </option>
                            ))}
                          </select>
                          {doctorOptions.length === 0 && doctorSearch && (
                            <p className="text-xs text-slate-500">Nenhum médico encontrado.</p>
                          )}
                          {errors.doctor_id && <p className="text-xs text-red-500">{errors.doctor_id.message as string}</p>}
                        </div>
                        {/* Calendário de Dias Disponíveis */}
                        {watchedDoctorId && (
                          <div className="space-y-2 md:col-span-2">
                            <Label>Selecione a Data *</Label>
                            <AppointmentCalendar
                              availableDates={availableDates}
                              loadingDates={loadingDates}
                              currentMonth={currentMonth}
                              onMonthChange={(month) => {
                                setCurrentMonth(month);
                                if (watchedDoctorId) {
                                  fetchAvailableDates(Number(watchedDoctorId), month).then(response => {
                                    setAvailableDates(response.available_dates || []);
                                    setDoctorHasNoSchedules(response.has_schedules === false);
                                  }).catch(() => {
                                    setAvailableDates([]);
                                    setDoctorHasNoSchedules(false);
                                  });
                                }
                              }}
                              onDateSelect={(date) => {
                                setValue('scheduled_at', date);
                              }}
                              selectedDate={watchedDate?.split('T')[0] || watchedDate || ''}
                              doctorHasNoSchedules={doctorHasNoSchedules}
                            />
                            <input
                              type="hidden"
                              {...register('scheduled_at')}
                            />
                            {errors.scheduled_at && <p className="text-xs text-red-500">{errors.scheduled_at.message}</p>}
                          </div>
                        )}
                        {!watchedDoctorId && (
                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="admin_scheduled_date">Data *</Label>
                            <Input 
                              id="admin_scheduled_date" 
                              type="date" 
                              min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                              onChange={(e) => {
                                const dateOnly = e.target.value;
                                if (dateOnly) {
                                  setValue('scheduled_at', dateOnly);
                                }
                              }}
                              value={watchedDate?.split('T')[0] || watchedDate || ''}
                            />
                            <input
                              type="hidden"
                              {...register('scheduled_at')}
                            />
                            {errors.scheduled_at && <p className="text-xs text-red-500">{errors.scheduled_at.message}</p>}
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label htmlFor="admin_duration_minutes">Duração (min) *</Label>
                          <Input 
                            id="admin_duration_minutes" 
                            type="number" 
                            min={15}
                            max={240}
                            {...register('duration_minutes', { valueAsNumber: true })} 
                          />
                          {errors.duration_minutes && <p className="text-xs text-red-500">{errors.duration_minutes.message}</p>}
                        </div>
                        
                        {/* Horários Disponíveis */}
                        {watchedDoctorId && watchedDate && (
                          <div className="space-y-2 md:col-span-2">
                            <Label>Horários Disponíveis</Label>
                            {loadingSlots ? (
                              <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                                <span className="ml-2 text-sm text-slate-600">Carregando horários...</span>
                              </div>
                            ) : availableSlots.length > 0 ? (
                              <div className="grid grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-200 rounded-md">
                                {availableSlots.map((slot) => {
                                  const slotDate = new Date(slot);
                                  const timeStr = slotDate.toLocaleTimeString('pt-BR', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  });
                                  const datetimeValue = slotDate.toISOString().slice(0, 16);
                                  const currentScheduled = watch('scheduled_at');
                                  const isSelected = currentScheduled && (
                                    currentScheduled === datetimeValue || 
                                    currentScheduled.startsWith(slotDate.toISOString().slice(0, 10) + 'T' + slotDate.toTimeString().slice(0, 5))
                                  );
                                  
                                  return (
                                    <button
                                      key={slot}
                                      type="button"
                                      onClick={() => {
                                        setValue('scheduled_at', datetimeValue);
                                      }}
                                      className={`
                                        px-3 py-2 text-sm rounded-md border transition-colors
                                        ${isSelected 
                                          ? 'bg-blue-500 text-white border-blue-500' 
                                          : 'bg-white text-slate-700 border-slate-300 hover:border-blue-500 hover:bg-blue-50'
                                        }
                                      `}
                                    >
                                      <Clock className="h-3 w-3 inline mr-1" />
                                      {timeStr}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : watchedDate ? (
                              <div className="p-4 text-center text-sm text-slate-500 border border-slate-200 rounded-md bg-slate-50">
                                <p>Nenhum horário disponível para esta data.</p>
                                <p className="text-xs mt-1">Selecione outra data ou verifique a agenda do médico.</p>
                              </div>
                            ) : null}
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label htmlFor="admin_type">Tipo *</Label>
                          <select
                            id="admin_type"
                            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            {...register('type')}
                          >
                            <option value="PRESENTIAL">Presencial</option>
                            <option value="ONLINE">Online</option>
                          </select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="admin_notes">Observações</Label>
                          <Textarea 
                            id="admin_notes" 
                            placeholder="Informações adicionais (opcional)" 
                            rows={3}
                            {...register('notes')} 
                          />
                        </div>
                        <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2">
                          <Button type="button" variant="ghost" onClick={() => {
                            setShowCreateDialog(false);
                            setPatientSearch('');
                            setDoctorSearch('');
                          }}>
                            Cancelar
                          </Button>
                          <Button type="submit">Agendar Consulta</Button>
                        </div>
                      </form>
                    </div>
                  </Modal>

                  {/* Modal para criar paciente rapidamente */}
                  <CreatePatientModal
                    isOpen={showCreatePatientDialog}
                    onClose={() => setShowCreatePatientDialog(false)}
                    onSuccess={async (newPatient) => {
                      // Recarrega a lista de pacientes
                      const patientResponse = await fetchAdminPatients({ per_page: 100 });
                      setPatients(patientResponse.data ?? []);
                      
                      // Seleciona o paciente recém-criado no formulário
                      setValue('patient_id', newPatient.id);
                      setPatientSearch(newPatient.name);
                      
                      setShowCreatePatientDialog(false);
                      toast.success('Paciente cadastrado com sucesso! Agora você pode agendar a consulta.');
                    }}
                  />
                </>
              )}
              <div className="flex flex-wrap items-center gap-3">
                <Label className="text-xs uppercase text-slate-500" htmlFor="status_filter">
                  Status
                </Label>
                <select
                  id="status_filter"
                  className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={statusFilter ?? ""}
                  onChange={(event) => setStatusFilter(event.target.value || undefined)}
                >
                  {APPOINTMENT_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
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
                  (isDoctor || isAdmin) && appointment.status === 'PENDING';
                // Não pode cancelar ou remarcar consultas concluídas ou já canceladas
                const canCancel = appointment.status !== 'CANCELLED' && appointment.status !== 'COMPLETED';
                const canReschedule = appointment.status !== 'CANCELLED' && appointment.status !== 'COMPLETED';
                const canObserve = (isDoctor || isAdmin) && appointment.status === 'COMPLETED';

                return (
                  <tr key={appointment.id}>
                    <td className="px-4 py-2 text-slate-700">{date}</td>
                    <td className="px-4 py-2 text-slate-700">{appointment.doctor?.name ?? '---'}</td>
                    <td className="px-4 py-2 text-slate-700">{appointment.patient?.name ?? '---'}</td>
                    <td className="px-4 py-2">
                      <StatusBadge status={appointment.status} />
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

      {detailLoadingId && !detail && (
        <Card>
          <CardHeader>
            <CardTitle>Detalhes da consulta</CardTitle>
            <CardDescription>Carregando informações...</CardDescription>
          </CardHeader>
          <div className="space-y-2 p-6">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </Card>
      )}

      {detail && (
        <Tabs defaultValue="overview">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Detalhes da consulta</CardTitle>
                <CardDescription>
                  {detail.patient?.name ?? 'Paciente'} • {detail.doctor?.name ?? 'Médico'}
                </CardDescription>
              </div>
            </CardHeader>
            <div className="px-6 pb-6">
              <TabsList className="mb-4">
                <TabsTrigger value="overview">Resumo</TabsTrigger>
                <TabsTrigger value="observations">Observações</TabsTrigger>
                <TabsTrigger value="history">Histórico de status</TabsTrigger>
                {detail.patient && isDoctor && <TabsTrigger value="patient-history">Histórico do paciente</TabsTrigger>}
              </TabsList>
              <TabsContent value="overview" className="mt-0">
                <div className="grid gap-2 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500">Status</p>
                    <StatusBadge status={detail.status} />
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
                    <p className="text-sm text-slate-800">{detail.type === 'ONLINE' ? 'Online' : 'Presencial'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500">Duração</p>
                    <p className="text-sm text-slate-800">{detail.duration_minutes} minutos</p>
                  </div>
                </div>
                {detail.notes && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase text-slate-500">Notas</p>
                    <p className="text-sm text-slate-700">{detail.notes}</p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="observations" className="mt-0">
                {detail.observations && detail.observations.length > 0 ? (
                  <ul className="space-y-3">
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
                  <p className="text-sm text-slate-500">Nenhuma observação registrada.</p>
                )}
              </TabsContent>
              <TabsContent value="history" className="mt-0">
                {detail.logs && detail.logs.length > 0 ? (
                  <ul className="space-y-2">
                    {detail.logs.map((log) => (
                      <li key={log.id} className="rounded-md border border-slate-200 p-3 text-sm">
                        <p className="font-medium text-slate-800">
                          {log.old_status ? getStatusLabel(log.old_status) : '—'} → {getStatusLabel(log.new_status)}
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
                  <p className="text-sm text-slate-500">Sem histórico registrado.</p>
                )}
              </TabsContent>
              {detail.patient && isDoctor && (
                <TabsContent value="patient-history" className="mt-0 space-y-3">
                  <div className="flex justify-end">
                    <Button variant="secondary" onClick={() => loadPatientHistory(detail.patient!.id)} disabled={patientHistoryLoading}>
                      {patientHistoryLoading ? 'Carregando...' : 'Atualizar histórico'}
                    </Button>
                  </div>
                  {patientHistory === null ? (
                    <p className="text-sm text-slate-500">
                      Clique em “Atualizar histórico” para carregar todas as observações do paciente.
                    </p>
                  ) : patientHistory.length === 0 ? (
                    <EmptyState className="border-none bg-transparent p-0">
                      Nenhuma observação registrada para este paciente.
                    </EmptyState>
                  ) : (
                    <ul className="space-y-3 text-sm">
                      {patientHistory.map((obs) => (
                        <li key={obs.id} className="rounded-md border border-slate-200 p-3">
                          <p className="font-medium text-slate-800">
                            {new Date(obs.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                          </p>
                          <p className="text-xs text-slate-500">Responsável: {obs.doctor?.name ?? '---'}</p>
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
                        </li>
                      ))}
                    </ul>
                  )}
                </TabsContent>
              )}
            </div>
            <div className="flex items-center justify-end px-6 pb-6">
              <Button variant="ghost" onClick={() => setDetail(null)}>
                Fechar
              </Button>
            </div>
          </Card>
        </Tabs>
      )}
    </div>
  );
}

// Componente para criar paciente rapidamente
function CreatePatientModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSuccess: (patient: Patient) => void;
}) {
  const [loading, setLoading] = useState(false);
  const createPatientSchema = z.object({
    name: z.string().min(3, 'Nome completo é obrigatório'),
    email: z.string().email('E-mail inválido'),
    phone: z.string().min(10, 'Telefone é obrigatório'),
    cpf: z.string().min(11, 'CPF é obrigatório'),
    birth_date: z.string().min(1, 'Data de nascimento é obrigatória'),
    gender: z.enum(['M', 'F', 'OTHER'], { required_error: 'Selecione o sexo' }),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<z.infer<typeof createPatientSchema>>({
    resolver: zodResolver(createPatientSchema),
  });

  const onSubmit = async (values: z.infer<typeof createPatientSchema>) => {
    setLoading(true);
    try {
      // Gera senha aleatória temporária
      const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      
      const newPatient = await createPatient({
        name: values.name,
        email: values.email,
        phone: values.phone,
        cpf: values.cpf.replace(/\D/g, ''),
        birth_date: values.birth_date,
        gender: values.gender,
        password: tempPassword,
      });

      toast.success('Paciente criado com sucesso!');
      reset();
      onSuccess(newPatient);
    } catch (error) {
      handleApiError(error, 'Não foi possível criar o paciente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cadastrar Novo Paciente"
      size="lg"
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Preencha os dados básicos do paciente. Uma senha temporária será gerada automaticamente.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="create_patient_name">Nome Completo *</Label>
            <Input 
              id="create_patient_name" 
              placeholder="João da Silva" 
              {...register('name')} 
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="create_patient_email">E-mail *</Label>
            <Input 
              id="create_patient_email" 
              type="email" 
              placeholder="paciente@email.com" 
              {...register('email')} 
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="create_patient_phone">Telefone *</Label>
            <Input 
              id="create_patient_phone" 
              placeholder="(11) 98765-4321" 
              {...register('phone')} 
            />
            {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="create_patient_cpf">CPF *</Label>
            <Input 
              id="create_patient_cpf" 
              placeholder="000.000.000-00" 
              {...register('cpf')} 
            />
            {errors.cpf && <p className="text-xs text-red-500">{errors.cpf.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="create_patient_birth_date">Data de Nascimento *</Label>
            <Input 
              id="create_patient_birth_date" 
              type="date" 
              {...register('birth_date')} 
            />
            {errors.birth_date && <p className="text-xs text-red-500">{errors.birth_date.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="create_patient_gender">Sexo *</Label>
            <select
              id="create_patient_gender"
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register('gender')}
            >
              <option value="">Selecione</option>
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
              <option value="OTHER">Outro</option>
            </select>
            {errors.gender && <p className="text-xs text-red-500">{errors.gender.message}</p>}
          </div>

          <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Cadastrar Paciente'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

// Componente de Calendário para Seleção de Dias Disponíveis
function AppointmentCalendar({
  availableDates,
  loadingDates,
  currentMonth,
  onMonthChange,
  onDateSelect,
  selectedDate,
  doctorHasNoSchedules = false,
}: {
  availableDates: string[];
  loadingDates: boolean;
  currentMonth: string;
  onMonthChange: (month: string) => void;
  onDateSelect: (date: string) => void;
  selectedDate: string;
  doctorHasNoSchedules?: boolean;
}) {
  const monthDate = new Date(currentMonth + '-01');
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay(); // 0 = Domingo, 1 = Segunda, etc.
  
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  
  const handlePrevMonth = () => {
    const prevMonth = new Date(year, month - 1, 1);
    const monthStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
    onMonthChange(monthStr);
  };
  
  const handleNextMonth = () => {
    let nextYear = year;
    let nextMonthValue = month + 1;
    
    if (nextMonthValue > 11) {
      nextMonthValue = 0;
      nextYear += 1;
    }
    
    const monthStr = `${nextYear}-${String(nextMonthValue + 1).padStart(2, '0')}`;
    onMonthChange(monthStr);
  };
  
  const isDateAvailable = (date: Date): boolean => {
    const dateStr = date.toISOString().slice(0, 10);
    return availableDates.includes(dateStr);
  };
  
  const isDateSelected = (date: Date): boolean => {
    const dateStr = date.toISOString().slice(0, 10);
    return selectedDate === dateStr;
  };
  
  const isDatePast = (date: Date): boolean => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return date < tomorrow;
  };
  
  const handleDateClick = (date: Date) => {
    if (isDatePast(date) || !isDateAvailable(date)) return;
    const dateStr = date.toISOString().slice(0, 10);
    onDateSelect(dateStr);
  };
  
  const renderDays = () => {
    const days = [];
    
    // Dias vazios antes do primeiro dia do mês
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-10"></div>
      );
    }
    
    // Dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().slice(0, 10);
      const available = isDateAvailable(date);
      const selected = isDateSelected(date);
      const past = isDatePast(date);
      
      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateClick(date)}
          disabled={past || !available}
          className={`
            h-10 w-10 rounded-md text-sm font-medium transition-colors
            ${selected
              ? 'bg-blue-500 text-white'
              : available && !past
              ? 'bg-white text-slate-700 hover:bg-blue-50 hover:border-blue-500 border border-slate-200'
              : past
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-slate-50 text-slate-400 cursor-not-allowed'
            }
          `}
          title={past ? 'Data no passado' : !available ? 'Sem agenda disponível' : 'Clique para selecionar'}
        >
          {day}
        </button>
      );
    }
    
    return days;
  };
  
  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1 hover:bg-slate-100 rounded-md transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-slate-600" />
        </button>
        <h3 className="text-lg font-semibold text-slate-900">
          {monthNames[month]} {year}
        </h3>
        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1 hover:bg-slate-100 rounded-md transition-colors"
        >
          <ChevronRight className="h-5 w-5 text-slate-600" />
        </button>
      </div>
      
      {loadingDates ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          <span className="ml-2 text-sm text-slate-600">Carregando dias disponíveis...</span>
        </div>
      ) : doctorHasNoSchedules ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-slate-600 mb-2">
            Este médico não possui agenda configurada.
          </p>
          <p className="text-xs text-slate-500">
            Configure os horários de atendimento na área do médico primeiro.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-2 mb-2">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-slate-500">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {renderDays()}
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-md bg-blue-500"></div>
              <span>Selecionado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-md bg-white border border-slate-200"></div>
              <span>Disponível</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-md bg-slate-50"></div>
              <span>Indisponível</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}


