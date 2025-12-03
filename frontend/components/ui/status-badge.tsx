'use client';

import { clsx } from "clsx";
import { CheckCircle2, Clock, XCircle, Circle, AlertCircle } from "lucide-react";
import { getStatusBadgeClasses, getStatusColors } from "@/constants/colors";
import { COMPONENT_TOKENS, TRANSITIONS } from "@/constants/design-tokens";

interface StatusBadgeProps {
  status: string;
  className?: string;
  variant?: 'default' | 'dot' | 'icon';
  pulse?: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmada",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
  BLOCKED: "Bloqueada",
};

const STATUS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  PENDING: Clock,
  CONFIRMED: CheckCircle2,
  COMPLETED: CheckCircle2,
  CANCELLED: XCircle,
  BLOCKED: AlertCircle,
};

export function StatusBadge({ status, className, variant = 'default', pulse = false }: StatusBadgeProps) {
  const statusUpper = status.toUpperCase();
  const Icon = STATUS_ICONS[statusUpper];
  
  if (variant === 'dot') {
    const colors = getStatusColors(status);
    return (
      <span
        className={clsx(
          "inline-flex items-center gap-2",
          className
        )}
        role="status"
        aria-label={`Status: ${getStatusLabel(status)}`}
      >
        <span
          className={clsx(
            "h-2 w-2 rounded-full",
            colors.bg,
            pulse && "animate-pulse-slow"
          )}
          aria-hidden="true"
        />
        <span className={clsx(COMPONENT_TOKENS.badge.fontSize, colors.text)}>
          {getStatusLabel(status)}
        </span>
      </span>
    );
  }
  
  return (
    <span
      className={clsx(
        getStatusBadgeClasses(status),
        "inline-flex items-center gap-1.5",
        TRANSITIONS.common.all,
        pulse && "animate-pulse-slow",
        className
      )}
      role="status"
      aria-label={`Status: ${getStatusLabel(status)}`}
    >
      {variant === 'icon' && Icon && (
        <Icon className="h-3 w-3" aria-hidden="true" />
      )}
      {getStatusLabel(status)}
    </span>
  );
}

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status.toUpperCase()] ?? status;
}

export function getStatusColorClasses(status: string) {
  return getStatusColors(status);
}


