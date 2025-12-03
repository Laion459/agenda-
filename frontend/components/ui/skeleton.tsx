'use client';

import { HTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circle' | 'rectangle';
}

export function Skeleton({ className, variant = 'rectangle', ...props }: SkeletonProps) {
  const baseClasses = clsx(
    "bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%]",
    "animate-shimmer",
    "dark:from-slate-700 dark:via-slate-600 dark:to-slate-700"
  );

  const variantClasses = {
    text: "h-4 rounded",
    circle: "rounded-full aspect-square",
    rectangle: "rounded-md",
  };

  return (
    <div
      className={clsx(baseClasses, variantClasses[variant], className)}
      aria-busy="true"
      aria-label="Carregando..."
      {...props}
    />
  );
}
