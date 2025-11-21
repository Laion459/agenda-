import axios from "axios";

import { getStoredToken } from "@/lib/auth-storage";

const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const normalizedBaseUrl = rawBaseUrl.endsWith("/api")
  ? rawBaseUrl
  : `${rawBaseUrl.replace(/\/$/, "")}/api`;

const api = axios.create({
  baseURL: normalizedBaseUrl,
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de resposta para garantir que blobs sejam tratados corretamente
api.interceptors.response.use(
  (response) => {
    // Se a resposta é um blob, retorna diretamente
    if (response.config.responseType === 'blob') {
      return response;
    }
    return response;
  },
  (error) => {
    // Se o erro é relacionado a blob, tenta converter
    if (error.config?.responseType === 'blob' && error.response?.data) {
      const blob = error.response.data instanceof Blob 
        ? error.response.data 
        : new Blob([error.response.data], { type: 'application/json' });
      return Promise.reject({ ...error, blob });
    }
    return Promise.reject(error);
  }
);

export default api;
 
