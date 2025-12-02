import api from "@/lib/api";

export type ScheduleException = {
  id: number;
  doctor_id: number;
  date: string;
  type: 'BLOCKED' | 'CUSTOM_HOURS' | 'UNAVAILABLE';
  start_time?: string;
  end_time?: string;
  reason?: string;
  created_at: string;
  updated_at: string;
};

type ScheduleExceptionResourceResponse = {
  data: ScheduleException;
};

export async function fetchScheduleExceptions() {
  const { data } = await api.get<{ data: ScheduleException[] }>("/doctor/schedule-exceptions");
  return data;
}

export async function createScheduleException(payload: {
  date: string;
  type: 'BLOCKED' | 'CUSTOM_HOURS' | 'UNAVAILABLE';
  start_time?: string;
  end_time?: string;
  reason?: string;
}) {
  const { data } = await api.post<ScheduleExceptionResourceResponse>("/doctor/schedule-exceptions", payload);
  return data.data;
}

export async function updateScheduleException(id: number, payload: {
  type?: 'BLOCKED' | 'CUSTOM_HOURS' | 'UNAVAILABLE';
  start_time?: string;
  end_time?: string;
  reason?: string;
}) {
  const { data } = await api.put<ScheduleExceptionResourceResponse>(`/doctor/schedule-exceptions/${id}`, payload);
  return data.data;
}

export async function deleteScheduleException(id: number) {
  await api.delete(`/doctor/schedule-exceptions/${id}`);
}

