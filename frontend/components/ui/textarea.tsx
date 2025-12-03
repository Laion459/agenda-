'use client';

import { forwardRef, TextareaHTMLAttributes } from "react";
import { AlertCircle } from "lucide-react";
import { clsx } from "clsx";
import { COMPONENT_TOKENS, TRANSITIONS } from "@/constants/design-tokens";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: boolean;
  errorMessage?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, errorMessage, id, ...props }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = errorMessage ? `${textareaId}-error` : undefined;

    return (
      <div className="w-full">
        <div className="relative">
          <textarea
            ref={ref}
            id={textareaId}
            className={clsx(
              "w-full min-h-[100px] resize-y",
              COMPONENT_TOKENS.input.radius,
              COMPONENT_TOKENS.input.padding,
              COMPONENT_TOKENS.input.fontSize,
              "text-slate-900 dark:text-white",
              "bg-white dark:bg-slate-800",
              COMPONENT_TOKENS.input.border,
              "dark:border-slate-700",
              TRANSITIONS.common.all,
              error
                ? clsx(COMPONENT_TOKENS.input.error, "pr-10")
                : COMPONENT_TOKENS.input.focus,
              "placeholder:text-slate-400 dark:placeholder:text-slate-500",
              "disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed dark:disabled:bg-slate-800 dark:disabled:text-slate-600",
              className
            )}
            aria-invalid={error}
            aria-describedby={errorId}
            {...props}
          />
          {error && (
            <AlertCircle
              className="absolute right-3 top-3 h-4 w-4 text-red-500 pointer-events-none"
              aria-hidden="true"
            />
          )}
        </div>
        {errorMessage && (
          <p
            id={errorId}
            className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1 animate-fade-in"
            role="alert"
          >
            <AlertCircle className="h-3 w-3 flex-shrink-0" />
            <span>{errorMessage}</span>
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";


