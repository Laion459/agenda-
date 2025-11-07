import api from "@/lib/api";

export async function createObservation(appointmentId: number, payload: Record<string, unknown>) {
  const { data } = await api.post(`/appointments/${appointmentId}/observations`, payload);
  return data;
}

export async function fetchPatientObservations(params?: Record<string, unknown>) {
  const { data } = await api.get('/patient/observations', { params });
  return data;
}


