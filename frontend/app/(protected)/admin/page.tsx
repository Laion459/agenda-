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
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import dynamic from "next/dynamic";

// Importação dinâmica do recharts para evitar problemas com Turbopack em dev
const LineChart = dynamic(() => import("recharts").then((mod) => mod.LineChart), { ssr: false });
const Line = dynamic(() => import("recharts").then((mod) => mod.Line), { ssr: false });
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

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import toast from "react-hot-toast";

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

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
        return 'bg-green-100 text-green-600';
      case 'blue':
        return 'bg-blue-100 text-blue-600';
      case 'orange':
        return 'bg-orange-100 text-orange-600';
      case 'red':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <AdminLayout>
        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {/* Total de Consultas */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">Total de Consultas</CardTitle>
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <p className="text-3xl font-bold text-slate-900">{stats?.total_appointments || 0}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {stats?.appointments_today || 0} hoje • {stats?.appointments_this_month || 0} este mês
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-green-500 font-medium">
                      +{stats?.appointments_growth || 0}%
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Médicos Cadastrados */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">Médicos Cadastrados</CardTitle>
                <Stethoscope className="h-5 w-5 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <p className="text-3xl font-bold text-slate-900">{stats?.total_doctors || 0}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {stats?.active_doctors || 0} ativos • {stats?.new_doctors || 0} novos
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-green-500 font-medium">
                      +{stats?.doctors_growth || 0}%
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Pacientes Cadastrados */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">Pacientes Cadastrados</CardTitle>
                <Users className="h-5 w-5 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <p className="text-3xl font-bold text-slate-900">{stats?.total_patients || 0}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {stats?.active_patients || 0} ativos • {stats?.new_patients || 0} novos
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-green-500 font-medium">
                      +{stats?.patients_growth || 0}%
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Convênios Ativos */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">Convênios Ativos</CardTitle>
                <FileText className="h-5 w-5 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <p className="text-3xl font-bold text-slate-900">{stats?.total_health_insurances || 0}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {stats?.active_health_insurances || 0} ativos • {stats?.new_health_insurances || 0} novos
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-green-500 font-medium">
                      +{stats?.health_insurances_growth || 0}%
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2 mb-6">
          {/* Consultas por Mês */}
          <Card>
            <CardHeader>
              <CardTitle>Consultas por Mês</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Consultas por Especialidade */}
          <Card>
            <CardHeader>
              <CardTitle>Consultas por Especialidade</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={specialtyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="specialty" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Atividades Recentes */}
        <Card>
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
            <CardDescription>Últimas ações realizadas no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => {
                  const activityColorClass = getActivityColor(activity.color);
                  return (
                    <div key={activity.id} className="flex items-start gap-4 p-4 border-b last:border-b-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activityColorClass}`}>
                        {getActivityIcon(activity.icon)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{activity.title}</p>
                        <p className="text-sm text-slate-500">{activity.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </AdminLayout>
  );
}

