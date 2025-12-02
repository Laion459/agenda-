import api from "@/lib/api";

export interface AppointmentSummary {
  start_date: string;
  end_date: string;
  total: number;
  by_status: Record<string, { total: number; percentage: number }>;
  trend: Array<{ date: string; total: number }>;
}

export interface DoctorOccupancyItem {
  doctor_id: number;
  doctor_name: string;
  total_appointments: number;
  confirmed: number;
  completed: number;
  cancelled?: number;
  occupancy_rate: number;
}

export interface InsuranceUsageItem {
  health_insurance_id: number;
  name: string;
  total_appointments: number;
}

export async function fetchAppointmentSummary(params?: Record<string, unknown>) {
  const { data } = await api.get<AppointmentSummary>("/admin/reports/appointments", { params });
  return data;
}

export async function fetchDoctorOccupancy(params?: Record<string, unknown>) {
  const { data } = await api.get<{ data: DoctorOccupancyItem[] }>("/admin/reports/doctor-occupancy", {
    params,
  });
  return data.data;
}

export async function fetchInsuranceUsage(params?: Record<string, unknown>) {
  const { data } = await api.get<{ data: InsuranceUsageItem[] }>("/admin/reports/insurance-usage", {
    params,
  });
  return data.data;
}


