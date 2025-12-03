'use client';

import { HTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'white';
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

const variantClasses = {
  primary: 'text-blue-600 dark:text-blue-400',
  secondary: 'text-slate-600 dark:text-slate-400',
  white: 'text-white',
};

export function Spinner({ size = 'md', variant = 'primary', className, ...props }: SpinnerProps) {
  return (
    <div
      className={clsx(
        'animate-spin rounded-full border-2 border-current border-t-transparent',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      role="status"
      aria-label="Carregando"
      {...props}
    >
      <span className="sr-only">Carregando...</span>
    </div>
  );
}

