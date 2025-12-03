/**
 * Sistema de Animações - Agenda+
 * 
 * Animações e micro-interações padronizadas para toda a aplicação
 */

// ============================================
// ANIMAÇÕES DE ENTRADA
// ============================================
export const ANIMATIONS = {
  // Fade in
  fadeIn: 'animate-fade-in',
  fadeInUp: 'animate-fade-in-up',
  fadeInDown: 'animate-fade-in-down',
  
  // Slide
  slideInRight: 'animate-slide-in-right',
  slideInLeft: 'animate-slide-in-left',
  slideInUp: 'animate-slide-in-up',
  slideInDown: 'animate-slide-in-down',
  
  // Scale
  scaleIn: 'animate-scale-in',
  scaleUp: 'animate-scale-up',
  
  // Rotate
  rotateIn: 'animate-rotate-in',
  
  // Shimmer (loading)
  shimmer: 'animate-shimmer',
} as const;

// ============================================
// TRANSIÇÕES
// ============================================
export const TRANSITION_CLASSES = {
  // Transições suaves
  smooth: 'transition-all duration-200 ease-in-out',
  fast: 'transition-all duration-150 ease-out',
  slow: 'transition-all duration-300 ease-in-out',
  
  // Propriedades específicas
  colors: 'transition-colors duration-200 ease-in-out',
  transform: 'transition-transform duration-200 ease-in-out',
  opacity: 'transition-opacity duration-200 ease-in-out',
  shadow: 'transition-shadow duration-200 ease-in-out',
  
  // Hover effects
  hoverScale: 'hover:scale-105 transition-transform duration-200',
  hoverLift: 'hover:-translate-y-1 transition-transform duration-200',
  hoverShadow: 'hover:shadow-lg transition-shadow duration-200',
} as const;

// ============================================
// UTILITÁRIOS
// ============================================
export const ANIMATION_UTILS = {
  // Delay
  delay: {
    none: 'delay-0',
    fast: 'delay-75',
    base: 'delay-100',
    slow: 'delay-150',
  },
  
  // Duration
  duration: {
    fast: 'duration-150',
    base: 'duration-200',
    slow: 'duration-300',
    slower: 'duration-500',
  },
  
  // Easing
  easing: {
    linear: 'ease-linear',
    in: 'ease-in',
    out: 'ease-out',
    inOut: 'ease-in-out',
  },
} as const;

// ============================================
// HELPERS
// ============================================
export function getStaggerDelay(index: number, baseDelay = 50): string {
  return `animation-delay: ${index * baseDelay}ms`;
}

export function createFadeInSequence(count: number, baseDelay = 50): string[] {
  return Array.from({ length: count }, (_, i) => 
    `animate-fade-in` // Delay será aplicado via style inline
  );
}

