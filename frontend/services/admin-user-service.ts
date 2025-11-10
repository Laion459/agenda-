import api from "@/lib/api";
import { PaginatedResponse, User } from "@/types";

type AdminUserResponse = PaginatedResponse<User>;

export async function fetchAdminUsers(params?: Record<string, unknown>) {
  const { data } = await api.get<AdminUserResponse>("/admin/users", { params });
  return data;
}

export async function exportAdminUsers(params?: Record<string, unknown>) {
  const response = await api.get<Blob>("/admin/users/export", {
    params,
    responseType: "blob",
  });

  return response;
}


