import api from "@/lib/api";
import { Doctor, PaginatedResponse } from "@/types";

type DoctorPayload = {
  name?: string;
  email?: string;
  phone?: string | null;
  password?: string | null;
  crm?: string;
  specialty?: string;
  qualification?: string | null;
  is_active?: boolean;
  health_insurance_ids?: number[];
};

type DoctorResourceResponse = {
  data: Doctor;
};

export async function fetchAdminDoctors(params?: Record<string, unknown>) {
  try {
    const response = await api.get<PaginatedResponse<Doctor>>("/admin/doctors", { params });
    
    // Log em desenvolvimento para debug
    if (process.env.NODE_ENV === 'development') {
      console.log('[fetchAdminDoctors] Response:', {
        hasData: !!response.data,
        dataType: typeof response.data,
        dataKeys: response.data && typeof response.data === 'object' ? Object.keys(response.data) : [],
        isArray: Array.isArray(response.data),
      });
    }
    
    return response.data;
  } catch (error) {
    // Log detalhado do erro antes de re-throw
    if (process.env.NODE_ENV === 'development') {
      console.error('[fetchAdminDoctors] Error caught:', {
        error,
        errorType: typeof error,
        isAxiosError: error && typeof error === 'object' && 'isAxiosError' in error,
        hasResponse: error && typeof error === 'object' && 'response' in error,
        hasRequest: error && typeof error === 'object' && 'request' in error,
        errorMessage: error instanceof Error ? error.message : undefined,
      });
    }
    // Re-throw para que o error handler possa processar
    throw error;
  }
}

export async function createDoctor(payload: DoctorPayload) {
  const { data } = await api.post<DoctorResourceResponse>("/admin/doctors", payload);
  return data.data;
}

export async function updateDoctor(id: number, payload: DoctorPayload) {
  const { data } = await api.put<DoctorResourceResponse>(`/admin/doctors/${id}`, payload);
  return data.data;
}

export async function toggleDoctorStatus(id: number) {
  const { data } = await api.post<DoctorResourceResponse>(`/admin/doctors/${id}/toggle-active`);
  return data.data;
}


