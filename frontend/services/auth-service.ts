import api from "@/lib/api";
import { User } from "@/types";

interface LoginResponse {
  token: string;
  user: User;
}

export async function login(payload: { email: string; password: string }) {
  const { data } = await api.post<LoginResponse>('/auth/login', payload);
  return data;
}

export async function registerPatient(payload: Record<string, unknown>) {
  const { data } = await api.post<{ message: string; user: User }>('/auth/register', payload);
  return data;
}

export async function registerDoctor(payload: Record<string, unknown>) {
  const { data } = await api.post<{ message: string; user: User }>('/auth/register/doctor', payload);
  return data;
}

export async function logout() {
  await api.post('/auth/logout');
}


