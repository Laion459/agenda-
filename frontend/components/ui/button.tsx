'use client';

import { Slot } from "@radix-ui/react-slot";
import { clsx } from "clsx";
import { ButtonHTMLAttributes, forwardRef, useState, useRef, useEffect } from "react";
import { Spinner } from "./spinner";
import { CheckCircle2, XCircle } from "lucide-react";
import { COMPONENT_TOKENS, TRANSITIONS, ELEVATION } from "@/constants/design-tokens";

const base = clsx(
  "inline-flex items-center justify-center",
  COMPONENT_TOKENS.button.radius,
  COMPONENT_TOKENS.button.padding,
  COMPONENT_TOKENS.button.fontSize,
  COMPONENT_TOKENS.button.fontWeight,
  TRANSITIONS.common.all,
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
  "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
  ELEVATION.focus
);

const variants: Record<string, string> = {
  primary: clsx(
    "bg-blue-600 text-white dark:bg-blue-500",
    "hover:bg-blue-700 hover:shadow-md dark:hover:bg-blue-600",
    "active:bg-blue-800 active:scale-[0.98] dark:active:bg-blue-700",
    "focus-visible:ring-blue-500"
  ),
  secondary: clsx(
    "bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-white",
    "hover:bg-slate-200 hover:shadow-sm dark:hover:bg-slate-600",
    "active:bg-slate-300 active:scale-[0.98] dark:active:bg-slate-500",
    "focus-visible:ring-slate-500"
  ),
  ghost: clsx(
    "bg-transparent text-slate-700 dark:text-slate-300",
    "hover:bg-slate-100 dark:hover:bg-slate-800",
    "active:bg-slate-200 active:scale-[0.98] dark:active:bg-slate-700",
    "focus-visible:ring-slate-500"
  ),
  outline: clsx(
    "bg-transparent border-2 border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-300",
    "hover:bg-slate-50 hover:border-slate-400 dark:hover:bg-slate-800 dark:hover:border-slate-500",
    "active:bg-slate-100 active:scale-[0.98] dark:active:bg-slate-700",
    "focus-visible:ring-slate-500"
  ),
  danger: clsx(
    "bg-red-600 text-white dark:bg-red-500",
    "hover:bg-red-700 hover:shadow-md dark:hover:bg-red-600",
    "active:bg-red-800 active:scale-[0.98] dark:active:bg-red-700",
    "focus-visible:ring-red-500"
  ),
};

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
  success?: boolean;
  error?: boolean;
  showRipple?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size: sizeProp = "md", asChild, loading, disabled, success, error, showRipple = true, children, onClick, ...props }, ref) => {
    const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const rippleIdRef = useRef(0);

    const isDisabled = disabled || loading || success;
    
    // Combinar refs
    const combinedRef = (node: HTMLButtonElement | null) => {
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
      buttonRef.current = node;
    };

    // Limpar estado de sucesso/erro após animação
    useEffect(() => {
      if (success || error) {
        const timer = setTimeout(() => {
          // Não limpar aqui, deixar o componente pai controlar
        }, 2000);
        return () => clearTimeout(timer);
      }
    }, [success, error]);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isDisabled) return;

      // Criar efeito ripple
      if (showRipple && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const id = rippleIdRef.current++;
        
        setRipples((prev) => [...prev, { id, x, y }]);
        
        // Remover ripple após animação
        setTimeout(() => {
          setRipples((prev) => prev.filter((r) => r.id !== id));
        }, 600);
      }

      onClick?.(e);
    };
    
    if (asChild) {
      return (
        <Slot
          className={clsx(base, variants[variant], sizes[sizeProp], className)}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    const buttonClasses = clsx(
      base,
      variants[variant],
      sizes[sizeProp],
      success && "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600",
      error && "bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600",
      "relative overflow-hidden",
      className
    );

    return (
      <button
        className={buttonClasses}
        ref={combinedRef}
        disabled={isDisabled}
        aria-busy={loading}
        onClick={handleClick}
        {...props}
      >
        {/* Ripple effect */}
        {showRipple && ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="absolute rounded-full bg-white/30 pointer-events-none animate-ripple"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: '20px',
              height: '20px',
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}

        {/* Loading state */}
        {loading && (
          <span className="mr-2 flex items-center">
            <Spinner size="sm" variant="white" />
          </span>
        )}

        {/* Success state */}
        {success && !loading && (
          <span className="mr-2 flex items-center animate-checkmark">
            <CheckCircle2 className="h-4 w-4" />
          </span>
        )}

        {/* Error state */}
        {error && !loading && (
          <span className="mr-2 flex items-center animate-shake">
            <XCircle className="h-4 w-4" />
          </span>
        )}

        {children}
      </button>
    );
  }
);
Button.displayName = "Button";


