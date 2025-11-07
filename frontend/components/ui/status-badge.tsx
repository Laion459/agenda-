'use client';

import { clsx } from "clsx";

interface StatusBadgeProps {
  status: string;
}

const STATUS_CLASSES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  CONFIRMED: "bg-emerald-50 text-emerald-700",
  COMPLETED: "bg-blue-50 text-blue-700",
  CANCELLED: "bg-rose-50 text-rose-700",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmada",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
        STATUS_CLASSES[status] ?? "bg-slate-100 text-slate-600"
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}


