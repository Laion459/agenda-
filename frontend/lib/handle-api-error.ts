import toast from "react-hot-toast";

type ApiError = {
  response?: {
    data?: { message?: string; errors?: Record<string, string[] | string> };
  };
};

export function handleApiError(error: ApiError, fallback = "Ocorreu um erro inesperado.") {
  const message =
    error?.response?.data?.message ||
    extractFirstError(error?.response?.data?.errors) ||
    fallback;

  toast.error(message);
}

function extractFirstError(errors?: Record<string, string[] | string>) {
  if (!errors) return null;
  const firstKey = Object.keys(errors)[0];
  if (!firstKey) return null;
  const value = errors[firstKey];
  return Array.isArray(value) ? value[0] : value;
}


