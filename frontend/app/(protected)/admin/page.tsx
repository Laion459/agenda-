'use client';

import { useEffect, useState } from "react";
import {
  Calendar,
  Stethoscope,
  Users,
  FileText,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  TrendingUp,
  BarChart3,
  Activity,
  ShieldCheck,
} from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import dynamic from "next/dynamic";
import { TYPOGRAPHY, COLORS, SPACING, TRANSITIONS, ELEVATION } from "@/constants/design-tokens";

// Importação dinâmica do recharts para evitar problemas com Turbopack em dev
const LineChart = dynamic(() => import("recharts").then((mod) => mod.LineChart), { ssr: false });
const Line = dynamic(() => import("recharts").then((mod) => mod.Line), { ssr: false });
const BarChart = dynamic(() => import("recharts").then((mod) => mod.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then((mod) => mod.Bar), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((mod) => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), { ssr: false });
const Legend = dynamic(() => import("recharts").then((mod) => mod.Legend), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((mod) => mod.ResponsiveContainer), { ssr: false });

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { clsx } from "clsx";
import {
  DashboardStats,
  RecentActivity,
  MonthlyAppointments,
  SpecialtyDistribution,
  fetchDashboardStats,
  fetchRecentActivities,
  fetchMonthlyAppointments,
  fetchSpecialtyDistribution,
} from "@/services/admin-dashboard-service";
import { handleApiError } from "@/lib/handle-api-error";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyAppointments[]>([]);
  const [specialtyData, setSpecialtyData] = useState<SpecialtyDistribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsData, activitiesData, monthlyDataData, specialtyDataData] = await Promise.all([
          fetchDashboardStats(),
          fetchRecentActivities(),
          fetchMonthlyAppointments(),
          fetchSpecialtyDistribution(),
        ]);

        setStats(statsData);
        setActivities(activitiesData);
        setMonthlyData(monthlyDataData);
        setSpecialtyData(specialtyDataData);
      } catch (error) {
        handleApiError(error, "Falha ao carregar dados do dashboard");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const getActivityIcon = (icon: string) => {
    switch (icon) {
      case 'check':
        return <CheckCircle2 className="h-5 w-5" />;
      case 'users':
        return <Users className="h-5 w-5" />;
      case 'trending-up':
        return <TrendingUp className="h-5 w-5" />;
      case 'x':
        return <XCircle className="h-5 w-5" />;
      default:
        return <CheckCircle2 className="h-5 w-5" />;
    }
  };

  const getActivityColor = (color: string) => {
    switch (color) {
      case 'green':
        return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'blue':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
      case 'orange':
        return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400';
      case 'red':
        return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Resumo Administrativo' }]} />
      
      {/* Header Sofisticado */}
      <section className="animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className={clsx(TYPOGRAPHY.heading.h1, COLORS.text.primary)}>
              Resumo Administrativo
            </h1>
            <p className={clsx(TYPOGRAPHY.body.base, COLORS.text.secondary, "flex items-center gap-2 mt-1")}>
              <Activity className="h-4 w-4 flex-shrink-0" />
              Visão geral do sistema e métricas principais
            </p>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total de Consultas */}
          <Card variant="interactive" className="border-l-4 border-l-blue-500 dark:border-l-blue-400 animate-fade-in">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Total de Consultas</CardTitle>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg transition-transform duration-200 hover:scale-110">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-10 w-24" />
              ) : (
                <>
                  <p className={clsx(TYPOGRAPHY.heading.h2, "text-slate-900 dark:text-white mb-2")}>
                    {stats?.total_appointments || 0}
                  </p>
                  <p className={clsx(TYPOGRAPHY.body.small, COLORS.text.secondary, "mb-3")}>
                    {stats?.appointments_today || 0} hoje • {stats?.appointments_this_month || 0} este mês
                  </p>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 w-fit">
                    <ArrowUpRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className={clsx(TYPOGRAPHY.body.small, "text-emerald-600 dark:text-emerald-400 font-semibold")}>
                      +{stats?.appointments_growth || 0}%
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Médicos Cadastrados */}
          <Card variant="interactive" className="border-l-4 border-l-blue-500 dark:border-l-blue-400 animate-fade-in" style={{ animationDelay: '50ms' }}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Médicos Cadastrados
                </CardTitle>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg transition-transform duration-200 hover:scale-110">
                  <Stethoscope className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-10 w-24" />
              ) : (
                <>
                  <p className={clsx(TYPOGRAPHY.heading.h2, "text-slate-900 dark:text-white mb-2")}>
                    {stats?.total_doctors || 0}
                  </p>
                  <p className={clsx(TYPOGRAPHY.body.small, COLORS.text.secondary, "mb-3")}>
                    {stats?.active_doctors || 0} ativos • {stats?.new_doctors || 0} novos
                  </p>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 w-fit">
                    <ArrowUpRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className={clsx(TYPOGRAPHY.body.small, "text-emerald-600 dark:text-emerald-400 font-semibold")}>
                      +{stats?.doctors_growth || 0}%
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Pacientes Cadastrados */}
          <Card variant="interactive" className="border-l-4 border-l-emerald-500 dark:border-l-emerald-400 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Pacientes Cadastrados
                </CardTitle>
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg transition-transform duration-200 hover:scale-110">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-10 w-24" />
              ) : (
                <>
                  <p className={clsx(TYPOGRAPHY.heading.h2, "text-slate-900 dark:text-white mb-2")}>
                    {stats?.total_patients || 0}
                  </p>
                  <p className={clsx(TYPOGRAPHY.body.small, COLORS.text.secondary, "mb-3")}>
                    {stats?.active_patients || 0} ativos • {stats?.new_patients || 0} novos
                  </p>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 w-fit">
                    <ArrowUpRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className={clsx(TYPOGRAPHY.body.small, "text-emerald-600 dark:text-emerald-400 font-semibold")}>
                      +{stats?.patients_growth || 0}%
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Convênios Ativos */}
          <Card variant="interactive" className="border-l-4 border-l-amber-500 dark:border-l-amber-400 animate-fade-in" style={{ animationDelay: '150ms' }}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Convênios Ativos
                </CardTitle>
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg transition-transform duration-200 hover:scale-110">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-10 w-24" />
              ) : (
                <>
                  <p className={clsx(TYPOGRAPHY.heading.h2, "text-slate-900 dark:text-white mb-2")}>
                    {stats?.total_health_insurances || 0}
                  </p>
                  <p className={clsx(TYPOGRAPHY.body.small, COLORS.text.secondary, "mb-3")}>
                    {stats?.active_health_insurances || 0} ativos • {stats?.new_health_insurances || 0} novos
                  </p>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 w-fit">
                    <ArrowUpRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className={clsx(TYPOGRAPHY.body.small, "text-emerald-600 dark:text-emerald-400 font-semibold")}>
                      +{stats?.health_insurances_growth || 0}%
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

      {/* Charts - Profissionais */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {/* Consultas por Mês */}
          <Card variant="interactive" className="overflow-hidden">
            <CardHeader className="border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className={clsx(TYPOGRAPHY.heading.h4, COLORS.text.primary)}>
                    Consultas por Mês
                  </CardTitle>
                  <CardDescription className={clsx(TYPOGRAPHY.body.small, COLORS.text.secondary)}>
                    Evolução mensal de agendamentos
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
                    <XAxis 
                      dataKey="month" 
                      stroke="#64748b"
                      className="dark:stroke-slate-400"
                      tick={{ fill: 'currentColor' }}
                    />
                    <YAxis 
                      stroke="#64748b"
                      className="dark:stroke-slate-400"
                      tick={{ fill: 'currentColor' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                      className="dark:bg-slate-800 dark:border-slate-700"
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="total" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Consultas por Especialidade */}
          <Card variant="interactive" className="overflow-hidden">
            <CardHeader className="border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle className={clsx(TYPOGRAPHY.heading.h4, COLORS.text.primary)}>
                    Consultas por Especialidade
                  </CardTitle>
                  <CardDescription className={clsx(TYPOGRAPHY.body.small, COLORS.text.secondary)}>
                    Distribuição por área médica
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={specialtyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
                    <XAxis 
                      dataKey="specialty" 
                      stroke="#64748b"
                      className="dark:stroke-slate-400"
                      tick={{ fill: 'currentColor' }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      stroke="#64748b"
                      className="dark:stroke-slate-400"
                      tick={{ fill: 'currentColor' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                      className="dark:bg-slate-800 dark:border-slate-700"
                    />
                    <Legend />
                    <Bar 
                      dataKey="total" 
                      fill="#8b5cf6"
                      radius={[8, 8, 0, 0]}
                      className="hover:opacity-80 transition-opacity"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

      {/* Atividades Recentes */}
      <Card variant="interactive" className="overflow-hidden">
          <CardHeader className="border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
                <Activity className="h-5 w-5 text-slate-700 dark:text-slate-300" />
              </div>
              <div>
                <CardTitle className={clsx(TYPOGRAPHY.heading.h4, COLORS.text.primary)}>
                  Atividades Recentes
                </CardTitle>
                <CardDescription className={clsx(TYPOGRAPHY.body.small, COLORS.text.secondary)}>
                  Últimas ações realizadas no sistema
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
                <p className={clsx(TYPOGRAPHY.body.base, COLORS.text.secondary)}>
                  Nenhuma atividade recente
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map((activity, index) => {
                  const activityColorClass = getActivityColor(activity.color);
                  return (
                    <div 
                      key={activity.id} 
                      className={clsx(
                        "flex items-start gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700",
                        "hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:shadow-md transition-all duration-200",
                        "hover:-translate-y-0.5",
                        "animate-fade-in"
                      )}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className={clsx(
                        "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200",
                        "hover:scale-110 shadow-sm",
                        activityColorClass
                      )}>
                        {getActivityIcon(activity.icon)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={clsx(TYPOGRAPHY.body.base, "font-semibold text-slate-900 dark:text-white mb-1")}>
                          {activity.title}
                        </p>
                        <p className={clsx(TYPOGRAPHY.body.small, COLORS.text.secondary)}>
                          {activity.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}

