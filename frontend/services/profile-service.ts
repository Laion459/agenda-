import api from "@/lib/api";
import { User } from "@/types";

type ProfileResponse = {
  data: User;
};

export async function fetchProfile() {
  const { data } = await api.get<ProfileResponse>("/profile");
  return data.data;
}

export async function updateProfile(payload: Record<string, unknown>) {
  const { data } = await api.put<ProfileResponse>("/profile", payload);
  return data.data;
}


