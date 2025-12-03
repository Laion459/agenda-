/**
 * Design Tokens Completo - Agenda+
 * 
 * Sistema centralizado de tokens de design para garantir
 * consistência visual e facilitar manutenção.
 */

// ============================================
// TIPOGRAFIA
// ============================================
export const TYPOGRAPHY = {
  // Tamanhos de fonte
  fontSize: {
    xs: 'text-xs',      // 12px
    sm: 'text-sm',      // 14px
    base: 'text-base',  // 16px
    lg: 'text-lg',      // 18px
    xl: 'text-xl',      // 20px
    '2xl': 'text-2xl',  // 24px
    '3xl': 'text-3xl',  // 30px
    '4xl': 'text-4xl',  // 36px
  },
  
  // Pesos de fonte
  fontWeight: {
    normal: 'font-normal',     // 400
    medium: 'font-medium',      // 500
    semibold: 'font-semibold', // 600
    bold: 'font-bold',          // 700
  },
  
  // Line heights
  lineHeight: {
    tight: 'leading-tight',    // 1.25
    normal: 'leading-normal',   // 1.5
    relaxed: 'leading-relaxed', // 1.75
  },
  
  // Escala de títulos
  heading: {
    h1: 'text-4xl font-bold leading-tight tracking-tight',
    h2: 'text-3xl font-bold leading-tight tracking-tight',
    h3: 'text-2xl font-semibold leading-tight',
    h4: 'text-xl font-semibold leading-tight',
    h5: 'text-lg font-semibold leading-normal',
    h6: 'text-base font-semibold leading-normal',
  },
  
  // Textos de corpo
  body: {
    large: 'text-lg leading-relaxed',
    base: 'text-base leading-normal',
    small: 'text-sm leading-normal',
    tiny: 'text-xs leading-normal',
  },
} as const;

// ============================================
// ESPAÇAMENTO
// ============================================
export const SPACING = {
  // Padding
  padding: {
    xs: 'p-1',    // 4px
    sm: 'p-2',    // 8px
    md: 'p-3',    // 12px
    base: 'p-4',  // 16px
    lg: 'p-6',    // 24px
    xl: 'p-8',    // 32px
    '2xl': 'p-12', // 48px
  },
  
  // Padding horizontal
  paddingX: {
    xs: 'px-1',
    sm: 'px-2',
    md: 'px-3',
    base: 'px-4',
    lg: 'px-6',
    xl: 'px-8',
  },
  
  // Padding vertical
  paddingY: {
    xs: 'py-1',
    sm: 'py-2',
    md: 'py-3',
    base: 'py-4',
    lg: 'py-6',
    xl: 'py-8',
  },
  
  // Margin
  margin: {
    xs: 'm-1',
    sm: 'm-2',
    md: 'm-3',
    base: 'm-4',
    lg: 'm-6',
    xl: 'm-8',
  },
  
  // Gap (para flex/grid)
  gap: {
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-3',
    base: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
    '2xl': 'gap-12',
  },
  
  // Espaçamento vertical (space-y)
  spaceY: {
    xs: 'space-y-1',
    sm: 'space-y-2',
    md: 'space-y-3',
    base: 'space-y-4',
    lg: 'space-y-6',
    xl: 'space-y-8',
    '2xl': 'space-y-12',
  },
  
  // Cards
  card: {
    padding: 'p-6',
    paddingCompact: 'p-4',
    paddingLoose: 'p-8',
    gap: 'gap-4',
  },
  
  // Seções
  section: {
    padding: 'p-6',
    gap: 'space-y-6',
    gapCompact: 'space-y-4',
    gapLoose: 'space-y-8',
  },
} as const;

// ============================================
// ELEVAÇÃO (SHADOWS)
// ============================================
export const ELEVATION = {
  none: 'shadow-none',
  sm: 'shadow-sm',           // 0 1px 2px 0
  base: 'shadow',             // 0 1px 3px 0
  md: 'shadow-md',            // 0 4px 6px -1px
  lg: 'shadow-lg',            // 0 10px 15px -3px
  xl: 'shadow-xl',            // 0 20px 25px -5px
  '2xl': 'shadow-2xl',        // 0 25px 50px -12px
  inner: 'shadow-inner',     // inset
  
  // Hover states
  hover: {
    sm: 'hover:shadow-md transition-shadow duration-200',
    md: 'hover:shadow-lg transition-shadow duration-200',
    lg: 'hover:shadow-xl transition-shadow duration-200',
  },
  
  // Focus states
  focus: 'focus:shadow-lg focus:shadow-purple-500/20',
} as const;

// ============================================
// BORDAS E CANTOS
// ============================================
export const BORDERS = {
  // Raio de borda
  radius: {
    none: 'rounded-none',
    sm: 'rounded-sm',      // 2px
    md: 'rounded-md',      // 6px
    base: 'rounded',       // 4px
    lg: 'rounded-lg',     // 8px
    xl: 'rounded-xl',      // 12px
    '2xl': 'rounded-2xl',  // 16px
    full: 'rounded-full',
  },
  
  // Largura de borda
  width: {
    none: 'border-0',
    thin: 'border',
    medium: 'border-2',
    thick: 'border-4',
  },
  
  // Estilo de borda
  style: {
    solid: 'border-solid',
    dashed: 'border-dashed',
    dotted: 'border-dotted',
  },
} as const;

// ============================================
// TRANSIÇÕES E ANIMAÇÕES
// ============================================
export const TRANSITIONS = {
  // Duração
  duration: {
    fast: 'duration-150',
    base: 'duration-200',
    slow: 'duration-300',
    slower: 'duration-500',
  },
  
  // Timing function
  easing: {
    linear: 'ease-linear',
    in: 'ease-in',
    out: 'ease-out',
    inOut: 'ease-in-out',
  },
  
  // Propriedades
  property: {
    all: 'transition-all',
    colors: 'transition-colors',
    transform: 'transition-transform',
    opacity: 'transition-opacity',
    shadow: 'transition-shadow',
  },
  
  // Combinações comuns
  common: {
    colors: 'transition-colors duration-200 ease-in-out',
    transform: 'transition-transform duration-200 ease-in-out',
    shadow: 'transition-shadow duration-200 ease-in-out',
    all: 'transition-all duration-200 ease-in-out',
  },
} as const;

// ============================================
// Z-INDEX
// ============================================
export const Z_INDEX = {
  base: 'z-0',
  dropdown: 'z-10',
  sticky: 'z-20',
  fixed: 'z-30',
  modalBackdrop: 'z-40',
  modal: 'z-50',
  popover: 'z-50',
  tooltip: 'z-50',
  notification: 'z-50',
} as const;

// ============================================
// CORES (melhoradas com contraste WCAG AA)
// ============================================
export const COLORS = {
  // Texto com melhor contraste
  text: {
    primary: 'text-slate-900',      // Contraste 15.3:1 em bg-white
    secondary: 'text-slate-700',      // Contraste 8.1:1 em bg-white (melhorado de slate-600)
    tertiary: 'text-slate-600',      // Contraste 5.7:1 em bg-white
    muted: 'text-slate-500',         // Para textos menos importantes
    inverse: 'text-white',
    link: 'text-purple-600 hover:text-purple-700',
    error: 'text-red-600',
    success: 'text-emerald-600',
    warning: 'text-amber-600',
  },
  
  // Backgrounds
  background: {
    primary: 'bg-white',
    secondary: 'bg-slate-50',
    tertiary: 'bg-slate-100',
    muted: 'bg-slate-200',
    dark: 'bg-slate-900',
    overlay: 'bg-black/50',
  },
  
  // Bordas
  border: {
    default: 'border-slate-200',
    muted: 'border-slate-300',
    focus: 'border-purple-500',
    error: 'border-red-500',
    success: 'border-emerald-500',
    warning: 'border-amber-500',
  },
} as const;

// ============================================
// OPACIDADE E BACKDROP
// ============================================
export const OPACITY = {
  // Opacidades para overlays e backgrounds
  overlay: {
    light: 'bg-black/10',
    medium: 'bg-black/30',
    dark: 'bg-black/50',
    darker: 'bg-black/70',
  },
  
  // Opacidades para elementos
  element: {
    disabled: 'opacity-50',
    hover: 'opacity-90',
    active: 'opacity-80',
  },
  
  // Backdrop blur
  backdrop: {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
  },
} as const;

// ============================================
// GRADIENTES
// ============================================
export const GRADIENTS = {
  // Gradientes sutis para backgrounds
  subtle: {
    blue: 'bg-gradient-to-br from-blue-50 to-blue-100/50',
    purple: 'bg-gradient-to-br from-purple-50 to-purple-100/50',
    emerald: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50',
    amber: 'bg-gradient-to-br from-amber-50 to-amber-100/50',
  },
  
  // Gradientes para overlays
  overlay: {
    dark: 'bg-gradient-to-b from-black/0 via-black/20 to-black/60',
    light: 'bg-gradient-to-b from-white/0 via-white/20 to-white/60',
  },
} as const;

// ============================================
// CORES SEMÂNTICAS EXPANDIDAS
// ============================================
export const SEMANTIC_COLORS = {
  // Info
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-600 dark:text-blue-400',
  },
  
  // Success
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: 'text-emerald-600 dark:text-emerald-400',
  },
  
  // Warning
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    icon: 'text-amber-600 dark:text-amber-400',
  },
  
  // Error
  error: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
    icon: 'text-red-600 dark:text-red-400',
  },
} as const;

// ============================================
// LOADING & SKELETON
// ============================================
export const LOADING = {
  skeleton: {
    base: 'bg-slate-200 dark:bg-slate-700',
    shimmer: 'bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700',
    animation: 'animate-shimmer bg-[length:200%_100%]',
  },
  
  spinner: {
    size: {
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-8 w-8',
    },
    color: 'text-blue-600 dark:text-blue-400',
  },
} as const;

// ============================================
// COMPONENTES ESPECÍFICOS
// ============================================
export const COMPONENT_TOKENS = {
  button: {
    padding: 'px-4 py-2',
    paddingLarge: 'px-6 py-3',
    paddingSmall: 'px-3 py-1.5',
    radius: 'rounded-md',
    fontSize: 'text-sm',
    fontWeight: 'font-medium',
    transition: TRANSITIONS.common.all,
    focus: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
  },
  
  input: {
    padding: 'px-3 py-2',
    radius: 'rounded-md',
    fontSize: 'text-sm',
    border: 'border border-slate-200 dark:border-slate-700',
    focus: 'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:focus:border-blue-400',
    error: 'border-red-500 focus:ring-red-500/20 dark:border-red-400',
    disabled: 'bg-slate-50 dark:bg-slate-800 cursor-not-allowed',
  },
  
  card: {
    padding: SPACING.card.padding,
    paddingCompact: SPACING.card.paddingCompact,
    paddingLoose: SPACING.card.paddingLoose,
    radius: BORDERS.radius.xl,
    border: 'border border-slate-200 dark:border-slate-700',
    shadow: ELEVATION.sm,
    shadowHover: ELEVATION.hover.md,
    interactive: 'cursor-pointer hover:shadow-md transition-all duration-200',
  },
  
  badge: {
    padding: 'px-2.5 py-0.5',
    radius: 'rounded-full',
    fontSize: 'text-xs',
    fontWeight: 'font-medium',
  },
  
  modal: {
    overlay: 'bg-black/50 backdrop-blur-sm',
    content: 'bg-white dark:bg-slate-800 rounded-xl shadow-2xl',
    padding: 'p-6',
  },
  
  tooltip: {
    bg: 'bg-slate-900 dark:bg-slate-800',
    text: 'text-white text-xs',
    padding: 'px-3 py-2',
    radius: 'rounded-lg',
    shadow: ELEVATION.lg,
  },
} as const;

