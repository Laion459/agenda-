'use client';

import { clsx } from "clsx";
import { getStatusBadgeClasses, getStatusColors } from "@/constants/colors";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmada",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
  BLOCKED: "Bloqueada",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={clsx(getStatusBadgeClasses(status), className)}
      role="status"
      aria-label={`Status: ${getStatusLabel(status)}`}
    >
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


