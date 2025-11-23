'use client';

import { LabelHTMLAttributes } from "react";

import { clsx } from "clsx";

type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

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


