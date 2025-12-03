'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { Download, FileJson, BarChart3, Filter, FileText, TrendingUp, Calendar, Users, ShieldCheck, CheckCircle2 } from "lucide-react";
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
import { clsx } from "clsx";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { handleApiError } from "@/lib/handle-api-error";
import { TYPOGRAPHY, COLORS, SPACING, TRANSITIONS, ELEVATION } from "@/constants/design-tokens";
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

  const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

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
        {/* Header Sofisticado */}
        <div className="animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className={clsx(TYPOGRAPHY.heading.h1, COLORS.text.primary)}>
                Relatórios
              </h1>
              <p className={clsx(TYPOGRAPHY.body.base, COLORS.text.secondary, "flex items-center gap-2 mt-1")}>
                <TrendingUp className="h-4 w-4 flex-shrink-0" />
                Análise completa dos indicadores operacionais
              </p>
            </div>
          </div>
        </div>

        {/* Filtros Elegantes */}
        <Card variant="interactive" className="border-l-4 border-l-purple-500 dark:border-l-purple-400">
          <CardHeader className="border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Filter className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle className={clsx(TYPOGRAPHY.heading.h4, COLORS.text.primary)}>
                  Filtros
                </CardTitle>
                <CardDescription className={clsx(TYPOGRAPHY.body.small, COLORS.text.secondary)}>
                  Selecione o período e tipo de relatório
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
            >
              <div className="space-y-2">
                <Label htmlFor="start_date" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  Data Inicial
                </Label>
                <Input id="start_date" type="date" {...register("start_date")} />
                {errors.start_date && <p className="text-xs text-red-500">{errors.start_date.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  Data Final
                </Label>
                <Input id="end_date" type="date" {...register("end_date")} />
                {errors.end_date && <p className="text-xs text-red-500">{errors.end_date.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="doctor_id" className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-slate-500" />
                  Médico
                </Label>
                <select
                  id="doctor_id"
                  className={clsx(
                    "w-full rounded-md border border-slate-200 dark:border-slate-700",
                    "bg-white dark:bg-slate-800 px-3 py-2 text-sm",
                    "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500",
                    "text-slate-900 dark:text-white",
                    TRANSITIONS.common.all
                  )}
                  {...register("doctor_id")}
                >
                  <option value="">Todos os médicos</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name} • {doctor.specialty}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-2">
                <Button type="submit" className="w-full">
                  <Filter className="h-4 w-4 mr-2" />
                  Aplicar
                </Button>
                <Button type="button" variant="outline" onClick={resetFilters} className="w-full">
                  Resetar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Botões de Exportação - Profissionais */}
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => exportReports("csv")}
            disabled={exporting || (!summary && doctorOccupancy.length === 0 && insuranceUsage.length === 0)}
            className="hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-300 dark:hover:border-emerald-700"
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => exportReports("json")}
            disabled={exporting || (!summary && doctorOccupancy.length === 0 && insuranceUsage.length === 0)}
            className="hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-300 dark:hover:border-purple-700"
          >
            <FileJson className="mr-2 h-4 w-4" />
            Exportar JSON
          </Button>
          <Button
            variant="primary"
            disabled={exporting || (!summary && doctorOccupancy.length === 0 && insuranceUsage.length === 0)}
            className="shadow-md hover:shadow-lg"
          >
            <FileText className="mr-2 h-4 w-4" />
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
          {/* Cards de Resumo - Elegantes */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card variant="interactive" className="border-l-4 border-l-blue-500 dark:border-l-blue-400 animate-fade-in">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className={clsx(TYPOGRAPHY.body.small, "font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300")}>
                    Total de consultas
                  </CardTitle>
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className={clsx(TYPOGRAPHY.heading.h2, "text-blue-900 dark:text-blue-100 mb-2")}>
                  {summary?.total ?? 0}
                </p>
                <p className={clsx(TYPOGRAPHY.body.small, "text-blue-700 dark:text-blue-400")}>
                  {summary
                    ? `${summary.start_date} a ${summary.end_date}`
                    : "Nenhum período carregado"}
                </p>
              </CardContent>
            </Card>
            {statusCards.map((card, index) => {
              const statusColors: Record<string, { border: string; icon: string; text: string }> = {
                'CONFIRMED': { border: 'border-l-emerald-500 dark:border-l-emerald-400', icon: 'text-emerald-600 dark:text-emerald-400', text: 'text-emerald-700 dark:text-emerald-300' },
                'PENDING': { border: 'border-l-amber-500 dark:border-l-amber-400', icon: 'text-amber-600 dark:text-amber-400', text: 'text-amber-700 dark:text-amber-300' },
                'CANCELLED': { border: 'border-l-red-500 dark:border-l-red-400', icon: 'text-red-600 dark:text-red-400', text: 'text-red-700 dark:text-red-300' },
                'COMPLETED': { border: 'border-l-blue-500 dark:border-l-blue-400', icon: 'text-blue-600 dark:text-blue-400', text: 'text-blue-700 dark:text-blue-300' },
              };
              const colors = statusColors[card.label] || { border: 'border-l-slate-500', icon: 'text-slate-600', text: 'text-slate-700' };
              return (
                <Card 
                  key={card.label} 
                  variant="interactive" 
                  className={clsx("border-l-4 animate-fade-in", colors.border)} 
                  style={{ animationDelay: `${(index + 1) * 50}ms` }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className={clsx(TYPOGRAPHY.body.small, "font-semibold uppercase tracking-wide", colors.text)}>
                        {card.label}
                      </CardTitle>
                      <div className={clsx("p-2 rounded-lg", colors.icon.includes('emerald') ? 'bg-emerald-100 dark:bg-emerald-900/30' : colors.icon.includes('amber') ? 'bg-amber-100 dark:bg-amber-900/30' : colors.icon.includes('red') ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30')}>
                        <CheckCircle2 className={clsx("h-4 w-4", colors.icon)} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className={clsx(TYPOGRAPHY.heading.h2, COLORS.text.primary, "mb-2")}>
                      {card.total}
                    </p>
                    <p className={clsx(TYPOGRAPHY.body.small, COLORS.text.secondary)}>
                      {card.percentage}% do total
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Resumo Executivo - Melhorado */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card variant="interactive" className="border-l-4 border-l-blue-500 dark:border-l-blue-400 animate-fade-in">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className={clsx(TYPOGRAPHY.heading.h5, COLORS.text.primary)}>
                    Total de Consultas
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className={clsx(TYPOGRAPHY.heading.h1, COLORS.text.primary, "mb-2")}>
                  {summary?.total || 0}
                </p>
                <p className={clsx(TYPOGRAPHY.body.small, COLORS.text.secondary)}>
                  No período selecionado
                </p>
              </CardContent>
            </Card>
            <Card variant="interactive" className="border-l-4 border-l-emerald-500 dark:border-l-emerald-400 animate-fade-in" style={{ animationDelay: '50ms' }}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                    <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <CardTitle className={clsx(TYPOGRAPHY.heading.h5, COLORS.text.primary)}>
                    Taxa de Comparecimento
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className={clsx(TYPOGRAPHY.heading.h1, "text-emerald-600 dark:text-emerald-400 mb-2")}>
                  {attendanceRate}%
                </p>
                <p className={clsx(TYPOGRAPHY.body.small, COLORS.text.secondary)}>
                  {summary?.by_status.COMPLETED?.total || 0} consultas concluídas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos Profissionais */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Consultas por Médico */}
            <Card variant="interactive" className="overflow-hidden">
              <CardHeader className="border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className={clsx(TYPOGRAPHY.heading.h4, COLORS.text.primary)}>
                      Consultas por Médico
                    </CardTitle>
                    <CardDescription className={clsx(TYPOGRAPHY.body.small, COLORS.text.secondary)}>
                      Distribuição por status (top 10 médicos)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {loading ? (
                  <Skeleton className="h-64 w-full" />
                ) : doctorChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={Math.max(300, doctorChartData.length * 40)}>
                    <BarChart 
                      data={doctorChartData} 
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
                      <XAxis 
                        type="number" 
                        stroke="#64748b"
                        className="dark:stroke-slate-400"
                        tick={{ fill: 'currentColor' }}
                      />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        width={100}
                        tick={{ fontSize: 12, fill: 'currentColor' }}
                        stroke="#64748b"
                        className="dark:stroke-slate-400"
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="Confirmadas" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Concluídas" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Canceladas" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState variant="no-data" title="Nenhum dado disponível" description="Não há dados de médicos para o período selecionado." />
                )}
              </CardContent>
            </Card>

            {/* Distribuição por Especialidade */}
            <Card variant="interactive" className="overflow-hidden">
              <CardHeader className="border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className={clsx(TYPOGRAPHY.heading.h4, COLORS.text.primary)}>
                      Distribuição por Especialidade
                    </CardTitle>
                    <CardDescription className={clsx(TYPOGRAPHY.body.small, COLORS.text.secondary)}>
                      Percentual de consultas por área médica
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
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
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {specialtyChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState variant="no-data" title="Nenhum dado disponível" description="Não há dados de especialidades para o período selecionado." />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Consultas por Convênio - Tabela Elegante */}
          <Card variant="interactive" className="overflow-hidden">
            <CardHeader className="border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <ShieldCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <CardTitle className={clsx(TYPOGRAPHY.heading.h4, COLORS.text.primary)}>
                    Consultas por Convênio
                  </CardTitle>
                  <CardDescription className={clsx(TYPOGRAPHY.body.small, COLORS.text.secondary)}>
                    Distribuição de consultas por plano de saúde
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : insuranceUsage.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className={clsx("px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider", COLORS.text.secondary)}>
                          Convênio
                        </th>
                        <th className={clsx("px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider", COLORS.text.secondary)}>
                          Número de Consultas
                        </th>
                        <th className={clsx("px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider", COLORS.text.secondary)}>
                          Percentual
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                      {insuranceUsage.map((item, index) => {
                        const percentage = summary?.total ? Math.round((item.total_appointments / summary.total) * 100 * 10) / 10 : 0;
                        return (
                          <tr 
                            key={item.health_insurance_id}
                            className={clsx(
                              "hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-150 hover:shadow-sm",
                              index % 2 === 0 ? "bg-white dark:bg-slate-800" : "bg-slate-50/50 dark:bg-slate-800/50",
                              "animate-fade-in"
                            )}
                            style={{ animationDelay: `${index * 30}ms` }}
                          >
                            <td className={clsx("px-6 py-4 whitespace-nowrap text-sm font-medium", COLORS.text.primary)}>
                              {item.name}
                            </td>
                            <td className={clsx("px-6 py-4 whitespace-nowrap text-sm", COLORS.text.secondary)}>
                              {item.total_appointments}
                            </td>
                            <td className={clsx("px-6 py-4 whitespace-nowrap text-sm font-semibold", COLORS.text.secondary)}>
                              {percentage}%
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 font-semibold border-t-2 border-slate-300 dark:border-slate-600">
                        <td className={clsx("px-6 py-4 whitespace-nowrap text-sm", COLORS.text.primary)}>Total</td>
                        <td className={clsx("px-6 py-4 whitespace-nowrap text-sm", COLORS.text.primary)}>
                          {insuranceUsage.reduce((sum, item) => sum + item.total_appointments, 0)}
                        </td>
                        <td className={clsx("px-6 py-4 whitespace-nowrap text-sm", COLORS.text.secondary)}>100%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState variant="no-data" title="Nenhum dado disponível" description="Não há dados de convênios para o período selecionado." />
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card variant="interactive" className="overflow-hidden">
              <CardHeader className="border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className={clsx(TYPOGRAPHY.heading.h4, COLORS.text.primary)}>
                      Resumo de Consultas
                    </CardTitle>
                    <CardDescription className={clsx(TYPOGRAPHY.body.small, COLORS.text.secondary)}>
                      {summary
                        ? `Período de ${summary.start_date} até ${summary.end_date}`
                        : "Sem dados no período"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {summary ? (
                  <div className="space-y-4">
                    <div className={clsx("p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800")}>
                      <p className={clsx(TYPOGRAPHY.body.small, COLORS.text.secondary, "mb-1")}>
                        Total de consultas
                      </p>
                      <p className={clsx(TYPOGRAPHY.heading.h2, "text-blue-900 dark:text-blue-100")}>
                        {summary.total}
                      </p>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {Object.entries(summary.by_status).map(([status, info], idx) => (
                        <div 
                          key={status} 
                          className={clsx(
                            "rounded-lg border-2 p-4 transition-all duration-200 hover:shadow-md",
                            "border-slate-200 dark:border-slate-700",
                            "bg-white dark:bg-slate-800",
                            "animate-fade-in"
                          )}
                          style={{ animationDelay: `${idx * 50}ms` }}
                        >
                          <p className={clsx(TYPOGRAPHY.body.small, "uppercase font-semibold mb-1", COLORS.text.secondary)}>
                            {status}
                          </p>
                          <p className={clsx(TYPOGRAPHY.heading.h3, COLORS.text.primary)}>
                            {info.total}
                          </p>
                          <p className={clsx(TYPOGRAPHY.body.small, COLORS.text.secondary)}>
                            {info.percentage}% do total
                          </p>
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className={clsx(TYPOGRAPHY.body.small, "font-semibold uppercase mb-3", COLORS.text.secondary)}>
                        Tendência diária (últimos 14 dias)
                      </p>
                      {summary.trend.length === 0 ? (
                        <p className={clsx(TYPOGRAPHY.body.small, COLORS.text.secondary)}>
                          Sem registros no período.
                        </p>
                      ) : (
                        <div className="mt-3 flex h-32 items-end gap-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4">
                          {summary.trend.slice(-14).map((item, idx) => {
                            const max = Math.max(...summary.trend.map((trend) => trend.total)) || 1;
                            const height = Math.max((item.total / max) * 100, 4);
                            return (
                              <div key={item.date} className="group flex flex-col items-center flex-1">
                                <div
                                  className={clsx(
                                    "w-full rounded-t bg-gradient-to-t from-blue-500 to-blue-400",
                                    "transition-all duration-200 group-hover:from-blue-600 group-hover:to-blue-500",
                                    "shadow-sm group-hover:shadow-md"
                                  )}
                                  style={{ height: `${height}%` }}
                                />
                                <span className="mt-2 hidden text-[10px] font-semibold text-slate-600 dark:text-slate-400 group-hover:block">
                                  {item.total}
                                </span>
                                <span className="mt-1 text-[9px] text-slate-500 dark:text-slate-500">
                                  {new Date(item.date).getDate()}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <EmptyState variant="no-data" title="Nenhum dado disponível" description="Não há dados para o período informado." />
                )}
              </CardContent>
            </Card>

            <Card variant="interactive" className="overflow-hidden">
              <CardHeader className="border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <ShieldCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <CardTitle className={clsx(TYPOGRAPHY.heading.h4, COLORS.text.primary)}>
                      Uso de Convênios
                    </CardTitle>
                    <CardDescription className={clsx(TYPOGRAPHY.body.small, COLORS.text.secondary)}>
                      Convênios mais utilizados no período
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {insuranceUsage.length === 0 ? (
                  <EmptyState variant="no-data" title="Nenhum convênio registrado" description="Não há dados de convênios para o período selecionado." />
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className={clsx("px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider", COLORS.text.secondary)}>
                            Convênio
                          </th>
                          <th className={clsx("px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider", COLORS.text.secondary)}>
                            Consultas
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                        {insuranceUsage.map((item, index) => (
                          <tr 
                            key={item.health_insurance_id}
                            className={clsx(
                              "hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-150",
                              index % 2 === 0 ? "bg-white dark:bg-slate-800" : "bg-slate-50/50 dark:bg-slate-800/50",
                              "animate-fade-in"
                            )}
                            style={{ animationDelay: `${index * 30}ms` }}
                          >
                            <td className={clsx("px-4 py-3 text-sm font-medium", COLORS.text.primary)}>
                              {item.name}
                            </td>
                            <td className={clsx("px-4 py-3 text-sm text-right font-semibold", COLORS.text.primary)}>
                              {item.total_appointments}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card variant="interactive" className="overflow-hidden">
            <CardHeader className="border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <CardTitle className={clsx(TYPOGRAPHY.heading.h4, COLORS.text.primary)}>
                    Ocupação por Médico
                  </CardTitle>
                  <CardDescription className={clsx(TYPOGRAPHY.body.small, COLORS.text.secondary)}>
                    Engajamento e volume de consultas por profissional
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {doctorOccupancy.length === 0 ? (
                <EmptyState variant="no-data" title="Nenhuma consulta registrada" description="Não há dados de ocupação para os filtros informados." />
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                  <table className="w-full min-w-[600px]">
                    <thead className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className={clsx("px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider", COLORS.text.secondary)}>
                          Médico
                        </th>
                        <th className={clsx("px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider", COLORS.text.secondary)}>
                          Consultas
                        </th>
                        <th className={clsx("px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider", COLORS.text.secondary)}>
                          Confirmadas
                        </th>
                        <th className={clsx("px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider", COLORS.text.secondary)}>
                          Concluídas
                        </th>
                        <th className={clsx("px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider", COLORS.text.secondary)}>
                          Ocupação (%)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                      {doctorOccupancy.map((item, index) => (
                        <tr 
                          key={item.doctor_id}
                          className={clsx(
                            "hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-150 hover:shadow-sm",
                            index % 2 === 0 ? "bg-white dark:bg-slate-800" : "bg-slate-50/50 dark:bg-slate-800/50",
                            "animate-fade-in"
                          )}
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
                          <td className={clsx("px-6 py-4 text-sm font-medium", COLORS.text.primary)}>
                            {item.doctor_name}
                          </td>
                          <td className={clsx("px-6 py-4 text-sm text-right font-semibold", COLORS.text.primary)}>
                            {item.total_appointments}
                          </td>
                          <td className={clsx("px-6 py-4 text-sm text-right", COLORS.text.secondary)}>
                            {item.confirmed}
                          </td>
                          <td className={clsx("px-6 py-4 text-sm text-right", COLORS.text.secondary)}>
                            {item.completed}
                          </td>
                          <td className={clsx("px-6 py-4 text-sm text-right font-semibold", COLORS.text.secondary)}>
                            {item.occupancy_rate}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
      </div>
    </AdminLayout>
  );
}


