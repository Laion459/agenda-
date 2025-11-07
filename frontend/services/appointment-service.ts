import api from "@/lib/api";
import { Appointment, PaginatedResponse } from "@/types";

export async function fetchAppointments(params?: Record<string, unknown>) {
  const { data } = await api.get<PaginatedResponse<Appointment>>('/appointments', { params });
  return data;
}

export async function fetchAppointment(id: number) {
  const { data } = await api.get<Appointment>(`/appointments/${id}`);
  return data;
}

export async function createAppointment(payload: Record<string, unknown>) {
  const { data } = await api.post<Appointment>('/appointments', payload);
  return data;
}

export async function confirmAppointment(id: number) {
  const { data } = await api.post<Appointment>(`/appointments/${id}/confirm`);
  return data;
}

export async function cancelAppointment(id: number, reason?: string) {
  const { data } = await api.post<Appointment>(`/appointments/${id}/cancel`, { reason });
  return data;
}

export async function rescheduleAppointment(id: number, payload: Record<string, unknown>) {
  const { data } = await api.post<Appointment>(`/appointments/${id}/reschedule`, payload);
  return data;
}


