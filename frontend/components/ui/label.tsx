'use client';

import { LabelHTMLAttributes } from "react";

import { clsx } from "clsx";

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {}

export function Label({ className, ...props }: LabelProps) {
  return (
    <label
      className={clsx(
        "text-sm font-medium text-slate-700",
        className
      )}
      {...props}
    />
  );
}


