'use client';

import { clsx } from "clsx";
import { HTMLAttributes } from "react";

interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  progress: number; // 0-100
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'error' | 'warning';
  animated?: boolean;
}

const sizeClasses = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

const variantClasses = {
  default: 'bg-blue-500',
  success: 'bg-emerald-500',
  error: 'bg-red-500',
  warning: 'bg-amber-500',
};

export function ProgressBar({
  progress,
  showLabel = false,
  size = 'md',
  variant = 'default',
  animated = true,
  className,
  ...props
}: ProgressBarProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={clsx("w-full", className)} {...props}>
      <div className={clsx(
        "w-full rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700",
        sizeClasses[size]
      )}>
        <div
          className={clsx(
            "h-full rounded-full transition-all duration-300 ease-out",
            variantClasses[variant],
            animated && "animate-progress"
          )}
          style={{ width: `${clampedProgress}%` }}
          role="progressbar"
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progresso: ${clampedProgress}%`}
        />
      </div>
      {showLabel && (
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 text-center">
          {clampedProgress}%
        </p>
      )}
    </div>
  );
}

