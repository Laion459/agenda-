import api from "@/lib/api";
import { PaginatedResponse, User } from "@/types";

type AdminUserResponse = PaginatedResponse<User>;

export async function fetchAdminUsers(params?: Record<string, unknown>) {
  const { data } = await api.get<AdminUserResponse>("/admin/users", { params });
  return data;
}

export async function exportAdminUsers(params?: Record<string, unknown>): Promise<Blob> {
  const response = await api.get("/admin/users/export", {
    params,
    responseType: "blob",
  });

  // Axios retorna o blob em response.data quando responseType é 'blob'
  // Verifica se é um Blob válido
  if (response.data instanceof Blob) {
    return response.data;
  }
  
  // Se for uma string (pode ser erro JSON), verifica se é JSON
  if (typeof response.data === 'string') {
    // Tenta parsear como JSON para verificar se é um erro
    try {
      const parsed = JSON.parse(response.data);
      if (parsed.message || parsed.error) {
        throw new Error(parsed.message || parsed.error || 'Erro ao exportar usuários');
      }
    } catch {
      // Não é JSON, então é CSV válido - cria Blob
      return new Blob([response.data], { type: "text/csv;charset=utf-8" });
    }
  }
  
  // Fallback: cria um Blob a partir dos dados
  return new Blob([response.data], { type: "text/csv;charset=utf-8" });
}


