/**
 * Sistema centralizado de tratamento de erros
 * 
 * Fornece funções utilitárias para tratamento consistente de erros
 * em toda a aplicação
 */

export type ApiError = {
  response?: {
    status?: number;
    data?: {
      message?: string;
      errors?: Record<string, string[] | string>;
    };
  };
  message?: string;
  code?: string;
};

export interface ErrorHandler {
  handle(error: unknown, context?: string): void;
  getErrorMessage(error: unknown): string;
  isNetworkError(error: unknown): boolean;
  isValidationError(error: unknown): boolean;
  isAuthError(error: unknown): boolean;
}

/**
 * Classe para tratamento centralizado de erros
 */
export class AppErrorHandler implements ErrorHandler {
  private defaultMessage = "Ocorreu um erro inesperado.";

  /**
   * Trata um erro e executa ações apropriadas
   */
  handle(error: unknown, context?: string): void {
    const apiError = error as ApiError;
    const message = this.getErrorMessage(error);

    // Log do erro para monitoramento
    if (process.env.NODE_ENV === 'development') {
      const errorDetails: Record<string, unknown> = {
        message,
      };

      // Adiciona informações adicionais apenas se estiverem disponíveis
      if (apiError?.response?.status) {
        errorDetails.status = apiError.response.status;
      }

      if (apiError?.response?.data) {
        errorDetails.responseData = apiError.response.data;
      }

      if (apiError?.message && apiError.message !== message) {
        errorDetails.originalMessage = apiError.message;
      }

      if (apiError?.code) {
        errorDetails.code = apiError.code;
      }

      // Captura informações do erro Axios de forma mais robusta
      if (error && typeof error === 'object') {
        // Tenta extrair propriedades do erro Axios
        const errorObj = error as Record<string, unknown>;
        
        if (errorObj.response) {
          errorDetails.response = {
            status: (errorObj.response as Record<string, unknown>)?.status,
            data: (errorObj.response as Record<string, unknown>)?.data,
            headers: (errorObj.response as Record<string, unknown>)?.headers,
          };
        }
        
        if (errorObj.request) {
          errorDetails.request = errorObj.request;
        }
        
        if (errorObj.config) {
          errorDetails.config = {
            url: (errorObj.config as Record<string, unknown>)?.url,
            method: (errorObj.config as Record<string, unknown>)?.method,
            data: (errorObj.config as Record<string, unknown>)?.data,
          };
        }
        
        // Se ainda não tem propriedades úteis, tenta serializar o erro completo
        if (Object.keys(errorDetails).length === 1) {
          try {
            errorDetails.errorString = JSON.stringify(error, Object.getOwnPropertyNames(error));
          } catch {
            errorDetails.errorString = String(error);
          }
        }
      } else if (error) {
        errorDetails.errorString = String(error);
      }

      // Serializa o erro de forma segura para evitar objetos vazios
      const serializedDetails: Record<string, unknown> = {};
      
      for (const [key, value] of Object.entries(errorDetails)) {
        try {
          // Tenta serializar cada valor
          if (value === null || value === undefined) {
            serializedDetails[key] = value;
          } else if (typeof value === 'object') {
            // Para objetos, tenta serializar de forma segura
            try {
              const serialized = JSON.parse(JSON.stringify(value, (k, v) => {
                // Remove propriedades circulares e funções
                if (typeof v === 'function') return '[Function]';
                if (v instanceof Error) return { message: v.message, name: v.name, stack: v.stack };
                if (v instanceof Date) return v.toISOString();
                // Remove propriedades que podem causar problemas
                if (k === 'config' && typeof v === 'object') {
                  const config = v as Record<string, unknown>;
                  return {
                    url: config.url,
                    method: config.method,
                    baseURL: config.baseURL,
                    headers: config.headers,
                  };
                }
                return v;
              }));
              // Só adiciona se não for objeto vazio
              if (serialized && typeof serialized === 'object' && Object.keys(serialized).length > 0) {
                serializedDetails[key] = serialized;
              } else if (value && typeof value === 'object') {
                // Se não conseguiu serializar, tenta extrair propriedades diretamente
                const obj = value as Record<string, unknown>;
                const extracted: Record<string, unknown> = {};
                for (const [k, v] of Object.entries(obj)) {
                  if (v !== null && v !== undefined && typeof v !== 'function') {
                    try {
                      extracted[k] = typeof v === 'object' ? JSON.parse(JSON.stringify(v)) : v;
                    } catch {
                      extracted[k] = String(v);
                    }
                  }
                }
                if (Object.keys(extracted).length > 0) {
                  serializedDetails[key] = extracted;
                }
              }
            } catch {
              serializedDetails[key] = String(value);
            }
          } else {
            serializedDetails[key] = value;
          }
        } catch {
          serializedDetails[key] = String(value);
        }
      }
      
      // Se ainda estiver vazio, tenta extrair informações do erro original
      if (Object.keys(serializedDetails).length === 0 && error) {
        try {
          if (error instanceof Error) {
            serializedDetails.error = {
              name: error.name,
              message: error.message,
              stack: error.stack,
            };
          } else if (typeof error === 'object') {
            const errorObj = error as Record<string, unknown>;
            
            // Tenta extrair propriedades diretamente
            for (const [k, v] of Object.entries(errorObj)) {
              if (k !== 'config' && k !== 'request' && v !== null && v !== undefined) {
                try {
                  if (typeof v === 'object' && v !== null) {
                    // Para objetos, tenta serializar recursivamente
                    const serialized = JSON.parse(JSON.stringify(v, (key, val) => {
                      if (typeof val === 'function') return '[Function]';
                      if (val instanceof Error) return { message: val.message, name: val.name };
                      if (val instanceof Date) return val.toISOString();
                      return val;
                    }));
                    if (serialized && Object.keys(serialized).length > 0) {
                      serializedDetails[k] = serialized;
                    }
                  } else {
                    serializedDetails[k] = v;
                  }
                } catch {
                  serializedDetails[k] = String(v);
                }
              }
            }
            
            // Se ainda estiver vazio, tenta usar Object.getOwnPropertyNames
            if (Object.keys(serializedDetails).length === 0) {
              const props = Object.getOwnPropertyNames(errorObj);
              for (const prop of props) {
                try {
                  const value = (errorObj as Record<string, unknown>)[prop];
                  if (value !== null && value !== undefined && prop !== 'config' && prop !== 'request') {
                    serializedDetails[prop] = typeof value === 'object' 
                      ? JSON.parse(JSON.stringify(value)) 
                      : value;
                  }
                } catch {
                  // Ignora propriedades que não podem ser serializadas
                }
              }
            }
          }
        } catch (e) {
          serializedDetails.errorString = String(error);
          serializedDetails.serializationError = String(e);
        }
      }
      
      // Se ainda estiver vazio, adiciona pelo menos informações básicas
      if (Object.keys(serializedDetails).length === 0) {
        serializedDetails.errorType = typeof error;
        serializedDetails.errorString = String(error);
        serializedDetails.hasError = error !== null && error !== undefined;
        
        // Tenta extrair informações básicas mesmo que a serialização tenha falhado
        if (error && typeof error === 'object') {
          try {
            serializedDetails.constructorName = error.constructor?.name;
            serializedDetails.properties = Object.getOwnPropertyNames(error);
            
            // Tenta pegar message diretamente
            if ('message' in error) {
              serializedDetails.message = String((error as { message: unknown }).message);
            }
            
            // Tenta pegar stack diretamente
            if ('stack' in error) {
              serializedDetails.stack = String((error as { stack: unknown }).stack).split('\n').slice(0, 3);
            }
          } catch (e) {
            serializedDetails.extractionError = String(e);
          }
        }
      }
      
      // Loga de forma que sempre mostre algo útil
      console.error(`[Error Handler] ${context || 'Erro'}:`, serializedDetails);
      
      // Se serializedDetails estiver vazio, loga o erro diretamente
      if (Object.keys(serializedDetails).length === 0 || (Object.keys(serializedDetails).length === 1 && serializedDetails.errorType === 'object')) {
        console.error(`[Error Handler] ${context || 'Erro'} (fallback):`, error);
        console.error(`[Error Handler] String do erro:`, String(error));
        console.error(`[Error Handler] Tipo do erro:`, typeof error);
        if (error && typeof error === 'object') {
          console.error(`[Error Handler] Propriedades do erro:`, Object.getOwnPropertyNames(error));
        }
      }
    }

    // Em produção, enviar para serviço de monitoramento (Sentry, etc.)
    // if (process.env.NODE_ENV === 'production') {
    //   Sentry.captureException(error, { tags: { context } });
    // }
  }

  /**
   * Extrai mensagem de erro amigável
   */
  getErrorMessage(error: unknown): string {
    const apiError = error as ApiError;

    // Erro de validação
    if (this.isValidationError(error)) {
      const validationMsg = this.extractValidationMessage(apiError);
      if (validationMsg && validationMsg !== "Dados inválidos.") {
        return validationMsg;
      }
    }

    // Mensagem do servidor
    if (apiError.response?.data) {
      const data = apiError.response.data as { message?: string; error?: string; errors?: Record<string, unknown> };
      if (data.message) {
        return data.message;
      }
      if (data.error) {
        return data.error;
      }
    }

    // Mensagem do erro
    if (apiError.message) {
      return apiError.message;
    }

    // Tenta extrair mensagem de erro genérico
    if (error && typeof error === 'object') {
      const errorObj = error as Record<string, unknown>;
      if (errorObj.message && typeof errorObj.message === 'string') {
        return errorObj.message;
      }
    }

    return this.defaultMessage;
  }

  /**
   * Verifica se é erro de rede
   */
  isNetworkError(error: unknown): boolean {
    const apiError = error as ApiError;
    return !apiError.response && !!apiError.message;
  }

  /**
   * Verifica se é erro de validação (422)
   */
  isValidationError(error: unknown): boolean {
    const apiError = error as ApiError;
    return apiError.response?.status === 422;
  }

  /**
   * Verifica se é erro de autenticação (401/403)
   */
  isAuthError(error: unknown): boolean {
    const apiError = error as ApiError;
    const status = apiError.response?.status;
    return status === 401 || status === 403;
  }

  /**
   * Extrai primeira mensagem de validação
   */
  private extractValidationMessage(error: ApiError): string {
    const errors = error.response?.data?.errors;
    if (!errors) return "Dados inválidos.";

    const firstKey = Object.keys(errors)[0];
    if (!firstKey) return "Dados inválidos.";

    const value = errors[firstKey];
    return Array.isArray(value) ? value[0] : value;
  }

  /**
   * Extrai todas as mensagens de validação
   */
  getValidationErrors(error: unknown): Record<string, string> {
    const apiError = error as ApiError;
    const errors = apiError.response?.data?.errors;
    if (!errors) return {};

    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(errors)) {
      result[key] = Array.isArray(value) ? value[0] : value;
    }
    return result;
  }
}

// Instância singleton
export const errorHandler = new AppErrorHandler();

/**
 * Hook helper para uso em componentes
 */
export function useErrorHandler() {
  return {
    handle: (error: unknown, context?: string) => errorHandler.handle(error, context),
    getMessage: (error: unknown) => errorHandler.getErrorMessage(error),
    isNetwork: (error: unknown) => errorHandler.isNetworkError(error),
    isValidation: (error: unknown) => errorHandler.isValidationError(error),
    isAuth: (error: unknown) => errorHandler.isAuthError(error),
    getValidationErrors: (error: unknown) => errorHandler.getValidationErrors(error),
  };
}

