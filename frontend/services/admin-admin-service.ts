import api from "@/lib/api";
import { PaginatedResponse, User } from "@/types";

type AdminAdminResponse = PaginatedResponse<User>;

export async function fetchAdminAdmins(params?: Record<string, unknown>) {
  const { data } = await api.get<AdminAdminResponse>("/admin/admins", { params });
  return data;
}

export async function fetchAdminAdminsStatistics() {
  const { data } = await api.get<{
    total: number;
    active: number;
    inactive: number;
  }>("/admin/admins/statistics");
  return data;
}

export async function createAdminAdmin(data: {
  name: string;
  email: string;
  phone: string;
  password?: string;
  is_active?: boolean;
}) {
  const { data: response } = await api.post<User>("/admin/admins", data);
  return response;
}

export async function updateAdminAdmin(adminId: number, data: {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  is_active?: boolean;
}) {
  const { data: response } = await api.put<User>(`/admin/admins/${adminId}`, data);
  return response;
}

export async function deleteAdminAdmin(adminId: number) {
  await api.delete(`/admin/admins/${adminId}`);
}

