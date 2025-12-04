import axios, { AxiosError, AxiosResponse } from "axios";

import { getStoredToken } from "@/lib/auth-storage";

// Detecta automaticamente a URL da API baseado no ambiente
// No Codespace, usa a URL pública; localmente usa localhost
const getApiUrl = () => {
  // Se NEXT_PUBLIC_API_URL estiver definido, usa ele (prioridade máxima)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // No browser, detecta a URL baseado na origem atual
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    
    // Se estiver no Codespace (URL contém .app.github.dev ou .preview.app.github.dev)
    if (origin.includes('.app.github.dev') || origin.includes('.preview.app.github.dev')) {
      // No Codespace, as portas aparecem no subdomínio: -3000, -8000, etc.
      // Substitui -3000 por -8000 para acessar o backend
      const backendUrl = origin.replace(/-3000\./, '-8000.');
      return `${backendUrl}/api`;
    }
    
    // Se estiver em localhost (desenvolvimento local)
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return 'http://localhost:8000/api';
    }
    
    // Fallback: tenta usar a mesma origem com porta 8000
    return `${origin.replace(/:\d+$/, '')}:8000/api`;
  }
  
  // Fallback para SSR (server-side rendering) - será sobrescrito no cliente
  return 'http://localhost:8000/api';
};

// Função para obter a URL da API dinamicamente (sempre atualizada)
const getApiBaseUrl = (): string => {
  const apiUrl = getApiUrl();
  return apiUrl.endsWith("/api")
    ? apiUrl
    : `${apiUrl.replace(/\/$/, "")}/api`;
};

// Cria instância do axios
const api = axios.create({
  baseURL: typeof window !== 'undefined' ? getApiBaseUrl() : 'http://localhost:8000/api',
  timeout: 30000, // 30 segundos
});

// Interceptor de requisição - atualiza baseURL dinamicamente no cliente
api.interceptors.request.use(
  (config) => {
    // Atualiza baseURL no cliente para garantir URL correta
    if (typeof window !== 'undefined') {
      config.baseURL = getApiBaseUrl();
    }
    
    const token = getStoredToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de resposta
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Se a resposta é um blob, retorna diretamente
    if (response.config.responseType === 'blob') {
      return response;
    }
    return response;
  },
  (error: AxiosError) => {
    // Tratamento centralizado de erros
    const handledError = handleApiErrorResponse(error);
    
    // Garante que o erro tenha pelo menos uma mensagem
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
    
    // Preserva informações importantes do erro original de forma serializável
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
    
    // Se o erro é relacionado a blob, tenta converter
    if (error.config?.responseType === 'blob' && error.response?.data) {
      const blob = error.response.data instanceof Blob 
        ? error.response.data 
        : new Blob([String(error.response.data)], { type: 'application/json' });
      return Promise.reject({ ...enhancedError, blob });
    }
    
    return Promise.reject(enhancedError);
  }
);

/**
 * Trata erros da API de forma centralizada
 */
function handleApiErrorResponse(error: AxiosError): AxiosError {
  // Erro de rede (sem resposta do servidor)
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

  // Tratamento por status HTTP
  switch (status) {
    case 401:
      // Não autenticado - redirecionar para home
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
      // Erro de validação
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

/**
 * Extrai mensagens de erro de validação
 */
function extractValidationErrors(data: { errors?: Record<string, string | string[]> }): string | null {
  if (!data?.errors) return null;

  const errors = data.errors;
  const firstKey = Object.keys(errors)[0];
  if (!firstKey) return null;

  const value = errors[firstKey];
  return Array.isArray(value) ? value[0] : value;
}

export default api;
 
