import toast from "react-hot-toast";
import { errorHandler } from "./error-handler";

/**
 * Trata erros da API e exibe notificação toast
 * 
 * @param error - Erro a ser tratado
 * @param fallback - Mensagem padrão caso não seja possível extrair mensagem
 */
export function handleApiError(error: unknown, fallback = "Ocorreu um erro inesperado.") {
  // Log detalhado em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    // Serializa o erro de forma segura
    const errorInfo: Record<string, unknown> = {
      type: error?.constructor?.name || typeof error,
    };
    
    if (error && typeof error === 'object') {
      const errorObj = error as Record<string, unknown>;
      
      errorInfo.hasResponse = !!errorObj.response;
      errorInfo.hasRequest = !!errorObj.request;
      errorInfo.hasMessage = !!errorObj.message;
      
      // Extrai informações do response
      if (errorObj.response) {
        const response = errorObj.response as Record<string, unknown>;
        errorInfo.responseStatus = response.status;
        errorInfo.responseStatusText = response.statusText;
        
        // Tenta serializar response.data de forma segura
        if (response.data) {
          try {
            const dataStr = JSON.stringify(response.data, (key, val) => {
              if (typeof val === 'function') return '[Function]';
              if (val instanceof Error) return { message: val.message, name: val.name };
              if (val instanceof Date) return val.toISOString();
              return val;
            });
            errorInfo.responseData = JSON.parse(dataStr);
          } catch (e) {
            errorInfo.responseData = String(response.data);
            errorInfo.responseDataError = String(e);
          }
        }
      }
      
      if (errorObj.message) {
        errorInfo.message = errorObj.message;
      }
      
      if (errorObj.config) {
        const config = errorObj.config as Record<string, unknown>;
        errorInfo.requestUrl = config.url;
        errorInfo.requestMethod = config.method;
        if (config.data) {
          try {
            errorInfo.requestData = typeof config.data === 'string' 
              ? JSON.parse(config.data) 
              : config.data;
          } catch {
            errorInfo.requestData = String(config.data);
          }
        }
      }
      
      // Tenta extrair todas as propriedades do erro
      const allProps = Object.getOwnPropertyNames(errorObj);
      if (allProps.length > 0) {
        errorInfo.allProperties = allProps;
      }
    } else if (error) {
      errorInfo.errorString = String(error);
    }
    
    // Garante que sempre há algo para logar
    if (Object.keys(errorInfo).length === 1) {
      errorInfo.errorString = String(error);
      errorInfo.errorType = typeof error;
    }
    
    console.error('[handleApiError] Erro recebido:', errorInfo);
  }
  
  // Usa o sistema centralizado de tratamento de erros
  errorHandler.handle(error, "API Error");
  
  const message = errorHandler.getErrorMessage(error) || fallback;
  
  // Se for erro de autenticação, não mostra toast (já redireciona)
  if (errorHandler.isAuthError(error)) {
    return;
  }
  
  toast.error(message);
}

/**
 * Extrai primeira mensagem de erro de validação
 * @deprecated Use errorHandler.getValidationErrors() ou errorHandler.getErrorMessage()
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _extractFirstError(errors?: Record<string, string[] | string>) {
  if (!errors) return null;
  const firstKey = Object.keys(errors)[0];
  if (!firstKey) return null;
  const value = errors[firstKey];
  return Array.isArray(value) ? value[0] : value;
}


