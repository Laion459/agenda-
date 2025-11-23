import api from "@/lib/api";
import { User, PaginatedResponse } from "@/types";

interface LoginResponse {
  token: string;
  user: User;
}

export async function login(
  payload: 
    | { email: string; password: string } 
    | { crm: string; password: string }
    | { cpf: string; password: string }
) {
  // Se for CRM ou CPF, precisamos converter para email primeiro
  let email = 'email' in payload ? payload.email : '';
  
  if ('crm' in payload) {
    // Buscar médico por CRM para obter o email
    const { data: doctorsResponse } = await api.get<PaginatedResponse<import('@/types').Doctor>>('/doctors', {
      params: { crm: payload.crm }
    });
    
    const doctor = doctorsResponse.data.find(d => d.crm === payload.crm);
    
    if (doctor && doctor.user?.email) {
      email = doctor.user.email;
    } else {
      throw new Error('CRM não encontrado');
    }
  } else if ('cpf' in payload) {
    // Buscar paciente por CPF para obter o email
    // Nota: O endpoint de pacientes pode não estar disponível publicamente
    // Por enquanto, vamos tentar buscar através de uma rota admin ou criar uma rota específica
    // Por simplicidade, vamos assumir que o CPF não é suportado ainda
    throw new Error('Login por CPF ainda não está disponível. Use seu email.');
  }
  
  const { data } = await api.post<LoginResponse>('/auth/login', {
    email,
    password: payload.password
  });
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


