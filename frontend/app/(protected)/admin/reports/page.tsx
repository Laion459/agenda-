'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { Download, FileJson } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { formatDate } from "@/lib/date-utils";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";

// Importação dinâmica do recharts para evitar problemas com Turbopack em dev
const BarChart = dynamic(() => import("recharts").then((mod) => mod.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then((mod) => mod.Bar), { ssr: false });
const PieChart = dynamic(() => import("recharts").then((mod) => mod.PieChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then((mod) => mod.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then((mod) => mod.Cell), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((mod) => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), { ssr: false });
const Legend = dynamic(() => import("recharts").then((mod) => mod.Legend), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((mod) => mod.ResponsiveContainer), { ssr: false });

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { handleApiError } from "@/lib/handle-api-error";
import { fetchAdminDoctors } from "@/services/admin-doctor-service";
import {
  DoctorOccupancyItem,
  InsuranceUsageItem,
  fetchAppointmentSummary,
  fetchDoctorOccupancy,
  fetchInsuranceUsage,
  AppointmentSummary,
} from "@/services/report-service";
import { Doctor } from "@/types";

const filtersSchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  doctor_id: z.string().optional(),
});

type FilterForm = z.infer<typeof filtersSchema>;

export default function AdminReportsPage() {
  const [summary, setSummary] = useState<AppointmentSummary | null>(null);
  const [doctorOccupancy, setDoctorOccupancy] = useState<DoctorOccupancyItem[]>([]);
  const [insuranceUsage, setInsuranceUsage] = useState<InsuranceUsageItem[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FilterForm>({
    resolver: zodResolver(filtersSchema),
    defaultValues: {
      start_date: formatDate(new Date().setMonth(new Date().getMonth() - 1), "yyyy-MM-dd"),
      end_date: formatDate(new Date(), "yyyy-MM-dd"),
      doctor_id: "",
    },
  });

  const loadReports = useCallback(async (filters?: FilterForm) => {
    try {
      setLoading(true);
      const [summaryData, occupancyData, insuranceData] = await Promise.all([
        fetchAppointmentSummary(filters),
        fetchDoctorOccupancy(filters),
        fetchInsuranceUsage(filters),
      ]);

      // Log para debug (apenas em desenvolvimento)
      if (process.env.NODE_ENV === 'development') {
        console.log('[Reports] Dados carregados:', {
          summary: summaryData,
          occupancy: occupancyData,
          filters,
        });
      }

      setSummary(summaryData);
      setDoctorOccupancy(occupancyData);
      setInsuranceUsage(insuranceData);
    } catch (error) {
      handleApiError(error, "Não foi possível carregar os relatórios");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function initialize() {
      try {
        const doctorResponse = await fetchAdminDoctors({ per_page: 100 });
        setDoctors(doctorResponse.data ?? []);
      } catch {
        toast.error("Não foi possível carregar a lista de médicos");
      }

      await loadReports({
        start_date: formatDate(new Date().setMonth(new Date().getMonth() - 1), "yyyy-MM-dd"),
        end_date: formatDate(new Date(), "yyyy-MM-dd"),
      });
    }

    void initialize();
  }, [loadReports]);

  const onSubmit = async (values: FilterForm) => {
    const payload = {
      start_date: values.start_date || undefined,
      end_date: values.end_date || undefined,
      doctor_id: values.doctor_id || undefined,
    };

    await loadReports(payload);
  };

  const resetFilters = () => {
    const defaults = {
      start_date: formatDate(new Date().setMonth(new Date().getMonth() - 1), "yyyy-MM-dd"),
      end_date: formatDate(new Date(), "yyyy-MM-dd"),
      doctor_id: "",
    };
    reset(defaults);
    void loadReports(defaults);
  };

  const statusCards = useMemo(() => {
    if (!summary) return [];
    return Object.entries(summary.by_status).map(([status, info]) => ({
      label: status,
      total: info.total,
      percentage: info.percentage,
    }));
  }, [summary]);

  const downloadFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const exportReports = async (type: "csv" | "json") => {
    try {
      setExporting(true);
      const payload: Record<string, unknown> = {
        summary,
        doctorOccupancy,
        insuranceUsage,
        generated_at: new Date().toISOString(),
      };

      if (type === "json") {
        const blob = new Blob([JSON.stringify(payload, null, 2)], {
          type: "application/json;charset=utf-8",
        });
        downloadFile(blob, `relatorio-agenda-${Date.now()}.json`);
        toast.success("Exportação JSON gerada.");
        return;
      }

      const rows: string[] = [];
      rows.push("Sessão;Coluna;Valor");
      if (summary) {
        rows.push(`Consultas;Total;${summary.total}`);
        Object.entries(summary.by_status).forEach(([status, info]) => {
          rows.push(`Consultas ${status};Total;${info.total}`);
          rows.push(`Consultas ${status};Percentual;${info.percentage}`);
        });
      }
      doctorOccupancy.forEach((item) => {
        rows.push(
          `Médicos;${item.doctor_name};${item.total_appointments}|${item.confirmed}|${item.completed}|${item.occupancy_rate}`,
        );
      });
      insuranceUsage.forEach((item) => {
        rows.push(`Convênios;${item.name};${item.total_appointments}`);
      });

      const blob = new Blob([rows.join("\n")], {
        type: "text/csv;charset=utf-8",
      });
      downloadFile(blob, `relatorio-agenda-${Date.now()}.csv`);
      toast.success("Exportação CSV gerada.");
    } catch (error) {
      handleApiError(error, "Não foi possível gerar a exportação");
    } finally {
      setExporting(false);
    }
  };

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  // Preparar dados para gráficos - filtrar médicos com consultas e mostrar mais
  const doctorChartData = useMemo(() => {
    // Filtrar apenas médicos que têm consultas no período
    const doctorsWithAppointments = doctorOccupancy
      .filter((doc) => doc.total_appointments > 0)
      .sort((a, b) => b.total_appointments - a.total_appointments) // Ordenar por total de consultas
      .slice(0, 10); // Mostrar até 10 médicos
    
    return doctorsWithAppointments.map((doc) => {
      // Calcular canceladas: total - confirmadas - concluídas, ou usar cancelled se disponível
      const cancelled = doc.cancelled ?? (doc.total_appointments - doc.confirmed - doc.completed);
      
      return {
        name: doc.doctor_name.length > 20 
          ? doc.doctor_name.split(' ').slice(-2).join(' ') // Últimos 2 nomes se muito longo
          : doc.doctor_name,
        Confirmadas: doc.confirmed,
        Canceladas: Math.max(0, cancelled), // Garantir que não seja negativo
        Concluídas: doc.completed,
      };
    });
  }, [doctorOccupancy]);

  const specialtyChartData = useMemo(() => {
    // Agrupar por especialidade usando dados reais dos médicos
    const specialtyMap: Record<string, number> = {};
    
    // Buscar especialidades dos médicos que têm consultas
    doctorOccupancy.forEach((doc) => {
      const doctor = doctors.find(d => d.id === doc.doctor_id);
      if (doctor && doctor.specialty) {
        const specialty = doctor.specialty;
        specialtyMap[specialty] = (specialtyMap[specialty] || 0) + doc.total_appointments;
      }
    });
    
    // Calcular total para percentuais
    const total = Object.values(specialtyMap).reduce((sum, count) => sum + count, 0);
    
    // Converter para array e ordenar por quantidade
    return Object.entries(specialtyMap)
      .map(([name, value]) => ({
        name,
        value,
        percentage: total > 0 ? Math.round((value / total) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Limita a 10 especialidades
  }, [doctorOccupancy, doctors]);

  // Calcular taxa de comparecimento baseada em dados reais
  const attendanceRate = useMemo(() => {
    if (!summary) return 0;
    const completed = summary.by_status.COMPLETED?.total || 0;
    const total = summary.total || 0;
    return total > 0 ? Math.round((completed / total) * 100 * 10) / 10 : 0;
  }, [summary]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Relatórios</h1>
          <p className="text-sm text-slate-600 mt-1">Análise completa dos indicadores operacionais</p>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Selecione o período e tipo de relatório</CardDescription>
          </CardHeader>
          <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-4 p-6 pt-0 md:grid-cols-2 lg:grid-cols-4"
        >
          <div className="space-y-2">
            <Label htmlFor="start_date">De</Label>
            <Input id="start_date" type="date" {...register("start_date")} />
            {errors.start_date && <p className="text-xs text-red-500">{errors.start_date.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="end_date">Até</Label>
            <Input id="end_date" type="date" {...register("end_date")} />
            {errors.end_date && <p className="text-xs text-red-500">{errors.end_date.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="doctor_id">Médico</Label>
            <select
              id="doctor_id"
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register("doctor_id")}
            >
              <option value="">Todos</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name} • {doctor.specialty}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <Button type="submit">Aplicar filtros</Button>
            <Button type="button" variant="ghost" onClick={resetFilters}>
              Resetar
            </Button>
          </div>
        </form>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            variant="secondary"
            onClick={() => exportReports("csv")}
            disabled={exporting || (!summary && doctorOccupancy.length === 0 && insuranceUsage.length === 0)}
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
          <Button
            variant="secondary"
            onClick={() => exportReports("json")}
            disabled={exporting || (!summary && doctorOccupancy.length === 0 && insuranceUsage.length === 0)}
          >
            <FileJson className="mr-2 h-4 w-4" />
            Exportar JSON
          </Button>
          <Button
            variant="default"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
        </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-blue-200 bg-blue-50/60">
              <div className="space-y-1 p-4">
                <p className="text-xs font-semibold uppercase text-blue-700">Total de consultas</p>
                <p className="text-2xl font-bold text-blue-900">{summary?.total ?? 0}</p>
                <p className="text-xs text-blue-700">
                  Período:{" "}
                  {summary
                    ? `${summary.start_date} a ${summary.end_date}`
                    : "Nenhum período carregado"}
                </p>
              </div>
            </Card>
            {statusCards.map((card) => (
              <Card key={card.label}>
                <div className="space-y-1 p-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">{card.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{card.total}</p>
                  <p className="text-xs text-slate-500">{card.percentage}% do total</p>
                </div>
              </Card>
            ))}
          </div>

          {/* Resumo Executivo */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <p className="text-sm font-medium text-slate-600 mb-1">Total de Consultas</p>
                <p className="text-3xl font-bold text-slate-900">{summary?.total || 0}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <p className="text-sm font-medium text-slate-600 mb-1">Taxa de Comparecimento</p>
                <p className="text-3xl font-bold text-slate-900">{attendanceRate}%</p>
                <p className="text-xs text-slate-500 mt-1">
                  {summary?.by_status.COMPLETED?.total || 0} consultas concluídas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Consultas por Médico */}
            <Card>
              <CardHeader>
                <CardTitle>Consultas por Médico</CardTitle>
                <CardDescription>Distribuição de consultas por status (máximo 10 médicos com mais consultas)</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-64 w-full" />
                ) : doctorChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={Math.max(300, doctorChartData.length * 40)}>
                    <BarChart 
                      data={doctorChartData} 
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        width={100}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Confirmadas" stackId="a" fill="#3b82f6" />
                      <Bar dataKey="Concluídas" stackId="a" fill="#10b981" />
                      <Bar dataKey="Canceladas" stackId="a" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState>Nenhum dado disponível</EmptyState>
                )}
              </CardContent>
            </Card>

            {/* Distribuição por Especialidade */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Especialidade</CardTitle>
                <CardDescription>Percentual de consultas por área médica</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-64 w-full" />
                ) : specialtyChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={specialtyChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {specialtyChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState>Nenhum dado disponível</EmptyState>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Consultas por Convênio */}
          <Card>
            <CardHeader>
              <CardTitle>Consultas por Convênio</CardTitle>
              <CardDescription>Distribuição de consultas por plano de saúde</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : insuranceUsage.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Convênio</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Número de Consultas</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentual</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {insuranceUsage.map((item) => {
                        const percentage = summary?.total ? Math.round((item.total_appointments / summary.total) * 100 * 10) / 10 : 0;
                        return (
                          <tr key={item.health_insurance_id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.total_appointments}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {percentage}%
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-gray-50 font-semibold">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Total</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {insuranceUsage.reduce((sum, item) => sum + item.total_appointments, 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">100%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState>Nenhum dado disponível</EmptyState>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Resumo de consultas</CardTitle>
                <CardDescription>
                  {summary
                    ? `Período de ${summary.start_date} até ${summary.end_date}`
                    : "Sem dados no período"}
                </CardDescription>
              </CardHeader>
              <div className="space-y-3 p-6 pt-0">
                {summary ? (
                  <>
                    <p className="text-sm text-slate-600">
                      Total de consultas:{" "}
                      <span className="font-semibold text-slate-900">{summary.total}</span>
                    </p>
                    <div className="grid gap-3 md:grid-cols-2">
                      {Object.entries(summary.by_status).map(([status, info]) => (
                        <div key={status} className="rounded-md border border-slate-200 p-3">
                          <p className="text-xs uppercase text-slate-500">{status}</p>
                          <p className="text-lg font-semibold text-slate-900">{info.total}</p>
                          <p className="text-xs text-slate-500">{info.percentage}%</p>
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-500">Tendência diária</p>
                      {summary.trend.length === 0 ? (
                        <p className="text-xs text-slate-500">Sem registros no período.</p>
                      ) : (
                        <div className="mt-3 flex h-24 items-end gap-1">
                          {summary.trend.slice(-14).map((item) => {
                            const max = Math.max(...summary.trend.map((trend) => trend.total)) || 1;
                            const height = Math.max((item.total / max) * 100, 4);
                            return (
                              <div key={item.date} className="group flex flex-col items-center">
                                <div
                                  className="w-3 rounded-t bg-blue-500 transition-colors group-hover:bg-blue-600"
                                  style={{ height: `${height}%` }}
                                />
                                <span className="mt-1 hidden text-[10px] text-slate-500 group-hover:block">
                                  {item.total}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <EmptyState className="border-none bg-transparent p-0">
                    Nenhum dado disponível para o período informado.
                  </EmptyState>
                )}
              </div>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Uso de convênios</CardTitle>
                <CardDescription>Convênios mais utilizados nas consultas do período.</CardDescription>
              </CardHeader>
              <div className="p-6 pt-0">
                {insuranceUsage.length === 0 ? (
                  <EmptyState className="border-none bg-transparent p-0">
                    Nenhum convênio registrado no período.
                  </EmptyState>
                ) : (
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="text-xs uppercase text-slate-500">
                      <tr>
                        <th className="py-2">Convênio</th>
                        <th className="py-2 text-right">Consultas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {insuranceUsage.map((item) => (
                        <tr key={item.health_insurance_id} className="border-t border-slate-200">
                          <td className="py-2">{item.name}</td>
                          <td className="py-2 text-right font-medium text-slate-900">
                            {item.total_appointments}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Ocupação por médico</CardTitle>
              <CardDescription>
                Conferir engajamento e volume de consultas por profissional no período.
              </CardDescription>
            </CardHeader>
            <div className="p-6 pt-0">
              {doctorOccupancy.length === 0 ? (
                <EmptyState className="border-none bg-transparent p-0">
                  Nenhuma consulta registrada para os filtros informados.
                </EmptyState>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-left text-sm text-slate-600">
                    <thead className="text-xs uppercase text-slate-500">
                      <tr>
                        <th className="py-2">Médico</th>
                        <th className="py-2 text-right">Consultas</th>
                        <th className="py-2 text-right">Confirmadas</th>
                        <th className="py-2 text-right">Concluídas</th>
                        <th className="py-2 text-right">Ocupação (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {doctorOccupancy.map((item) => (
                        <tr key={item.doctor_id} className="border-t border-slate-200">
                          <td className="py-2">{item.doctor_name}</td>
                          <td className="py-2 text-right font-medium text-slate-900">
                            {item.total_appointments}
                          </td>
                          <td className="py-2 text-right">{item.confirmed}</td>
                          <td className="py-2 text-right">{item.completed}</td>
                          <td className="py-2 text-right">{item.occupancy_rate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        </>
      )}
      </div>
    </AdminLayout>
  );
}


