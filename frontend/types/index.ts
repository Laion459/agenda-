export type UserRole = "ADMIN" | "DOCTOR" | "PATIENT";

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
}

export interface HealthInsurance {
  id: number;
  name: string;
  coverage_percentage: number | string | null;
  is_active: boolean;
  pivot?: {
    policy_number?: string | null;
    is_active?: boolean;
  };
  pivot_doctor?: {
    is_active?: boolean;
  };
}

export interface Doctor {
  id: number;
  name: string;
  crm: string;
  specialty: string;
  qualification?: string | null;
  is_active: boolean;
  health_insurances?: HealthInsurance[];
  user?: User;
}

export interface Patient {
  id: number;
  name: string;
  cpf: string;
  birth_date: string;
  gender?: string | null;
  address?: string | null;
  health_insurances?: HealthInsurance[];
  profile_completed_at?: string | null;
  user?: User;
}

export interface Appointment {
  id: number;
  status: string;
  type: string;
  scheduled_at: string;
  duration_minutes: number;
  price?: number | null;
  notes?: string | null;
  doctor?: Doctor;
  patient?: Patient;
  observations?: Observation[];
  logs?: AppointmentLog[];
  created_by?: User | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    unread_count?: number;
  };
}

export interface Observation {
  id: number;
  appointment_id: number;
  doctor_id: number;
  patient_id: number;
  anamnesis: string;
  diagnosis?: string | null;
  prescription?: string | null;
  notes?: string | null;
  attachments?: unknown;
  created_at: string;
  doctor?: Doctor;
  patient?: Patient;
  appointment?: {
    id: number;
    scheduled_at: string;
    status: string;
    doctor?: Doctor;
  };
}

export interface AppointmentLog {
  id: number;
  old_status?: string | null;
  new_status: string;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
  changed_at: string;
  changed_by?: User;
}

export interface Notification {
  id: number;
  type: string;
  subject: string;
  message: string;
  channel: string;
  is_read: boolean;
  sent_at: string;
  read_at?: string | null;
  metadata?: Record<string, unknown> | null;
}


