import api from "@/lib/api";
import { Doctor, PaginatedResponse } from "@/types";

export async function fetchDoctors(params?: Record<string, unknown>) {
  const { data } = await api.get<PaginatedResponse<Doctor>>('/doctors', { params });
  return data;
}

export async function fetchDoctor(id: number) {
  const { data } = await api.get<Doctor>(`/doctors/${id}`);
  return data;
}

export async function fetchAvailableSlots(
  doctorId: number, 
  date: string, 
  duration: number = 30
) {
  const { data } = await api.get<{
    available_slots: string[];
    date: string;
    doctor_id: number;
    schedule?: {
      start_time: string;
      end_time: string;
    };
  }>(`/doctors/${doctorId}/available-slots`, {
    params: { date, duration },
  });
  return data;
}

export async function fetchAvailableDates(
  doctorId: number,
  month?: string
) {
  const { data } = await api.get<{
    available_dates: string[];
    month: string;
    message?: string;
    has_schedules?: boolean;
  }>(`/doctors/${doctorId}/available-dates`, {
    params: month ? { month } : {},
  });
  return data;
}


