'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Stethoscope, Search, Filter, Plus, Edit, Trash2, CheckCircle2, XCircle } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { handleApiError } from "@/lib/handle-api-error";
import { fetchHealthInsurances } from "@/services/health-insurance-service";
import {
  createDoctor,
  fetchAdminDoctors,
  toggleDoctorStatus,
  updateDoctor,
} from "@/services/admin-doctor-service";
import { Doctor, HealthInsurance } from "@/types";

const doctorSchema = z.object({
  name: z.string().min(3, "Informe o nome"),
  email: z.string().email("Informe um e-mail válido"),
  phone: z.string().optional(),
  password: z.string().optional(),
  crm: z.string().min(3, "Informe o CRM"),
  specialty: z.string().min(2, "Informe a especialidade"),
  qualification: z.string().optional(),
  is_active: z.boolean().optional(),
  health_insurance_ids: z.array(z.number()).optional(),
});

type DoctorForm = z.infer<typeof doctorSchema>;

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [healthInsurances, setHealthInsurances] = useState<HealthInsurance[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingForm, setLoadingForm] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [planFilter, setPlanFilter] = useState<number | "all">("all");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
    setError,
  } = useForm<DoctorForm>({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      is_active: true,
      health_insurance_ids: [],
    },
  });

  const selectedPlans = watch("health_insurance_ids") ?? [];

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [doctorResponse, insuranceResponse] = await Promise.all([
          fetchAdminDoctors({ per_page: 50 }),
          fetchHealthInsurances(),
        ]);

        setDoctors(doctorResponse.data ?? []);
        setHealthInsurances(insuranceResponse);
      } catch (error) {
        handleApiError(error, "Não foi possível carregar médicos");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const filteredDoctors = useMemo(() => {
    const lower = search.trim().toLowerCase();

    return doctors.filter((doctor) => {
      const active = doctor.user?.is_active ?? doctor.is_active;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && active) ||
        (statusFilter === "inactive" && !active);

      const matchesPlan =
        planFilter === "all" ||
        !!doctor.health_insurances?.some((plan) => plan.id === planFilter);

      if (!lower) {
        return matchesStatus && matchesPlan;
      }

      const matchesName = doctor.name.toLowerCase().includes(lower);
      const matchesEmail = doctor.user?.email?.toLowerCase().includes(lower);
      const matchesCrm = doctor.crm.toLowerCase().includes(lower);
      const matchesSpecialty = doctor.specialty.toLowerCase().includes(lower);

      return matchesStatus && matchesPlan && (matchesName || matchesEmail || matchesCrm || matchesSpecialty);
    });
  }, [doctors, planFilter, search, statusFilter]);

  const togglePlan = (id: number) => {
    const current = new Set(selectedPlans);
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    setValue("health_insurance_ids", Array.from(current), { shouldDirty: true });
  };

  const resetForm = () => {
    setEditing(null);
    reset({
      name: "",
      email: "",
      phone: "",
      password: "",
      crm: "",
      specialty: "",
      qualification: "",
      is_active: true,
      health_insurance_ids: [],
    });
  };

  const reloadDoctors = useCallback(async () => {
    const response = await fetchAdminDoctors({ per_page: 100 });
    setDoctors(response.data ?? []);
  }, []);

  const onSubmit = async (values: DoctorForm) => {
    if (!editing && !values.password) {
      setError("password", { type: "manual", message: "Informe uma senha inicial" });
      return;
    }

    setLoadingForm(true);
    try {
      const payload = {
        ...values,
        password: values.password || undefined,
        health_insurance_ids: selectedPlans,
      };

      if (editing) {
        await updateDoctor(editing.id, payload);
        toast.success("Médico atualizado com sucesso");
      } else {
        await createDoctor(payload);
        toast.success("Médico cadastrado com sucesso");
      }

      resetForm();
      await reloadDoctors();
    } catch (error) {
      handleApiError(error, editing ? "Falha ao atualizar médico" : "Falha ao criar médico");
    } finally {
      setLoadingForm(false);
    }
  };

  const handleEdit = (doctor: Doctor) => {
    setEditing(doctor);
    reset({
      name: doctor.name,
      email: doctor.user?.email ?? "",
      phone: doctor.user?.phone ?? "",
      password: "",
      crm: doctor.crm,
      specialty: doctor.specialty,
      qualification: doctor.qualification ?? "",
      is_active: doctor.user?.is_active ?? doctor.is_active,
      health_insurance_ids: doctor.health_insurances?.map((plan) => plan.id) ?? [],
    });
  };

  const handleToggleActive = async (doctor: Doctor) => {
    const active = doctor.user?.is_active ?? doctor.is_active;
    const question = active
      ? "Deseja realmente desativar este médico? Pacientes não poderão agendar novas consultas."
      : "Deseja reativar este médico e liberá-lo para novos agendamentos?";

    if (typeof window !== "undefined" && !window.confirm(question)) {
      return;
    }

    try {
      setLoadingForm(true);
      await toggleDoctorStatus(doctor.id);
      toast.success(active ? "Médico desativado" : "Médico reativado");
      if (editing?.id === doctor.id && !active) {
        // garante que manutenção reflita status atualizado
        resetForm();
      }
      await reloadDoctors();
    } catch (error) {
      handleApiError(error, "Não foi possível alterar o status do médico");
    } finally {
      setLoadingForm(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Stethoscope className="h-8 w-8 text-purple-600" />
            Gerenciar Médicos
          </h1>
          <p className="text-sm text-slate-600 mt-1">Cadastre e gerencie os profissionais da clínica</p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-slate-400" />
              <Input
                placeholder="Buscar por nome, CRM ou e-mail"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="md:max-w-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 md:w-36"
              >
                <option value="all">Todos</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
              </select>
              <select
                value={planFilter === "all" ? "all" : String(planFilter)}
                onChange={(event) =>
                  setPlanFilter(event.target.value === "all" ? "all" : Number(event.target.value))
                }
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 md:w-44"
              >
                <option value="all">Todos os convênios</option>
                {healthInsurances.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        {/* Formulário */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              {editing ? <Edit className="h-5 w-5 text-purple-600" /> : <Plus className="h-5 w-5 text-purple-600" />}
              <CardTitle>{editing ? "Editar médico" : "Cadastrar médico"}</CardTitle>
            </div>
            <CardDescription>Gerencie os profissionais da clínica.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6 pt-0">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" {...register("phone")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{editing ? "Senha (opcional)" : "Senha inicial"}</Label>
              <Input id="password" type="password" {...register("password")} />
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="crm">CRM</Label>
              <Input id="crm" {...register("crm")} />
              {errors.crm && <p className="text-xs text-red-500">{errors.crm.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialty">Especialidade</Label>
              <Input id="specialty" {...register("specialty")} />
              {errors.specialty && (
                <p className="text-xs text-red-500">{errors.specialty.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="qualification">Qualificações</Label>
            <Input id="qualification" {...register("qualification")} />
          </div>
          <div className="space-y-2">
            <Label>Convênios aceitos</Label>
            <div className="grid gap-2">
              {healthInsurances.map((plan) => {
                const checked = selectedPlans.includes(plan.id);
                return (
                  <label
                    key={plan.id}
                    className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium text-slate-800">{plan.name}</p>
                      <p className="text-xs text-slate-500">
                        Cobertura: {plan.coverage_percentage ?? "N/D"}%
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePlan(plan.id)}
                      className="h-4 w-4"
                    />
                  </label>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_active" {...register("is_active")} className="h-4 w-4" />
            <Label htmlFor="is_active" className="text-sm font-medium">
              Ativo na plataforma
            </Label>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={loadingForm} className="bg-purple-600 hover:bg-purple-700">
              {loadingForm ? "Salvando..." : editing ? "Salvar alterações" : "Cadastrar médico"}
            </Button>
            {editing && (
              <Button type="button" variant="ghost" onClick={resetForm} disabled={loadingForm}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
        </Card>

        {/* Lista de Médicos */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-purple-600" />
              Médicos cadastrados ({filteredDoctors.length})
            </CardTitle>
            <CardDescription>Controle dos profissionais ativos e inativos.</CardDescription>
          </CardHeader>
        <div className="max-h-[520px] overflow-y-auto border-t border-slate-200">
          {loading ? (
            <div className="space-y-3 p-6">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : filteredDoctors.length === 0 ? (
            <EmptyState className="m-4">Nenhum médico encontrado.</EmptyState>
          ) : (
            <ul className="divide-y divide-slate-200">
              {filteredDoctors.map((doctor) => {
                const active = doctor.user?.is_active ?? doctor.is_active;
                return (
                  <li key={doctor.id} className="flex flex-col gap-2 px-6 py-4 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900">{doctor.name}</p>
                        <p className="text-xs text-slate-500">
                          {doctor.user?.email ?? "Sem e-mail informado"}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                          active 
                            ? "bg-green-100 text-green-700" 
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {active ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {active ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                    <div className="grid gap-1 text-xs text-slate-600 md:grid-cols-2">
                      <p>
                        <span className="font-medium">CRM:</span> {doctor.crm}
                      </p>
                      <p>
                        <span className="font-medium">Especialidade:</span> {doctor.specialty}
                      </p>
                      <p>
                        <span className="font-medium">Telefone:</span>{" "}
                        {doctor.user?.phone ?? "Não informado"}
                      </p>
                      <p className="md:col-span-2">
                        <span className="font-medium">Convênios:</span>{" "}
                        {(() => {
                          const plans = doctor.health_insurances;
                          if (plans && plans.length > 0) {
                            return plans.map((plan) => plan.name).join(", ");
                          }
                          return "Nenhum convênio";
                        })()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => handleEdit(doctor)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        Editar
                      </Button>
                      <Button
                        variant={active ? "outline" : "secondary"}
                        size="sm"
                        onClick={() => handleToggleActive(doctor)}
                        disabled={loadingForm}
                        className={active ? "text-red-600 hover:text-red-700" : ""}
                      >
                        {active ? (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Desativar
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Reativar
                          </>
                        )}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        </Card>
      </div>
    </div>
  );
}


