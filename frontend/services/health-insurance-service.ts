import api from "@/lib/api";
import { HealthInsurance } from "@/types";

export async function fetchHealthInsurances() {
  const { data } = await api.get<HealthInsurance[]>("/health-insurances");
  return data;
}

export async function createHealthInsurance(payload: Record<string, unknown>) {
  const { data } = await api.post<HealthInsurance>("/health-insurances", payload);
  return data;
}

export async function updateHealthInsurance(id: number, payload: Record<string, unknown>) {
  const { data } = await api.put<HealthInsurance>(`/health-insurances/${id}`, payload);
  return data;
}

export async function deleteHealthInsurance(id: number) {
  await api.delete(`/health-insurances/${id}`);
}


