import axios, { AxiosError, AxiosResponse } from "axios";

import { getStoredToken } from "@/lib/auth-storage";

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (!config.baseURL || config.baseURL.includes('3000')) {
      config.baseURL = 'http://localhost:8000/api';
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response: AxiosResponse) => {
    if (response.config.responseType === 'blob') {
      return response;
    }
    return response;
  },
  (error: AxiosError) => {
    const handledError = handleApiErrorResponse(error);
    
    if (!handledError.message) {
      if (error.response?.data) {
        const data = error.response.data as { message?: string; errors?: Record<string, unknown> };
        handledError.message = data.message || 'Erro ao processar requisição';
      } else if (error.message) {
        handledError.message = error.message;
      } else {
        handledError.message = 'Erro desconhecido ao processar requisição';
      }
    }
    
    const enhancedError = {
      ...handledError,
      name: handledError.name || 'AxiosError',
      message: handledError.message,
      stack: handledError.stack,
      response: error.response ? {
        ...error.response,
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      } : undefined,
      request: error.request,
      config: error.config ? {
        ...error.config,
        url: error.config.url,
        method: error.config.method,
        baseURL: error.config.baseURL,
      } : undefined,
    } as AxiosError;
    
    if (error.config?.responseType === 'blob' && error.response?.data) {
      const blob = error.response.data instanceof Blob 
        ? error.response.data 
        : new Blob([String(error.response.data)], { type: 'application/json' });
      return Promise.reject({ ...enhancedError, blob });
    }
    
    return Promise.reject(enhancedError);
  }
);

function handleApiErrorResponse(error: AxiosError): AxiosError {
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      error.message = 'Tempo de requisição excedido. Tente novamente.';
    } else if (error.request) {
      error.message = 'Erro de conexão. Verifique sua internet.';
    } else {
      error.message = 'Erro inesperado ao processar requisição.';
    }
    return error;
  }

  const status = error.response.status;
  const data = error.response.data as { message?: string; errors?: Record<string, string | string[]> };

  switch (status) {
    case 401:
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
      error.message = data?.message || 'Sessão expirada. Faça login novamente.';
      break;

    case 403:
      error.message = data?.message || 'Você não tem permissão para realizar esta ação.';
      break;

    case 404:
      error.message = data?.message || 'Recurso não encontrado.';
      break;

    case 422:
      const validationErrors = extractValidationErrors(data);
      error.message = validationErrors || data?.message || 'Dados inválidos. Verifique os campos.';
      break;

    case 429:
      error.message = 'Muitas requisições. Aguarde um momento e tente novamente.';
      break;

    case 500:
    case 502:
    case 503:
      error.message = 'Erro no servidor. Tente novamente mais tarde.';
      break;

    default:
      error.message = data?.message || 'Erro inesperado. Tente novamente.';
  }

  return error;
}

function extractValidationErrors(data: { errors?: Record<string, string | string[]> }): string | null {
  if (!data?.errors) return null;

  const errors = data.errors;
  const firstKey = Object.keys(errors)[0];
  if (!firstKey) return null;

  const value = errors[firstKey];
  return Array.isArray(value) ? value[0] : value;
}

export default api;
 
