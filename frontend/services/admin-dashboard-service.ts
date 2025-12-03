import api from "@/lib/api";
import { handleApiError } from "@/lib/handle-api-error";

interface DoctorData {
  id: number;
  specialty: string;
  is_active: boolean;
  created_at: string;
}

interface AppointmentData {
  id: number;
  doctor_id: number;
  doctor?: {
    id: number;
    specialty: string;
  };
  scheduled_at: string;
  date_time?: string; // Campo legado, usar scheduled_at
  created_at: string;
}

interface PatientData {
  user?: {
    is_active: boolean;
  };
  created_at: string;
}

interface InsuranceData {
  is_active: boolean;
  created_at: string;
}

export interface DashboardStats {
  total_appointments: number;
  appointments_today: number;
  appointments_this_month: number;
  total_doctors: number;
  active_doctors: number;
  new_doctors: number;
  total_patients: number;
  active_patients: number;
  new_patients: number;
  total_health_insurances: number;
  active_health_insurances: number;
  new_health_insurances: number;
  appointments_growth: number;
  doctors_growth: number;
  patients_growth: number;
  health_insurances_growth: number;
}

export interface RecentActivity {
  id: number;
  type: "doctor_registered" | "patients_registered" | "insurance_activated" | "appointments_cancelled";
  title: string;
  description: string;
  icon: string;
  color: string;
  created_at: string;
}

export interface MonthlyAppointments {
  month: string;
  total: number;
}

export interface SpecialtyDistribution {
  specialty: string;
  total: number;
  percentage: number;
}

export async function fetchDashboardStats() {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  
  // Primeiro dia do mês atual (00:00:00)
  const firstDayThisMonth = new Date(thisYear, thisMonth, 1);
  firstDayThisMonth.setHours(0, 0, 0, 0);
  
  // Primeiro dia do mês anterior
  const firstDayLastMonth = new Date(thisYear, thisMonth - 1, 1);
  firstDayLastMonth.setHours(0, 0, 0, 0);
  
  // Último dia do mês anterior (23:59:59)
  const lastDayLastMonth = new Date(thisYear, thisMonth, 0);
  lastDayLastMonth.setHours(23, 59, 59, 999);

  const [appointmentsResponse, doctorsResponse, patientsResponse, insurancesResponse] = await Promise.all([
    api.get("/appointments", {
      params: {
        per_page: 1000,
        start_date: firstDayLastMonth.toISOString().split("T")[0],
        end_date: now.toISOString().split("T")[0],
      },
    }),
    api.get("/admin/doctors"),
    api.get("/admin/patients"),
    api.get("/health-insurances"),
  ]);

  // A API retorna os dados em data.data ou diretamente em data
  const appointmentsData = appointmentsResponse.data?.data || appointmentsResponse.data || [];
  const doctorsData = (doctorsResponse.data?.data || doctorsResponse.data || []) as DoctorData[];
  const patientsData = (patientsResponse.data?.data || patientsResponse.data || []) as PatientData[];
  const insurancesData = (insurancesResponse.data?.data || insurancesResponse.data || []) as InsuranceData[];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const appointmentsToday = appointmentsData.filter((apt: AppointmentData) => {
    // O campo correto é scheduled_at
    const dateTime = apt.scheduled_at || apt.date_time;
    if (!dateTime) return false;
    const aptDate = new Date(dateTime);
    return aptDate >= today && aptDate < tomorrow;
  }).length;

  // Filtrar consultas do mês atual
  const appointmentsThisMonth = appointmentsData.filter((apt: AppointmentData) => {
    // O campo correto é scheduled_at
    const dateTime = apt.scheduled_at || apt.date_time;
    if (!dateTime) return false;
    const aptDate = new Date(dateTime);
    return aptDate >= firstDayThisMonth && aptDate <= now;
  }).length;

  // Filtrar consultas do mês anterior
  const appointmentsLastMonth = appointmentsData.filter((apt: AppointmentData) => {
    // O campo correto é scheduled_at
    const dateTime = apt.scheduled_at || apt.date_time;
    if (!dateTime) return false;
    const aptDate = new Date(dateTime);
    return aptDate >= firstDayLastMonth && aptDate <= lastDayLastMonth;
  }).length;

  const calculateGrowth = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100 * 10) / 10;
  };

  const activeDoctors = doctorsData.filter((d) => d.is_active).length;
  
  // Médicos novos do mês atual
  const newDoctors = doctorsData.filter((d) => {
    if (!d.created_at) return false;
    const created = new Date(d.created_at);
    return created >= firstDayThisMonth && created <= now;
  }).length;

  const doctorsBeforeThisMonth = doctorsData.filter((d) => {
    if (!d.created_at) return false;
    const created = new Date(d.created_at);
    return created < firstDayThisMonth;
  }).length;

  // Total de médicos no final do mês anterior (último dia do mês anterior)
  const doctorsAtEndOfLastMonth = doctorsBeforeThisMonth;
  const doctorsGrowth = calculateGrowth(doctorsData.length, doctorsAtEndOfLastMonth);

  const activePatients = patientsData.filter((p) => p.user?.is_active !== false).length;
  
  // Pacientes novos do mês atual
  const newPatients = patientsData.filter((p) => {
    if (!p.created_at) return false;
    const created = new Date(p.created_at);
    return created >= firstDayThisMonth && created <= now;
  }).length;

  // Total de pacientes antes do início do mês atual
  const patientsBeforeThisMonth = patientsData.filter((p) => {
    if (!p.created_at) return false;
    const created = new Date(p.created_at);
    return created < firstDayThisMonth;
  }).length;

  const patientsAtEndOfLastMonth = patientsBeforeThisMonth;
  const patientsGrowth = calculateGrowth(patientsData.length, patientsAtEndOfLastMonth);

  const activeInsurances = insurancesData.filter((i) => i.is_active).length;
  
  // Convênios novos do mês atual
  const newInsurances = insurancesData.filter((i) => {
    if (!i.created_at) return false;
    const created = new Date(i.created_at);
    return created >= firstDayThisMonth && created <= now;
  }).length;

  // Total de convênios antes do início do mês atual
  const insurancesBeforeThisMonth = insurancesData.filter((i) => {
    if (!i.created_at) return false;
    const created = new Date(i.created_at);
    return created < firstDayThisMonth;
  }).length;

  const insurancesAtEndOfLastMonth = insurancesBeforeThisMonth;
  const insurancesGrowth = calculateGrowth(insurancesData.length, insurancesAtEndOfLastMonth);

  // Crescimento de consultas
  const appointmentsGrowth = calculateGrowth(appointmentsThisMonth, appointmentsLastMonth);

  const allAppointmentsResponse = await api.get("/appointments", {
    params: {
      per_page: 1000,
    },
  });
  const allAppointments = allAppointmentsResponse.data?.data || allAppointmentsResponse.data || [];
  const totalAppointments = allAppointments.length;

  return {
    total_appointments: totalAppointments,
    appointments_today: appointmentsToday,
    appointments_this_month: appointmentsThisMonth,
    total_doctors: doctorsData.length,
    active_doctors: activeDoctors,
    new_doctors: newDoctors,
    total_patients: patientsData.length,
    active_patients: activePatients,
    new_patients: newPatients,
    total_health_insurances: insurancesData.length,
    active_health_insurances: activeInsurances,
    new_health_insurances: newInsurances,
    appointments_growth: appointmentsGrowth,
    doctors_growth: doctorsGrowth,
    patients_growth: patientsGrowth,
    health_insurances_growth: insurancesGrowth,
  } as DashboardStats;
}

export async function fetchRecentActivities(): Promise<RecentActivity[]> {
  try {
    const response = await api.get("/admin/activity-logs", {
      params: {
        per_page: 10,
        page: 1,
      },
    });

    const logs = response.data?.data || [];
    
    return logs.map((log: any) => {
      const action = log.action || '';
      const user = log.user;
      let type: RecentActivity['type'] = 'appointments_cancelled';
      let title = action;
      let description = '';
      let icon = 'check';
      let color = 'gray';

      if (action.includes('POST') && action.includes('doctors')) {
        type = 'doctor_registered';
        title = 'Novo médico cadastrado';
        description = user ? `${user.name || 'Médico'}` : 'Novo cadastro';
        icon = 'check';
        color = 'green';
      } else if (action.includes('POST') && action.includes('patients')) {
        type = 'patients_registered';
        title = 'Novo paciente cadastrado';
        description = user ? `${user.name || 'Paciente'}` : 'Novo cadastro';
        icon = 'users';
        color = 'blue';
      } else if (action.includes('POST') && action.includes('health-insurances')) {
        type = 'insurance_activated';
        title = 'Novo convênio ativado';
        description = log.route || 'Novo convênio';
        icon = 'trending-up';
        color = 'orange';
      } else if (action.includes('DELETE') || action.includes('cancel')) {
        type = 'appointments_cancelled';
        title = 'Consulta cancelada';
        description = user ? `Solicitado por ${user.name}` : 'Cancelamento';
        icon = 'x';
        color = 'red';
      } else {
        // Ação genérica
        description = user ? user.name : log.route || '';
        icon = 'check';
        color = 'gray';
      }

      return {
        id: log.id,
        type,
        title,
        description,
        icon,
        color,
        created_at: log.created_at || new Date().toISOString(),
      };
    });
  } catch (error) {
    handleApiError(error, 'Erro ao buscar atividades recentes');
    return [];
  }
}

export async function fetchMonthlyAppointments(): Promise<MonthlyAppointments[]> {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    
    const response = await api.get("/appointments", {
      params: {
        per_page: 1000,
        start_date: sixMonthsAgo.toISOString().split("T")[0],
        end_date: new Date().toISOString().split("T")[0],
      },
    });

    const appointments = response.data?.data || response.data || [];
    
    // Agrupar por mês
    const monthly: Record<string, number> = {};
    appointments.forEach((apt: AppointmentData) => {
      const dateTime = apt.scheduled_at || apt.date_time;
      if (!dateTime) return;
      
      const date = new Date(dateTime);
      const monthKey = date.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
      monthly[monthKey] = (monthly[monthKey] || 0) + 1;
    });

    // Ordenar por data (mais antigo primeiro)
    const sortedEntries = Object.entries(monthly).sort((a, b) => {
      const parseMonth = (str: string) => {
        const [month, year] = str.split(' ');
        const monthMap: Record<string, number> = {
          'jan.': 0, 'fev.': 1, 'mar.': 2, 'abr.': 3, 'mai.': 4, 'jun.': 5,
          'jul.': 6, 'ago.': 7, 'set.': 8, 'out.': 9, 'nov.': 10, 'dez.': 11
        };
        return new Date(parseInt(year), monthMap[month.toLowerCase()] || 0, 1);
      };
      return parseMonth(a[0]).getTime() - parseMonth(b[0]).getTime();
    });

    return sortedEntries.map(([month, total]) => ({
      month,
      total,
    }));
  } catch (error) {
    handleApiError(error, 'Erro ao buscar consultas por mês');
    return [];
  }
}

export async function fetchSpecialtyDistribution(): Promise<SpecialtyDistribution[]> {
  try {
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 6);

    const [appointmentsResponse, doctorsResponse] = await Promise.all([
      api.get("/appointments", {
        params: {
          per_page: 1000,
          start_date: sixMonthsAgo.toISOString().split("T")[0],
          end_date: now.toISOString().split("T")[0],
        },
      }),
      api.get("/admin/doctors"),
    ]);

    // A API retorna os dados em data.data ou diretamente em data
    const appointments = appointmentsResponse.data?.data || appointmentsResponse.data || [];
    const doctors = doctorsResponse.data?.data || doctorsResponse.data || [];

    // Cria um mapa de doctor_id -> specialty
    const doctorSpecialtyMap = new Map<number, string>();
    (doctors as DoctorData[]).forEach((doctor) => {
      if (doctor.specialty) {
        doctorSpecialtyMap.set(doctor.id, doctor.specialty);
      }
    });

    // Agrupa consultas por especialidade
    const specialtyCount: Record<string, number> = {};
    
    appointments.forEach((appointment: AppointmentData) => {
      const doctorId = appointment.doctor_id;
      const specialty = appointment.doctor?.specialty || doctorSpecialtyMap.get(doctorId) || 'Outras';
      
      specialtyCount[specialty] = (specialtyCount[specialty] || 0) + 1;
    });

    const total = Object.values(specialtyCount).reduce((sum, count) => sum + count, 0);

    const distribution = Object.entries(specialtyCount)
      .map(([specialty, count]) => ({
        specialty,
        total: count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10); // Limita a 10 especialidades

    return distribution;
  } catch (error) {
    handleApiError(error, 'Erro ao buscar distribuição de especialidades');
    return [];
  }
}

