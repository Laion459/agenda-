export interface ValidationErrors {
  [field: string]: string[] | string;
}

export function translateValidationError(
  field: string,
  errorMessage: string | string[]
): string {
  const message = Array.isArray(errorMessage) ? errorMessage[0] : errorMessage;
  
  if (message.includes('validation.unique (and') || message.includes('and more errors')) {
    if (field === 'email') {
      return 'Este e-mail já está cadastrado. Use outro e-mail ou faça login.';
    }
    if (field === 'cpf') {
      return 'Este CPF já está cadastrado no sistema.';
    }
    if (field === 'phone') {
      return 'Este telefone já está cadastrado no sistema.';
    }
    return 'Este valor já está cadastrado. Por favor, escolha outro.';
  }

  if (
    !message.includes('validation.') &&
    !message.includes('The ') &&
    !message.includes('has already been taken')
  ) {
    return message;
  }

  const fieldNames: Record<string, string> = {
    name: 'Nome completo',
    email: 'E-mail',
    phone: 'Telefone',
    password: 'Senha',
    cpf: 'CPF',
    birth_date: 'Data de nascimento',
    gender: 'Sexo',
    address: 'Endereço',
    city: 'Cidade',
    state: 'UF',
    confirm_password: 'Confirmação de senha',
    acceptTerms: 'Termos de uso',
    crm: 'CRM',
    specialty: 'Especialidade',
    crm_uf: 'UF do CRM',
  };

  const fieldName = fieldNames[field] || field;

  if (message.includes('validation.required')) {
    return `${fieldName} é obrigatório`;
  }

  if (message.includes('validation.unique') || message.includes('has already been taken')) {
    if (field === 'email') {
      return 'Este e-mail já está cadastrado. Use outro e-mail ou faça login.';
    }
    if (field === 'cpf') {
      return 'Este CPF já está cadastrado no sistema.';
    }
    if (field === 'phone') {
      return 'Este telefone já está cadastrado no sistema.';
    }
    return `${fieldName} já está em uso. Por favor, escolha outro.`;
  }

  if (message.includes('validation.email')) {
    return 'Digite um e-mail válido';
  }

  if (message.includes('validation.min.string')) {
    const match = message.match(/min:(\d+)/);
    const min = match ? match[1] : '8';
    if (field === 'password') {
      return `A senha deve ter no mínimo ${min} caracteres`;
    }
    return `${fieldName} deve ter no mínimo ${min} caracteres`;
  }

  if (message.includes('validation.max.string')) {
    const match = message.match(/max:(\d+)/);
    const max = match ? match[1] : '';
    return `${fieldName} deve ter no máximo ${max} caracteres`;
  }

  if (message.includes('validation.date')) {
    return 'Digite uma data válida';
  }

  if (message.includes('validation.before')) {
    if (message.includes('today')) {
      return 'A data de nascimento deve ser anterior a hoje';
    }
    return 'A data informada deve ser anterior à data especificada';
  }

  if (message.includes('validation.same')) {
    return 'As senhas não conferem';
  }

  if (message.includes('validation.in')) {
    return `${fieldName} selecionado é inválido`;
  }

  if (message.includes('validation.regex')) {
    return `${fieldName} está em formato inválido`;
  }

  if (message.includes('O CPF') || message.includes('CPF')) {
    return message;
  }

  return `${fieldName} inválido. Verifique o valor informado.`;
}

export function translateValidationErrors(
  errors: ValidationErrors
): Record<string, string> {
  const translated: Record<string, string> = {};

  for (const [field, errorMessage] of Object.entries(errors)) {
    translated[field] = translateValidationError(field, errorMessage);
  }

  return translated;
}

export function extractValidationErrors(
  error: unknown
): ValidationErrors | null {
  if (!error || typeof error !== 'object') {
    return null;
  }

  const axiosError = error as {
    response?: {
      data?: {
        errors?: ValidationErrors;
        message?: string;
      };
      status?: number;
    };
    isAxiosError?: boolean;
  };

  if (axiosError.response?.status === 422) {
    const responseData = axiosError.response.data;
    
    if (responseData?.errors && typeof responseData.errors === 'object') {
      const errors: ValidationErrors = {};
      for (const [key, value] of Object.entries(responseData.errors)) {
        if (Array.isArray(value)) {
          errors[key] = value;
        } else if (typeof value === 'string') {
          errors[key] = [value];
        } else {
          errors[key] = [String(value)];
        }
      }
      return errors;
    }
    
    if (responseData?.message && typeof responseData.message === 'string') {
      if (responseData.message.includes('validation')) {
        return null;
      }
    }
  }

  return null;
}

export function applyValidationErrors(
  errors: ValidationErrors,
  setError: (field: string, error: { type: string; message: string }) => void
): void {
  for (const [field, errorMessage] of Object.entries(errors)) {
    const translatedMessage = translateValidationError(field, errorMessage);
    const formField = mapBackendFieldToFormField(field);
    
    setError(formField, {
      type: 'validation',
      message: translatedMessage,
    });
  }
}

function mapBackendFieldToFormField(backendField: string): string {
  const fieldMap: Record<string, string> = {
    'user.email': 'email',
    'user.name': 'name',
    'user.phone': 'phone',
    'user.password': 'password',
    'patient.cpf': 'cpf',
    'patient.birth_date': 'birth_date',
    'patient.address': 'address',
    'patient.gender': 'gender',
    'patient.city': 'city',
    'patient.state': 'state',
  };

  if (backendField.includes('.')) {
    const parts = backendField.split('.');
    const lastPart = parts[parts.length - 1];
    
    if (fieldMap[backendField]) {
      return fieldMap[backendField];
    }
    
    return lastPart;
  }

  return fieldMap[backendField] || backendField;
}

