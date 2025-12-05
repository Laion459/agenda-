import { translateValidationError } from '@/lib/validation-error-translator';

interface ErrorMessageProps {
  field: string;
  error?: { message?: string };
  className?: string;
}

export function ErrorMessage({ field, error, className = 'text-xs text-red-500' }: ErrorMessageProps) {
  if (!error?.message) {
    return null;
  }

  const originalMessage = error.message;
  const msgLower = originalMessage.toLowerCase();
  const isTechnicalMessage = 
    originalMessage.includes('validation.unique') ||
    originalMessage.includes('validation.unique (and') ||
    (originalMessage.includes('(and ') && originalMessage.includes('errors')) ||
    originalMessage.includes('and more errors') ||
    originalMessage.includes('and 4 more') ||
    originalMessage.includes('and 3 more') ||
    originalMessage.includes('and 5 more') ||
    originalMessage.includes('validation.') ||
    msgLower.includes('validation') ||
    originalMessage.match(/validation\.\w+/i) !== null;
  
  if (isTechnicalMessage) {
    const fieldTranslations: Record<string, string> = {
      email: 'Este e-mail já está cadastrado. Use outro e-mail ou faça login.',
      cpf: 'Este CPF já está cadastrado no sistema.',
      phone: 'Este telefone já está cadastrado no sistema.',
      name: 'Este nome já está cadastrado.',
      password: 'A senha não atende aos requisitos.',
      birth_date: 'A data de nascimento informada é inválida.',
      gender: 'Selecione uma opção válida.',
      address: 'O endereço informado é inválido.',
      city: 'A cidade informada é inválida.',
      state: 'Selecione uma UF válida.',
      confirm_password: 'As senhas não conferem.',
      acceptTerms: 'Você deve aceitar os termos de uso.',
    };
    
    if (fieldTranslations[field]) {
      return <p className={className}>{fieldTranslations[field]}</p>;
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
    };
    
    return (
      <p className={className}>
        {fieldNames[field] || field}: Verifique o valor informado
      </p>
    );
  }

  const translatedMessage = translateValidationError(field, originalMessage);
  return <p className={className}>{translatedMessage}</p>;
}

