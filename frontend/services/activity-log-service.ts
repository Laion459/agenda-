import api from "@/lib/api";
import { ActivityLog, PaginatedResponse } from "@/types";

type ActivityLogResponse = PaginatedResponse<ActivityLog>;

export async function fetchActivityLogs(params?: Record<string, unknown>) {
  const { data } = await api.get<ActivityLogResponse>("/admin/activity-logs", { params });
  return data;
}


