/**
 * Sistema de Cores Centralizado - Agenda+
 * 
 * Este arquivo define todas as cores usadas no sistema para garantir consistência.
 * Use estas constantes em vez de valores hardcoded.
 */

// Cor primária do sistema (Purple escolhido como padrão)
export const PRIMARY_COLORS = {
  50: 'purple-50',
  100: 'purple-100',
  200: 'purple-200',
  300: 'purple-300',
  400: 'purple-400',
  500: 'purple-500',
  600: 'purple-600',
  700: 'purple-700',
  800: 'purple-800',
  900: 'purple-900',
} as const;

// Cor secundária (Blue para ações secundárias)
export const SECONDARY_COLORS = {
  50: 'blue-50',
  100: 'blue-100',
  200: 'blue-200',
  300: 'blue-300',
  400: 'blue-400',
  500: 'blue-500',
  600: 'blue-600',
  700: 'blue-700',
  800: 'blue-800',
  900: 'blue-900',
} as const;

// Cores de status padronizadas
export const STATUS_COLORS = {
  PENDING: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    badge: 'bg-amber-50 text-amber-700',
  },
  CONFIRMED: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    badge: 'bg-emerald-50 text-emerald-700',
  },
  COMPLETED: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    badge: 'bg-blue-50 text-blue-700',
  },
  CANCELLED: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    badge: 'bg-rose-50 text-rose-700',
  },
  BLOCKED: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    badge: 'bg-slate-100 text-slate-600',
  },
} as const;

// Cores de fundo
export const BACKGROUND_COLORS = {
  primary: 'bg-white',
  secondary: 'bg-slate-50',
  tertiary: 'bg-slate-100',
  dark: 'bg-slate-900',
} as const;

// Cores de texto
export const TEXT_COLORS = {
  primary: 'text-slate-900',
  secondary: 'text-slate-600',
  tertiary: 'text-slate-500',
  inverse: 'text-white',
  link: `text-${PRIMARY_COLORS[600]}`,
  linkHover: `text-${PRIMARY_COLORS[700]}`,
} as const;

// Cores de borda
export const BORDER_COLORS = {
  default: 'border-slate-200',
  focus: `border-${PRIMARY_COLORS[500]}`,
  error: 'border-red-500',
  success: 'border-emerald-500',
} as const;

/**
 * Obtém classes de cor para um status específico
 */
export function getStatusColors(status: string) {
  const statusUpper = status.toUpperCase() as keyof typeof STATUS_COLORS;
  return STATUS_COLORS[statusUpper] || STATUS_COLORS.BLOCKED;
}

/**
 * Obtém classes de badge para um status
 */
export function getStatusBadgeClasses(status: string): string {
  const colors = getStatusColors(status);
  return `inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colors.badge}`;
}

