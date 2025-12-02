import api from "@/lib/api";

export type AvailabilityPeriod = {
  id: number;
  doctor_id: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
};

type AvailabilityPeriodResourceResponse = {
  data: AvailabilityPeriod;
};

export async function fetchAvailabilityPeriods() {
  const { data } = await api.get<{ data: AvailabilityPeriod[] }>("/doctor/availability-periods");
  return data;
}

export async function createAvailabilityPeriod(payload: {
  start_date: string;
  end_date: string;
  is_active?: boolean;
  description?: string;
}) {
  const { data } = await api.post<AvailabilityPeriodResourceResponse>("/doctor/availability-periods", payload);
  return data.data;
}

export async function updateAvailabilityPeriod(id: number, payload: {
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
  description?: string;
}) {
  const { data } = await api.put<AvailabilityPeriodResourceResponse>(`/doctor/availability-periods/${id}`, payload);
  return data.data;
}

export async function deleteAvailabilityPeriod(id: number) {
  await api.delete(`/doctor/availability-periods/${id}`);
}

