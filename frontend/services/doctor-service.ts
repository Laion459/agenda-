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


