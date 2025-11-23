import api from "@/lib/api";

interface DoctorData {
  is_active: boolean;
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
  // Por enquanto, vamos calcular baseado nos dados existentes
  // Depois podemos criar um endpoint específico no backend
  const [appointments, doctors, patients, insurances] = await Promise.all([
    api.get("/admin/reports/appointments", {
      params: {
        start_date: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split("T")[0],
        end_date: new Date().toISOString().split("T")[0],
      },
    }),
    api.get("/admin/doctors"),
    api.get("/admin/patients"),
    api.get("/health-insurances"),
  ]);

  const appointmentsData = appointments.data;
  const doctorsData = doctors.data.data || [];
  const patientsData = patients.data.data || [];
  const insurancesData = insurances.data.data || [];

  // Calcular estatísticas
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();

  const appointmentsToday = 0; // Será calculado quando tivermos endpoint específico
  const appointmentsThisMonth = appointmentsData?.total || 0;

  const activeDoctors = (doctorsData as DoctorData[]).filter((d) => d.is_active).length;
  const newDoctors = (doctorsData as DoctorData[]).filter((d) => {
    const created = new Date(d.created_at);
    return created.getMonth() === thisMonth && created.getFullYear() === thisYear;
  }).length;

  const activePatients = (patientsData as PatientData[]).filter((p) => p.user?.is_active).length;
  const newPatients = (patientsData as PatientData[]).filter((p) => {
    const created = new Date(p.created_at);
    return created.getMonth() === thisMonth && created.getFullYear() === thisYear;
  }).length;

  const activeInsurances = (insurancesData as InsuranceData[]).filter((i) => i.is_active).length;
  const newInsurances = (insurancesData as InsuranceData[]).filter((i) => {
    const created = new Date(i.created_at);
    return created.getMonth() === thisMonth && created.getFullYear() === thisYear;
  }).length;

  return {
    total_appointments: appointmentsData?.total || 0,
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
    appointments_growth: 12.5, // Placeholder
    doctors_growth: 6.2, // Placeholder
    patients_growth: 15.8, // Placeholder
    health_insurances_growth: 20.0, // Placeholder
  } as DashboardStats;
}

export async function fetchRecentActivities(): Promise<RecentActivity[]> {
  // Por enquanto retornamos dados mockados
  // Depois podemos criar um endpoint específico
  return [
    {
      id: 1,
      type: "doctor_registered",
      title: "Novo médico cadastrado",
      description: "Dr. Roberto Alves - Cardiologia",
      icon: "check",
      color: "green",
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      type: "patients_registered",
      title: "15 novos pacientes cadastrados",
      description: "Cadastros realizados hoje",
      icon: "users",
      color: "blue",
      created_at: new Date().toISOString(),
    },
    {
      id: 3,
      type: "insurance_activated",
      title: "Novo convênio ativado",
      description: "Unimed Plus - 200 beneficiários",
      icon: "trending-up",
      color: "orange",
      created_at: new Date().toISOString(),
    },
    {
      id: 4,
      type: "appointments_cancelled",
      title: "3 consultas canceladas",
      description: "Cancelamentos solicitados pelos pacientes",
      icon: "x",
      color: "red",
      created_at: new Date().toISOString(),
    },
  ];
}

export async function fetchMonthlyAppointments(): Promise<MonthlyAppointments[]> {
  const response = await api.get("/admin/reports/appointments", {
    params: {
      start_date: new Date(new Date().setMonth(new Date().getMonth() - 5)).toISOString().split("T")[0],
      end_date: new Date().toISOString().split("T")[0],
    },
  });

  const trend = response.data?.trend || [];
  
  // Agrupar por mês
  const monthly: Record<string, number> = {};
  trend.forEach((item: { date: string; total: number }) => {
    const month = new Date(item.date).toLocaleDateString("pt-BR", { month: "short" });
    monthly[month] = (monthly[month] || 0) + item.total;
  });

  return Object.entries(monthly).map(([month, total]) => ({
    month,
    total,
  }));
}

export async function fetchSpecialtyDistribution(): Promise<SpecialtyDistribution[]> {
  await api.get("/admin/reports/doctor-occupancy");
  
  // Agrupar por especialidade (precisaríamos de um endpoint específico)
  // Por enquanto retornamos dados mockados baseados na imagem
  return [
    { specialty: "Cardiologia", total: 140, percentage: 32 },
    { specialty: "Dermatologia", total: 95, percentage: 21 },
    { specialty: "Ortopedia", total: 85, percentage: 19 },
    { specialty: "Pediatria", total: 70, percentage: 17 },
    { specialty: "Ginecologia", total: 45, percentage: 11 },
  ];
}

