'use client';

import { HTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";
import { Inbox } from "lucide-react";
import { TYPOGRAPHY, COLORS, SPACING } from "@/constants/design-tokens";

interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode;
  title?: string;
  description?: string;
}

type EmptyStateVariant = 'default' | 'error' | 'loading' | 'no-data';

export function EmptyState({
  className,
  icon,
  title,
  description,
  children,
  ...props
}: EmptyStateProps & { variant?: EmptyStateVariant }) {
  const variant = (props as { variant?: EmptyStateVariant }).variant || 'default';
  
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-8 text-center",
        "animate-fade-in",
        variant === 'error' && "border-red-200 bg-red-50/60 dark:border-red-800 dark:bg-red-900/20",
        variant === 'loading' && "border-slate-200 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-800/60",
        variant === 'no-data' && "border-slate-200 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-800/60",
        variant === 'default' && "border-slate-200 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-800/60",
        className
      )}
      role="status"
      aria-live="polite"
      {...props}
    >
      {icon || (
        <div className={clsx(
          "p-3 rounded-full transition-transform duration-200",
          variant === 'error' && "bg-red-100 dark:bg-red-900/30",
          variant === 'loading' && "bg-slate-100 dark:bg-slate-700",
          (variant === 'no-data' || variant === 'default') && "bg-slate-100 dark:bg-slate-700"
        )}>
          <Inbox className={clsx(
            "h-6 w-6",
            variant === 'error' && "text-red-500 dark:text-red-400",
            variant !== 'error' && "text-slate-400 dark:text-slate-500"
          )} aria-hidden="true" />
        </div>
      )}
      {title && (
        <h3 className={clsx(
          TYPOGRAPHY.heading.h5,
          variant === 'error' ? "text-red-700 dark:text-red-300" : COLORS.text.primary
        )}>
          {title}
        </h3>
      )}
      {description && (
        <p className={clsx(
          TYPOGRAPHY.body.small,
          variant === 'error' ? "text-red-600 dark:text-red-400" : COLORS.text.secondary,
          "max-w-sm"
        )}>
          {description}
        </p>
      )}
      {children}
    </div>
  );
}


