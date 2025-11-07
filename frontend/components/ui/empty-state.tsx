'use client';

import { HTMLAttributes } from "react";

import { clsx } from "clsx";

export function EmptyState({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center text-sm text-slate-500",
        className
      )}
      {...props}
    />
  );
}


