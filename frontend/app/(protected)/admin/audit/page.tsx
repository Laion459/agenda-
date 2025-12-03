'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { clsx } from "clsx";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { handleApiError } from "@/lib/handle-api-error";
import { exportActivityLogs, fetchActivityLogs } from "@/services/activity-log-service";
import { ActivityLog, PaginatedResponse } from "@/types";

interface Filters {
  search: string;
  user_id: string;
  per_page: number;
  page: number;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<ActivityLog>["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    user_id: "",
    per_page: 25,
    page: 1,
  });
  const [exporting, setExporting] = useState(false);

  const buildFilterParams = useCallback(() => {
    const params: Record<string, unknown> = {
      action: filters.search || undefined,
    };
    
    // Valida que user_id seja numérico antes de enviar
    if (filters.user_id && !isNaN(Number(filters.user_id))) {
      params.user_id = Number(filters.user_id);
    }
    
    return params;
  }, [filters.search, filters.user_id]);

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchActivityLogs({
        per_page: filters.per_page,
        page: filters.page,
        ...buildFilterParams(),
      });
      setLogs(response.data ?? []);
      setMeta(response.meta);
    } catch (error) {
      handleApiError(error, "Não foi possível carregar os logs de auditoria");
    } finally {
      setLoading(false);
    }
  }, [filters, buildFilterParams]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const handleFilterSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await loadLogs();
  };

  const paginationInfo = useMemo(() => {
    if (!meta) return "";
    return `Página ${meta.current_page} de ${meta.last_page} • ${meta.total} registros`;
  }, [meta]);

  const handleNextPage = () => {
    if (meta && filters.page < meta.last_page) {
      setFilters((prev) => ({ ...prev, page: prev.page + 1 }));
    }
  };

  const handlePrevPage = () => {
    if (filters.page > 1) {
      setFilters((prev) => ({ ...prev, page: prev.page - 1 }));
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await exportActivityLogs(buildFilterParams());
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `auditoria-${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Exportação gerada com sucesso.");
    } catch (error) {
      handleApiError(error, "Não foi possível exportar os logs");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Auditoria do sistema</CardTitle>
          <CardDescription>Histórico das principais ações realizadas pelos usuários.</CardDescription>
        </CardHeader>
        <form onSubmit={handleFilterSubmit} className="grid gap-4 p-6 pt-0 md:grid-cols-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="search">Filtrar por ação</Label>
            <Input
              id="search"
              placeholder="Ex.: POST admin/doctors"
              value={filters.search}
              onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user_id">ID do usuário</Label>
            <Input
              id="user_id"
              placeholder="Opcional"
              value={filters.user_id}
              onChange={(event) => setFilters((prev) => ({ ...prev, user_id: event.target.value }))}
            />
          </div>
          <div className="flex items-end gap-2">
            <Button type="submit" disabled={loading}>
              Aplicar
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                setFilters({
                  search: "",
                  user_id: "",
                  per_page: 25,
                  page: 1,
                })
              }
              disabled={loading}
            >
              Limpar
            </Button>
            <Button type="button" variant="outline" onClick={handleExport} disabled={exporting || loading}>
              Exportar
            </Button>
          </div>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Registros</CardTitle>
            <CardDescription>{paginationInfo}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrevPage} disabled={filters.page <= 1 || loading}>
              Anterior
            </Button>
            <Button
              variant="outline"
              onClick={handleNextPage}
              disabled={loading || (meta ? filters.page >= meta.last_page : true)}
            >
              Próxima
            </Button>
          </div>
        </CardHeader>
        <div className="max-h-[600px] overflow-y-auto border-t border-slate-200">
          {loading ? (
            <div className="space-y-3 p-6">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : logs.length === 0 ? (
            <EmptyState className="m-6">Nenhum registro encontrado.</EmptyState>
          ) : (
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Data</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Usuário</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Ação</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">IP</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Detalhes</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {logs.map((log, index) => (
                  <tr 
                    key={log.id}
                    className={clsx(
                      "hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-150",
                      index % 2 === 0 ? "bg-white dark:bg-slate-800" : "bg-slate-50/50 dark:bg-slate-800/50",
                      "animate-fade-in"
                    )}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                      {new Date(log.created_at).toLocaleString('pt-BR', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                      {log.user ? `${log.user.name} (${log.user.id})` : "Sistema"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300 font-medium">{log.action}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">{log.ip_address ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                      {log.route ? `Rota: ${log.route}` : ""}
                      <br />
                      {log.method ? `Método: ${log.method}` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}


