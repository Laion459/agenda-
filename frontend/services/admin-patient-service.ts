import api from "@/lib/api";
import { Patient, PaginatedResponse } from "@/types";

type PatientHealthInsurancePayload = {
  id: number;
  policy_number?: string | null;
  is_active?: boolean;
};

type PatientPayload = {
  name?: string;
  email?: string;
  phone?: string | null;
  password?: string | null;
  cpf?: string;
  birth_date?: string;
  gender?: string | null;
  address?: string | null;
  health_insurances?: PatientHealthInsurancePayload[];
};

type PatientResourceResponse = {
  data: Patient;
};

export async function fetchAdminPatients(params?: Record<string, unknown>) {
  const { data } = await api.get<PaginatedResponse<Patient>>("/admin/patients", { params });
  return data;
}

export async function createPatient(payload: PatientPayload) {
  const { data } = await api.post<PatientResourceResponse>("/admin/patients", payload);
  return data.data;
}

export async function updatePatient(id: number, payload: PatientPayload) {
  const { data } = await api.put<PatientResourceResponse>(`/admin/patients/${id}`, payload);
  return data.data;
}

export async function deletePatient(id: number) {
  await api.delete(`/admin/patients/${id}`);
}


