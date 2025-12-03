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
import { Plus, Clock, Loader2, ChevronLeft, ChevronRight, X, Calendar, CalendarClock, Eye, CheckCircle2, FileText } from "lucide-react";

// Schema base para criação de consultas
const baseAppointmentSchema = z.object({
  doctor_id: z.coerce.number().min(1, "Selecione um médico"),
  patient_id: z.coerce.number().optional(),
  scheduled_at: z.string().min(1, "Informe data e horário"),
  // duration_minutes: REMOVIDO - pacientes não escolhem duração, é definida pelo médico/admin
  duration_minutes: z.coerce.number().min(15, "No mínimo 15 minutos").max(240, "Até 240 minutos").optional(), // Apenas para admin
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
  duration_minutes: z.coerce.number().min(15).max(240).optional(), // Opcional - será definido pelo schedule do médico
});

type RescheduleForm = z.input<typeof rescheduleSchema>;

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [successId, setSuccessId] = useState<number | null>(null);
  const [errorId, setErrorId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);
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
  
  // Estados para remarcação
  const [availableSlotsReschedule, setAvailableSlotsReschedule] = useState<string[]>([]);
  const [loadingSlotsReschedule, setLoadingSlotsReschedule] = useState(false);
  const [availableDatesReschedule, setAvailableDatesReschedule] = useState<string[]>([]);
  const [loadingDatesReschedule, setLoadingDatesReschedule] = useState(false);
  const [currentMonthReschedule, setCurrentMonthReschedule] = useState<string>(new Date().toISOString().slice(0, 7));
  const [doctorHasNoSchedulesReschedule, setDoctorHasNoSchedulesReschedule] = useState(false);
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
        // Pode vir como "2025-01-15" (do calendário) ou "2025-01-15T14:00" (do botão de horário)
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
        // A duração será determinada pelo schedule do médico, não pelo paciente
        // Passamos undefined para o backend usar a duração do schedule
        const response = await fetchAvailableSlots(
          Number(watchedDoctorId),
          dateOnly
        );
        setAvailableSlots(response.available_slots || []);
      } catch (error) {
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    loadAvailableSlots();
  }, [watchedDoctorId, watchedDate]);

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
      setAvailableDates([]);
      setDoctorHasNoSchedules(false);
      handleApiError(error, 'Erro ao carregar datas disponíveis');
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
    watch: watchReschedule,
  } = useForm<RescheduleForm>({
    resolver: zodResolver(rescheduleSchema),
  });
  
  const watchedRescheduleDate = watchReschedule('scheduled_at');

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

  // Carrega datas disponíveis quando médico é selecionado
  useEffect(() => {
    if (watchedDoctorId && isPatient) {
      loadAvailableDates(Number(watchedDoctorId));
    }
  }, [watchedDoctorId, currentMonth, isPatient]);

  // Carrega datas e horários disponíveis quando uma consulta é selecionada para remarcação
  useEffect(() => {
    if (!selectedReschedule) {
      setAvailableDatesReschedule([]);
      setAvailableSlotsReschedule([]);
      return;
    }

    const doctorId = selectedReschedule.doctor_id;
    if (!doctorId) return;

    // Carregar datas disponíveis do mês atual
    const loadRescheduleDates = async () => {
      try {
        setLoadingDatesReschedule(true);
        const response = await fetchAvailableDates(doctorId, currentMonthReschedule);
        setAvailableDatesReschedule(response.available_dates || []);
        setDoctorHasNoSchedulesReschedule(response.has_schedules === false);
      } catch (error) {
        setAvailableDatesReschedule([]);
        setDoctorHasNoSchedulesReschedule(false);
      } finally {
        setLoadingDatesReschedule(false);
      }
    };

    loadRescheduleDates();
  }, [selectedReschedule, currentMonthReschedule]);

  // Carrega horários disponíveis quando uma data é selecionada no remarcar
  useEffect(() => {
    if (!selectedReschedule) {
      setAvailableSlotsReschedule([]);
      return;
    }

    const doctorId = selectedReschedule.doctor_id;
    if (!doctorId) return;

    // Pega apenas a data (sem hora) do valor atual
    // watchedRescheduleDate pode ser "2025-12-05" (só data) ou "2025-12-05T14:30" (data+hora)
    const dateOnly = watchedRescheduleDate?.split('T')[0];
    if (!dateOnly || dateOnly.length !== 10) {
      setAvailableSlotsReschedule([]);
      return;
    }

    const loadRescheduleSlots = async () => {
      try {
        setLoadingSlotsReschedule(true);
        const response = await fetchAvailableSlots(doctorId, dateOnly);
        
        // Log para debug
        if (process.env.NODE_ENV === 'development') {
          console.log('[Remarcar] Horários disponíveis carregados:', response.available_slots?.length || 0, 'horários');
          console.log('[Remarcar] Data consultada:', dateOnly);
          console.log('[Remarcar] Médico ID:', doctorId);
          if (response.available_slots && response.available_slots.length > 0) {
            console.log('[Remarcar] Primeiros horários:', response.available_slots.slice(0, 3));
          }
        }
        
        setAvailableSlotsReschedule(response.available_slots || []);
      } catch (error) {
        console.error('[Remarcar] Erro ao carregar horários:', error);
        setAvailableSlotsReschedule([]);
      } finally {
        setLoadingSlotsReschedule(false);
      }
    };

    loadRescheduleSlots();
  }, [selectedReschedule, watchedRescheduleDate]);

  const reloadAppointments = async () => {
    const response = await fetchAppointments({ per_page: 20, status: statusFilter });
    setAppointments(response.data ?? []);
  };

  const onCreateAppointment = async (values: PatientForm) => {
    try {
      // Parse os valores usando o schema para obter os valores transformados
      const parsed = appointmentSchema.parse(values);
      
      // Para pacientes: REMOVE duration_minutes - a duração é definida pelo médico/admin via schedule
      if (isPatient && 'duration_minutes' in parsed) {
        delete parsed.duration_minutes;
      }
      
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
          toast.error('Data/hora inválida');
          return;
        }
        
        // Log para debug em desenvolvimento
        if (process.env.NODE_ENV === 'development') {
          console.log('[Agendar] Processando agendamento:', {
            scheduled_at_original: parsed.scheduled_at,
            dateTime_parsed: dateTime.toISOString(),
            availableSlots_count: availableSlots.length,
          });
        }
        
        // REMOVIDA validação de disponibilidade no frontend
        // O backend já valida isso no AppointmentValidationService
        // Deixamos o backend fazer a validação correta
        
        // Backend espera formato 'Y-m-d H:i:s' (ex: '2025-12-19 19:30:00')
        // EXTRAI DIRETAMENTE DA STRING ORIGINAL para evitar problemas de timezone
        // NUNCA usa Date.getHours() ou Date.getMinutes() pois eles podem mudar devido ao timezone
        if (typeof parsed.scheduled_at === 'string') {
          if (parsed.scheduled_at.includes('T')) {
            // Formato ISO: 'YYYY-MM-DDTHH:mm' - extrai componentes diretamente da string
            const match = parsed.scheduled_at.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
            if (match) {
              // Usa os valores EXATOS da string, sem conversão de timezone
              parsed.scheduled_at = `${match[1]}-${match[2]}-${match[3]} ${match[4]}:${match[5]}:00`;
            } else {
              // Fallback: tenta parsear
              const year = dateTime.getFullYear();
              const month = String(dateTime.getMonth() + 1).padStart(2, '0');
              const day = String(dateTime.getDate()).padStart(2, '0');
              const hours = String(dateTime.getHours()).padStart(2, '0');
              const minutes = String(dateTime.getMinutes()).padStart(2, '0');
              parsed.scheduled_at = `${year}-${month}-${day} ${hours}:${minutes}:00`;
            }
          } else if (parsed.scheduled_at.includes(' ')) {
            // Já está no formato 'Y-m-d H:i:s' ou 'Y-m-d H:i'
            if (parsed.scheduled_at.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)) {
              parsed.scheduled_at = `${parsed.scheduled_at}:00`;
            }
            // Se já tem segundos, mantém como está
          } else {
            // Fallback: usa Date (último recurso)
            const year = dateTime.getFullYear();
            const month = String(dateTime.getMonth() + 1).padStart(2, '0');
            const day = String(dateTime.getDate()).padStart(2, '0');
            const hours = String(dateTime.getHours()).padStart(2, '0');
            const minutes = String(dateTime.getMinutes()).padStart(2, '0');
            parsed.scheduled_at = `${year}-${month}-${day} ${hours}:${minutes}:00`;
          }
        } else {
          // Fallback: usa Date (último recurso)
          const year = dateTime.getFullYear();
          const month = String(dateTime.getMonth() + 1).padStart(2, '0');
          const day = String(dateTime.getDate()).padStart(2, '0');
          const hours = String(dateTime.getHours()).padStart(2, '0');
          const minutes = String(dateTime.getMinutes()).padStart(2, '0');
          parsed.scheduled_at = `${year}-${month}-${day} ${hours}:${minutes}:00`;
        }
        
        // Log para debug
        if (process.env.NODE_ENV === 'development') {
          const sentMatch = parsed.scheduled_at.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}):(\d{2})/);
          const matchingSlot = availableSlots.find(s => {
            const slotMatch = String(s).match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/);
            return slotMatch && sentMatch && 
                   slotMatch[1] === sentMatch[1] && 
                   slotMatch[2] === sentMatch[2];
          });
          
          console.log('[Agendar] Formato final enviado ao backend:', {
            scheduled_at: parsed.scheduled_at,
            duration_minutes: parsed.duration_minutes,
            dateTimeISO: dateTime.toISOString(),
            dateTimeLocal: dateTime.toLocaleString('pt-BR'),
            availableSlots: availableSlots.slice(0, 5), // Primeiros 5 slots
            matchingSlot: matchingSlot || 'NÃO ENCONTRADO',
            isInAvailableSlots: !!matchingSlot,
          });
        }
      }
      
      // Para pacientes: duração é SEMPRE definida pelo médico/admin via schedule
      // NUNCA enviamos duration_minutes para pacientes - o backend busca do schedule
      if (isPatient) {
        delete parsed.duration_minutes;
      }
      
      // Log para debug em desenvolvimento
      
      // Mostrar toast de loading
      const toastId = toast.loading('Criando consulta...', { id: 'creating-appointment' });
      
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
      
      // Sucesso com animação
      toast.success('✅ Consulta agendada com sucesso!', { 
        id: 'creating-appointment',
        duration: 3000,
        icon: '🎉'
      });
      
      setCreateSuccess(true);
      reset({ type: 'PRESENTIAL' } as Partial<PatientForm>);
      setShowCreateDialog(false);
      setPatientSearch('');
      setDoctorSearch('');
      
      // Resetar estado de sucesso após 2 segundos
      setTimeout(() => {
        setCreateSuccess(false);
      }, 2000);
      
      await reloadAppointments();
    } catch (error) {
      // Log detalhado do erro para debug
      if (process.env.NODE_ENV === 'development') {
        console.error('[onCreateAppointment] Erro capturado:', error);
        console.error('[onCreateAppointment] Tipo do erro:', typeof error);
        console.error('[onCreateAppointment] String do erro:', String(error));
        
        if (error && typeof error === 'object') {
          const errorObj = error as Record<string, unknown>;
          console.error('[onCreateAppointment] Propriedades do erro:', Object.getOwnPropertyNames(errorObj));
          console.error('[onCreateAppointment] Tem response?', !!errorObj.response);
          console.error('[onCreateAppointment] Tem message?', !!errorObj.message);
          
          if (errorObj.response) {
            const response = errorObj.response as Record<string, unknown>;
            console.error('[onCreateAppointment] Response status:', response.status);
            console.error('[onCreateAppointment] Response data:', response.data);
          }
        }
      }
      
      toast.error('❌ Não foi possível criar a consulta', { 
        id: 'creating-appointment',
        duration: 4000
      });
      
      handleApiError(error, 'Não foi possível criar a consulta');
    } finally {
      setCreating(false);
    }
  };

  const handleConfirm = async (id: number) => {
    setBusyId(id);
    setSuccessId(null);
    setErrorId(null);
    try {
      const toastId = toast.loading('Confirmando consulta...', { id: `confirm-${id}` });
      await confirmAppointment(id);
      toast.success('✅ Consulta confirmada com sucesso!', { 
        id: `confirm-${id}`,
        duration: 3000,
        icon: '✓'
      });
      setSuccessId(id);
      await reloadAppointments();
      // Resetar estado de sucesso após 2 segundos
      setTimeout(() => {
        setSuccessId(null);
      }, 2000);
    } catch (error) {
      toast.error('❌ Falha ao confirmar consulta', { 
        id: `confirm-${id}`,
        duration: 4000
      });
      setErrorId(id);
      handleApiError(error, 'Falha ao confirmar');
      setTimeout(() => {
        setErrorId(null);
      }, 3000);
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async (id: number) => {
    setBusyId(id);
    setSuccessId(null);
    setErrorId(null);
    try {
      const toastId = toast.loading('Cancelando consulta...', { id: `cancel-${id}` });
      await cancelAppointment(id);
      toast.success('✅ Consulta cancelada com sucesso', { 
        id: `cancel-${id}`,
        duration: 3000,
        icon: '✓'
      });
      setSuccessId(id);
      await reloadAppointments();
      // Resetar estado de sucesso após 2 segundos
      setTimeout(() => {
        setSuccessId(null);
      }, 2000);
    } catch (error) {
      toast.error('❌ Erro ao cancelar consulta', { 
        id: `cancel-${id}`,
        duration: 4000
      });
      setErrorId(id);
      handleApiError(error, 'Erro ao cancelar');
      setTimeout(() => {
        setErrorId(null);
      }, 3000);
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
    setSuccessId(null);
    setErrorId(null);
    try {
      const toastId = toast.loading('Remarcando consulta...', { id: `reschedule-${selectedReschedule.id}` });
      // Parse os valores usando o schema para obter os valores transformados
      const parsed = rescheduleSchema.parse(values);
      
      // Converte para formato que o backend espera (mesmo formato da criação)
      if (!parsed.scheduled_at) {
        throw new Error('Data e horário são obrigatórios');
      }
      
      // Log para debug
      if (process.env.NODE_ENV === 'development') {
        console.log('[onReschedule] Valor recebido do formulário:', parsed.scheduled_at);
        console.log('[onReschedule] Tipo:', typeof parsed.scheduled_at);
      }
      
      // Garante que o valor tenha formato completo (data + hora)
      let dateTimeStr = parsed.scheduled_at;
      
      // Se só tem data (YYYY-MM-DD), não permite - deve ter horário
      if (dateTimeStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        throw new Error('Por favor, selecione um horário disponível. Clique em um dos horários mostrados abaixo.');
      }
      
      // Se tem data e hora mas sem segundos, adiciona segundos
      if (dateTimeStr.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
        dateTimeStr = `${dateTimeStr}:00`;
      }
      
      // Log para debug
      if (process.env.NODE_ENV === 'development') {
        console.log('[onReschedule] DateTimeStr após processamento:', dateTimeStr);
      }
      
      const dateTime = new Date(dateTimeStr);
      
      // Valida se a data é válida
      if (isNaN(dateTime.getTime())) {
        console.error('[onReschedule] Data inválida:', dateTimeStr);
        throw new Error(`Data/hora inválida: ${parsed.scheduled_at}. Por favor, selecione novamente a data e horário.`);
      }
      
      // Log para debug
      if (process.env.NODE_ENV === 'development') {
        console.log('[onReschedule] DateTime criado:', dateTime);
        console.log('[onReschedule] DateTime ISO:', dateTime.toISOString());
      }
      
      // Valida se o horário está na lista de horários disponíveis (validação opcional - backend também valida)
      // Removemos a validação muito restritiva aqui e deixamos o backend validar
      // Isso evita problemas de timezone e diferenças de formato
      
      // Converte para formato ISO sem timezone (formato que Laravel aceita melhor)
      const year = dateTime.getFullYear();
      const month = String(dateTime.getMonth() + 1).padStart(2, '0');
      const day = String(dateTime.getDate()).padStart(2, '0');
      const hours = String(dateTime.getHours()).padStart(2, '0');
      const minutes = String(dateTime.getMinutes()).padStart(2, '0');
      const seconds = String(dateTime.getSeconds()).padStart(2, '0');
      
      parsed.scheduled_at = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      
      // Remove duration_minutes se for paciente - a duração é definida pelo médico
      if (isPatient && 'duration_minutes' in parsed) {
        delete parsed.duration_minutes;
      }
      
      await rescheduleAppointment(selectedReschedule.id, parsed);
      toast.success('✅ Solicitação de remarcação enviada com sucesso!', { 
        id: `reschedule-${selectedReschedule.id}`,
        duration: 3000,
        icon: '✓'
      });
      setSuccessId(selectedReschedule.id);
      resetReschedule();
      setSelectedReschedule(null);
      await reloadAppointments();
      setTimeout(() => {
        setSuccessId(null);
      }, 2000);
    } catch (error) {
      // Verifica se é um erro do frontend (lançado por nós) ou da API
      const isFrontendError = error instanceof Error && 
        !(error && typeof error === 'object' && 'response' in error);
      
      let errorMessage = 'Erro ao remarcar consulta';
      
      if (isFrontendError && error instanceof Error) {
        // Erro do frontend - mostra mensagem diretamente
        errorMessage = error.message;
        toast.error(`❌ ${errorMessage}`, { 
          id: `reschedule-${selectedReschedule.id}`,
          duration: 5000
        });
        setErrorId(selectedReschedule.id);
        setTimeout(() => {
          setErrorId(null);
        }, 3000);
      } else {
        // Erro da API - usa handleApiError
        // Log detalhado do erro para debug
        if (process.env.NODE_ENV === 'development') {
          console.error('[onReschedule] Erro da API:', error);
          
          if (error && typeof error === 'object') {
            const errorObj = error as Record<string, unknown>;
            
            if (errorObj.response) {
              const response = errorObj.response as Record<string, unknown>;
              console.error('[onReschedule] Response status:', response.status);
              console.error('[onReschedule] Response data:', response.data);
              
              // Se for erro de validação, mostra mensagem específica
              if (response.data && typeof response.data === 'object') {
                const data = response.data as Record<string, unknown>;
                if (data.message) {
                  console.error('[onReschedule] Mensagem do servidor:', data.message);
                  errorMessage = String(data.message);
                }
                if (data.errors) {
                  console.error('[onReschedule] Erros de validação:', data.errors);
                  const errors = data.errors as Record<string, string[] | string>;
                  const firstError = Object.values(errors)[0];
                  if (Array.isArray(firstError)) {
                    errorMessage = firstError[0] || errorMessage;
                  } else if (typeof firstError === 'string') {
                    errorMessage = firstError;
                  }
                }
              }
            }
          }
        } else {
          // Em produção, tenta extrair mensagem sem logs excessivos
          if (error && typeof error === 'object') {
            const errorObj = error as Record<string, unknown>;
            if (errorObj.response) {
              const response = errorObj.response as Record<string, unknown>;
              if (response.data && typeof response.data === 'object') {
                const data = response.data as Record<string, unknown>;
                if (typeof data.message === 'string') {
                  errorMessage = data.message;
                } else if (data.errors && typeof data.errors === 'object') {
                  const errors = data.errors as Record<string, string[] | string>;
                  const firstError = Object.values(errors)[0];
                  if (Array.isArray(firstError)) {
                    errorMessage = firstError[0] || errorMessage;
                  } else if (typeof firstError === 'string') {
                    errorMessage = firstError;
                  }
                }
              }
            }
          }
        }
        
        toast.error(`❌ ${errorMessage}`, { 
          id: `reschedule-${selectedReschedule.id}`,
          duration: 5000
        });
        setErrorId(selectedReschedule.id);
        handleApiError(error, errorMessage);
        setTimeout(() => {
          setErrorId(null);
        }, 3000);
      }
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
        patient.user?.email?.toLowerCase().includes(search)
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
                  {...register('doctor_id', {
                    onChange: (e) => {
                      const doctorId = e.target.value;
                      if (doctorId) {
                        loadAvailableDates(Number(doctorId));
                        setValue('scheduled_at', '');
                      } else {
                        setAvailableDates([]);
                        setDoctorHasNoSchedules(false);
                        setAvailableSlots([]);
                      }
                    },
                  })}
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
              {!!watchedDoctorId && (
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
                      // Quando uma data é selecionada, limpa o horário e carrega os horários disponíveis
                      setValue('scheduled_at', date);
                      // O useEffect vai detectar a mudança e carregar os horários automaticamente
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
              {!!watchedDoctorId && !!watchedDate && (
                <div className="space-y-2 md:col-span-2">
                  <Label>Horários Disponíveis *</Label>
                  {loadingSlots ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                      <span className="ml-2 text-sm text-slate-600">Carregando horários...</span>
                    </div>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-200 rounded-md">
                      {availableSlots.map((slot) => {
                        // Backend retorna slots no formato 'Y-m-d H:i:s' (ex: '2025-12-24 13:00:00')
                        // Extrai diretamente da string para evitar problemas de timezone
                        const slotMatch = slot.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/);
                        let datetimeValue: string;
                        let timeStr: string;
                        
                        if (slotMatch) {
                          // Usa os valores EXATOS do slot, sem conversão de timezone
                          datetimeValue = `${slotMatch[1]}T${slotMatch[2]}`;
                          timeStr = slotMatch[2]; // HH:mm
                        } else {
                          // Fallback: se já estiver no formato ISO
                          const isoMatch = slot.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/);
                          if (isoMatch) {
                            datetimeValue = isoMatch[1];
                            timeStr = isoMatch[1].split('T')[1]; // HH:mm
                          } else {
                            // Último recurso: usa Date (pode ter problema de timezone)
                            const slotDate = new Date(slot);
                            datetimeValue = slotDate.toISOString().slice(0, 16);
                            timeStr = slotDate.toLocaleTimeString('pt-BR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            });
                          }
                        }
                        
                        const currentScheduled = watch('scheduled_at');
                        const isSelected = currentScheduled && (
                          currentScheduled === datetimeValue || 
                          currentScheduled.startsWith(datetimeValue)
                        );
                        
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => {
                              // Log para debug
                              if (process.env.NODE_ENV === 'development') {
                                console.log('[Agendar] Selecionando horário (paciente):', {
                                  datetimeValue,
                                  slotOriginal: slot,
                                  slotMatch,
                                });
                              }
                              setValue('scheduled_at', datetimeValue, { shouldValidate: true });
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
              {!watchedDoctorId && (
                <div className="space-y-2 md:col-span-2">
                  <p className="text-sm text-slate-500">Selecione um médico para ver as datas e horários disponíveis.</p>
                </div>
              )}
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
                <Button type="submit" disabled={!watchedDoctorId || !watchedDate || availableSlots.length === 0}>
                  Solicitar consulta
                </Button>
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
                        {!!watchedDoctorId && (
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
                        {!!watchedDoctorId && !!watchedDate && (
                          <div className="space-y-2 md:col-span-2">
                            <Label>Horários Disponíveis</Label>
                            {loadingSlots ? (
                              <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                                <span className="ml-2 text-sm text-slate-600">Carregando horários...</span>
                              </div>
                            ) : availableSlots.length > 0 ? (
                              <div className="grid grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-800/50">
                                {availableSlots.map((slot) => {
                                  // Backend retorna slots no formato 'Y-m-d H:i:s' (ex: '2025-12-24 13:00:00')
                                  // Extrai diretamente da string para evitar problemas de timezone
                                  let datetimeValue: string;
                                  let timeStr: string;
                                  
                                  const slotMatch = slot.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/);
                                  if (slotMatch) {
                                    // Usa os valores EXATOS do slot, sem conversão de timezone
                                    datetimeValue = `${slotMatch[1]}T${slotMatch[2]}`;
                                    timeStr = slotMatch[2]; // HH:mm para exibição
                                  } else {
                                    // Fallback: se já estiver no formato ISO
                                    const isoMatch = slot.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/);
                                    if (isoMatch) {
                                      datetimeValue = isoMatch[1];
                                      timeStr = isoMatch[1].split('T')[1]; // HH:mm
                                    } else {
                                      // Último recurso: usa Date (pode ter problema de timezone)
                                      const slotDate = new Date(slot);
                                      datetimeValue = slotDate.toISOString().slice(0, 16);
                                      timeStr = slotDate.toLocaleTimeString('pt-BR', { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      });
                                    }
                                  }
                                  
                                  const currentScheduled = watch('scheduled_at');
                                  const isSelected = currentScheduled && (
                                    currentScheduled === datetimeValue || 
                                    currentScheduled.startsWith(datetimeValue)
                                  );
                                  
                                  return (
                                    <button
                                      key={slot}
                                      type="button"
                                      onClick={() => {
                                        // Log para debug
                                        if (process.env.NODE_ENV === 'development') {
                                          const match = slot.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/);
                                          console.log('[Agendar] Selecionando horário:', {
                                            datetimeValue,
                                            slotOriginal: slot,
                                            slotMatch: match,
                                            extracted: match ? `${match[1]}T${match[2]}` : 'FALHOU',
                                          });
                                        }
                                        setValue('scheduled_at', datetimeValue, { shouldValidate: true });
                                      }}
                                      className={`
                                        px-3 py-2 text-sm rounded-md border transition-colors
                                        ${isSelected 
                                          ? 'bg-blue-500 text-white border-blue-500 dark:bg-blue-600 dark:border-blue-500' 
                                          : 'bg-white text-slate-700 border-slate-300 hover:border-blue-500 hover:bg-blue-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600 dark:hover:border-blue-400 dark:hover:bg-blue-900/20'
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
                          <Button 
                            type="submit"
                            loading={creating}
                            success={createSuccess}
                            disabled={creating}
                          >
                            Agendar Consulta
                          </Button>
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
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 uppercase text-xs tracking-wider">Data</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 uppercase text-xs tracking-wider">Médico</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 uppercase text-xs tracking-wider">Paciente</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 uppercase text-xs tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-300 uppercase text-xs tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
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
                  <tr 
                    key={appointment.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors duration-150"
                  >
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">{date}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{appointment.doctor?.name ?? '---'}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{appointment.patient?.name ?? '---'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={appointment.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        {canConfirm && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleConfirm(appointment.id)}
                            loading={busyId === appointment.id}
                            success={successId === appointment.id}
                            error={errorId === appointment.id}
                            disabled={busyId === appointment.id}
                            className="gap-1.5"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Confirmar
                          </Button>
                        )}
                        {canCancel && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancel(appointment.id)}
                            loading={busyId === appointment.id}
                            success={successId === appointment.id}
                            error={errorId === appointment.id}
                            disabled={busyId === appointment.id}
                            className="gap-1.5 text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/20"
                          >
                            <X className="h-3.5 w-3.5" />
                            Cancelar
                          </Button>
                        )}
                        {canReschedule && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedReschedule(appointment);
                              setCurrentMonthReschedule(new Date(appointment.scheduled_at).toISOString().slice(0, 7));
                              resetReschedule();
                              // Não pré-selecionar data/hora - deixar usuário escolher das disponíveis
                            }}
                            className="gap-1.5 text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-400 dark:text-blue-400 dark:border-blue-600 dark:hover:bg-blue-900/20"
                          >
                            <CalendarClock className="h-3.5 w-3.5" />
                            Remarcar
                          </Button>
                        )}
                        {canObserve && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedObservation(appointment);
                              resetObservation();
                            }}
                            className="gap-1.5"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Observação
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetail(appointment)}
                          disabled={detailLoadingId === appointment.id}
                          className="gap-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
                        >
                          {detailLoadingId === appointment.id ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Carregando...
                            </>
                          ) : (
                            <>
                              <Eye className="h-3.5 w-3.5" />
                              Detalhes
                            </>
                          )}
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
              <Button 
                type="submit" 
                loading={busyId === selectedObservation.id}
                success={successId === selectedObservation.id}
                error={errorId === selectedObservation.id}
                disabled={busyId === selectedObservation.id}
              >
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
          <form onSubmit={handleRescheduleSubmit(onReschedule)} className="space-y-6 p-6">
            <div className="space-y-2">
              <Label>Selecione a Nova Data *</Label>
              <AppointmentCalendar
                availableDates={availableDatesReschedule}
                loadingDates={loadingDatesReschedule}
                currentMonth={currentMonthReschedule}
                onMonthChange={(month) => {
                  setCurrentMonthReschedule(month);
                  if (selectedReschedule.doctor_id) {
                    fetchAvailableDates(selectedReschedule.doctor_id, month).then(response => {
                      setAvailableDatesReschedule(response.available_dates || []);
                      setDoctorHasNoSchedulesReschedule(response.has_schedules === false);
                    }).catch(() => {
                      setAvailableDatesReschedule([]);
                      setDoctorHasNoSchedulesReschedule(false);
                    });
                  }
                }}
                onDateSelect={(date) => {
                  // Quando seleciona apenas a data, seta apenas a data (sem hora)
                  // Os horários serão carregados automaticamente pelo useEffect
                  // O usuário precisará clicar em um horário para completar a seleção
                  setRescheduleValue('scheduled_at', date, { shouldValidate: false });
                }}
                selectedDate={watchedRescheduleDate?.split('T')[0] || ''}
                doctorHasNoSchedules={doctorHasNoSchedulesReschedule}
              />
              <input
                type="hidden"
                {...registerReschedule('scheduled_at')}
              />
              {rescheduleErrors.scheduled_at && (
                <p className="text-xs text-red-500">{rescheduleErrors.scheduled_at.message}</p>
              )}
            </div>

            {watchedRescheduleDate && (
              <div className="space-y-2">
                <Label>Horários Disponíveis *</Label>
                {loadingSlotsReschedule ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                    <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">Carregando horários...</span>
                  </div>
                ) : availableSlotsReschedule.length > 0 ? (
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-800/50">
                    {availableSlotsReschedule.map((slot) => {
                      // O slot vem do backend como string ISO (ex: "2025-12-05T14:30:00Z" ou "2025-12-05T14:30:00")
                      // Extrai data e hora do slot original do backend
                      const slotDate = new Date(slot);
                      
                      // Para exibição, usa o timezone local
                      const timeStr = slotDate.toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      });
                      
                      // Para o valor do formulário, extrai do slot original
                      // O slot do backend já tem a data/hora correta
                      // Extrai apenas YYYY-MM-DDTHH:mm (sem segundos e timezone)
                      let datetimeValue: string;
                      
                      // Tenta extrair diretamente do formato do slot
                      const slotMatch = slot.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/);
                      if (slotMatch) {
                        datetimeValue = slotMatch[1];
                      } else {
                        // Fallback: constrói a partir do Date (usando valores locais)
                        const year = slotDate.getFullYear();
                        const month = String(slotDate.getMonth() + 1).padStart(2, '0');
                        const day = String(slotDate.getDate()).padStart(2, '0');
                        const hours = String(slotDate.getHours()).padStart(2, '0');
                        const minutes = String(slotDate.getMinutes()).padStart(2, '0');
                        datetimeValue = `${year}-${month}-${day}T${hours}:${minutes}`;
                      }
                      
                      // Verifica se está selecionado (compara data+hora completa)
                      const isSelected = watchedRescheduleDate && (
                        watchedRescheduleDate === datetimeValue || 
                        watchedRescheduleDate.startsWith(datetimeValue)
                      );
                      
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => {
                            // Log para debug
                            if (process.env.NODE_ENV === 'development') {
                              console.log('[Remarcar] Selecionando horário:', datetimeValue);
                              console.log('[Remarcar] Slot original do backend:', slot);
                              console.log('[Remarcar] SlotDate processado:', slotDate);
                              console.log('[Remarcar] Valor atual do formulário:', watchedRescheduleDate);
                            }
                            // Seta o valor completo (data + hora)
                            setRescheduleValue('scheduled_at', datetimeValue, { shouldValidate: true });
                          }}
                          className={`
                            px-3 py-2 text-sm font-medium rounded-md border-2 transition-all duration-200
                            ${isSelected 
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105' 
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                            }
                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                          `}
                        >
                          {timeStr}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-800/50">
                    <p>Nenhum horário disponível para esta data.</p>
                    <p className="text-xs mt-1">Selecione outra data.</p>
                  </div>
                )}
              </div>
            )}

            {(isDoctor || isAdmin) && (
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
            )}

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button type="button" variant="ghost" onClick={() => {
                setSelectedReschedule(null);
                resetReschedule();
                setAvailableDatesReschedule([]);
                setAvailableSlotsReschedule([]);
              }}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                loading={busyId === selectedReschedule.id}
                success={successId === selectedReschedule.id}
                error={errorId === selectedReschedule.id}
                disabled={
                  busyId === selectedReschedule.id || 
                  !watchedRescheduleDate || 
                  !watchedRescheduleDate.includes('T') ||
                  watchedRescheduleDate.split('T')[1]?.length < 5
                }
              >
                Enviar remarcação
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Modal de Detalhes da Consulta */}
      <Modal
        isOpen={!!detail || (!!detailLoadingId && !detail)}
        onClose={() => {
          setDetail(null);
          setDetailLoadingId(null);
        }}
        title={detail ? "Detalhes da Consulta" : "Carregando..."}
        size="xl"
      >
        {detailLoadingId && !detail ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : detail ? (
          <Tabs defaultValue="overview" className="w-full">
            <div className="mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <span className="font-medium text-slate-900 dark:text-white">{detail.patient?.name ?? 'Paciente'}</span>
                {' • '}
                <span className="font-medium text-slate-900 dark:text-white">{detail.doctor?.name ?? 'Médico'}</span>
              </p>
            </div>
            <TabsList className="mb-6 w-full grid grid-cols-3 lg:grid-cols-4">
              <TabsTrigger value="overview">Resumo</TabsTrigger>
              <TabsTrigger value="observations">Observações</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
              {detail.patient && isDoctor && <TabsTrigger value="patient-history">Hist. Paciente</TabsTrigger>}
            </TabsList>
            <TabsContent value="overview" className="mt-0 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wide">Status</p>
                  <StatusBadge status={detail.status} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wide">Data e Horário</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {new Date(detail.scheduled_at).toLocaleString('pt-BR', {
                      dateStyle: 'long',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wide">Tipo de Consulta</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {detail.type === 'ONLINE' ? '🖥️ Online' : '🏥 Presencial'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wide">Duração</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{detail.duration_minutes} minutos</p>
                </div>
              </div>
              {detail.notes && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wide mb-2">Notas</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap bg-slate-50 dark:bg-slate-900/50 p-3 rounded-md">
                    {detail.notes}
                  </p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="observations" className="mt-0">
              {detail.observations && detail.observations.length > 0 ? (
                <ul className="space-y-4">
                  {detail.observations.map((obs) => (
                    <li key={obs.id} className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-900/50">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          Observação Clínica
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(obs.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Anamnese</p>
                          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{obs.anamnesis}</p>
                        </div>
                        {obs.diagnosis && (
                          <div>
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Diagnóstico</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{obs.diagnosis}</p>
                          </div>
                        )}
                        {obs.prescription && (
                          <div>
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Prescrição</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{obs.prescription}</p>
                          </div>
                        )}
                        {obs.notes && (
                          <div>
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Notas Adicionais</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{obs.notes}</p>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState className="border-none bg-transparent p-0">
                  Nenhuma observação registrada.
                </EmptyState>
              )}
            </TabsContent>
            <TabsContent value="history" className="mt-0">
              {detail.logs && detail.logs.length > 0 ? (
                <ul className="space-y-3">
                  {detail.logs.map((log) => (
                    <li key={log.id} className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-900/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            {log.old_status ? getStatusLabel(log.old_status) : '—'}
                          </span>
                          <span className="text-slate-400">→</span>
                          <StatusBadge status={log.new_status} />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(log.changed_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                      </div>
                      {log.changed_by && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                          Alterado por: <span className="font-medium">{log.changed_by.name}</span>
                        </p>
                      )}
                      {log.reason && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                          <span className="font-medium">Motivo:</span> {log.reason}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState className="border-none bg-transparent p-0">
                  Sem histórico registrado.
                </EmptyState>
              )}
            </TabsContent>
            {detail.patient && isDoctor && (
              <TabsContent value="patient-history" className="mt-0 space-y-4">
                <div className="flex justify-end">
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => loadPatientHistory(detail.patient!.id)} 
                    disabled={patientHistoryLoading}
                    className="gap-1.5"
                  >
                    {patientHistoryLoading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Carregando...
                      </>
                    ) : (
                      <>
                        <Clock className="h-3.5 w-3.5" />
                        Atualizar histórico
                      </>
                    )}
                  </Button>
                </div>
                {patientHistory === null ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Clique em "Atualizar histórico" para carregar todas as observações do paciente.
                    </p>
                  </div>
                ) : patientHistory.length === 0 ? (
                  <EmptyState className="border-none bg-transparent p-0">
                    Nenhuma observação registrada para este paciente.
                  </EmptyState>
                ) : (
                  <ul className="space-y-3">
                    {patientHistory.map((obs) => (
                      <li key={obs.id} className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-900/50">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {new Date(obs.created_at).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })}
                          </p>
                          {obs.doctor && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Dr(a). {obs.doctor.name}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Anamnese</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{obs.anamnesis}</p>
                          </div>
                          {obs.diagnosis && (
                            <div>
                              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Diagnóstico</p>
                              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{obs.diagnosis}</p>
                            </div>
                          )}
                          {obs.prescription && (
                            <div>
                              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Prescrição</p>
                              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{obs.prescription}</p>
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>
            )}
          </Tabs>
        ) : null}
      </Modal>
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
    gender: z.enum(['M', 'F', 'OTHER'], { message: 'Selecione o sexo' }).optional(),
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
  // Garante que currentMonth está no formato correto
  // currentMonth vem como 'YYYY-MM', então adicionamos '-01' para criar uma data válida
  const [yearStr, monthStr] = currentMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // Converte de 1-12 para 0-11
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay(); // 0 = Domingo, 1 = Segunda, etc.
  
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  
  // Debug em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
  }
  
  const handlePrevMonth = () => {
    const prevMonth = new Date(year, month - 1, 1);
    const monthStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
    onMonthChange(monthStr);
  };
  
  const handleNextMonth = () => {
    // Calcula o próximo mês
    // month é 0-based (0 = janeiro, 11 = dezembro)
    let nextYear = year;
    let nextMonthValue = month + 1;
    
    // Se passou de dezembro, vai para janeiro do próximo ano
    if (nextMonthValue > 11) {
      nextMonthValue = 0;
      nextYear += 1;
    }
    
    // Converte para formato YYYY-MM (nextMonthValue + 1 porque precisamos de 1-12)
    const monthStr = `${nextYear}-${String(nextMonthValue + 1).padStart(2, '0')}`;
    
    // Debug em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
    }
    
    onMonthChange(monthStr);
  };
  
  const isDateAvailable = (date: Date): boolean => {
    // Formata a data como YYYY-MM-DD sem depender de timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    return availableDates.includes(dateStr);
  };
  
  const isDateSelected = (date: Date): boolean => {
    // Formata a data como YYYY-MM-DD sem depender de timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return selectedDate === dateStr || selectedDate?.startsWith(dateStr);
  };
  
  const isDatePast = (date: Date): boolean => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return date < tomorrow;
  };
  
  const handleDateClick = (date: Date) => {
    if (isDatePast(date) || !isDateAvailable(date)) return;
    // Formata a data como YYYY-MM-DD sem depender de timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
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
      // Formata a data como YYYY-MM-DD sem depender de timezone
      const yearStr = date.getFullYear();
      const monthStr = String(date.getMonth() + 1).padStart(2, '0');
      const dayStr = String(date.getDate()).padStart(2, '0');
      const dateStr = `${yearStr}-${monthStr}-${dayStr}`;
      
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
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handlePrevMonth();
          }}
          className="p-1 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
        >
          <ChevronLeft className="h-5 w-5 text-slate-600" />
        </button>
        <h3 className="text-lg font-semibold text-slate-900">
          {monthNames[month]} {year}
        </h3>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleNextMonth();
          }}
          className="p-1 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
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


