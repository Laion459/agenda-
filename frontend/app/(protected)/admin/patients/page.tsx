'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
  createPatient,
  deletePatient,
  fetchAdminPatients,
  updatePatient,
} from "@/services/admin-patient-service";
import { HealthInsurance, Patient } from "@/types";

const patientSchema = z.object({
  name: z.string().min(3, "Informe o nome"),
  email: z.string().email("Informe um e-mail válido"),
  phone: z.string().optional(),
  password: z.string().optional(),
  cpf: z.string().min(11, "Informe o CPF"),
  birth_date: z.string().min(1, "Informe a data de nascimento"),
  gender: z.enum(["M", "F", "OTHER"]).optional(),
  address: z.string().optional(),
  is_active: z.boolean().optional(),
});

type PatientForm = z.infer<typeof patientSchema>;

type PlanSelection = Record<
  number,
  {
    selected: boolean;
    policy_number: string;
  }
>;

export default function AdminPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [healthInsurances, setHealthInsurances] = useState<HealthInsurance[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingForm, setLoadingForm] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [search, setSearch] = useState("");
  const [plans, setPlans] = useState<PlanSelection>({});

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setError,
  } = useForm<PatientForm>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      cpf: "",
      birth_date: "",
      gender: undefined,
      address: "",
      is_active: true,
    },
  });

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [patientResponse, insuranceResponse] = await Promise.all([
          fetchAdminPatients({ per_page: 50 }),
          fetchHealthInsurances(),
        ]);

        setPatients(patientResponse.data ?? []);
        setHealthInsurances(insuranceResponse);
      } catch (error) {
        handleApiError(error, "Não foi possível carregar pacientes");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const filteredPatients = useMemo(() => {
    if (!search.trim()) {
      return patients;
    }

    const lower = search.toLowerCase();
    return patients.filter((patient) => {
      const matchesName = patient.name.toLowerCase().includes(lower);
      const matchesEmail = patient.user?.email?.toLowerCase().includes(lower);
      const matchesCpf = patient.cpf.toLowerCase().includes(lower);

      return matchesName || matchesEmail || matchesCpf;
    });
  }, [patients, search]);

  const resetPlans = (patient?: Patient | null) => {
    if (!patient || !patient.health_insurances) {
      setPlans({});
      return;
    }

    const mapped: PlanSelection = {};
    patient.health_insurances.forEach((plan) => {
      mapped[plan.id] = {
        selected: true,
        policy_number: plan.pivot?.policy_number ?? "",
      };
    });
    setPlans(mapped);
  };

  const resetForm = () => {
    setEditing(null);
    reset({
      name: "",
      email: "",
      phone: "",
      password: "",
      cpf: "",
      birth_date: "",
      gender: undefined,
      address: "",
      is_active: true,
    });
    setPlans({});
  };

  const reloadPatients = async () => {
    const response = await fetchAdminPatients({ per_page: 50 });
    setPatients(response.data ?? []);
  };

  const onSubmit = async (values: PatientForm) => {
    if (!editing && !values.password) {
      setError("password", { type: "manual", message: "Informe uma senha inicial" });
      return;
    }

    setLoadingForm(true);
    try {
      const selectedPlans = Object.entries(plans)
        .filter(([, value]) => value.selected)
        .map(([id, value]) => ({
          id: Number(id),
          policy_number: value.policy_number || undefined,
        }));

      const payload = {
        ...values,
        password: values.password || undefined,
        health_insurances: selectedPlans,
      };

      if (editing) {
        await updatePatient(editing.id, payload);
        toast.success("Paciente atualizado com sucesso");
      } else {
        await createPatient(payload);
        toast.success("Paciente cadastrado com sucesso");
      }

      resetForm();
      await reloadPatients();
    } catch (error) {
      handleApiError(error, editing ? "Falha ao atualizar paciente" : "Falha ao criar paciente");
    } finally {
      setLoadingForm(false);
    }
  };

  const handleEdit = (patient: Patient) => {
    setEditing(patient);
    reset({
      name: patient.name,
      email: patient.user?.email ?? "",
      phone: patient.user?.phone ?? "",
      password: "",
      cpf: patient.cpf,
      birth_date: patient.birth_date ?? "",
      gender: patient.gender ?? undefined,
      address: patient.address ?? "",
      is_active: patient.user?.is_active ?? true,
    });
    resetPlans(patient);
  };

  const handleToggleActive = async (patient: Patient) => {
    const active = patient.user?.is_active ?? true;

    try {
      setLoadingForm(true);
      if (active) {
        await deletePatient(patient.id);
        toast.success("Paciente desativado");
      } else {
        await updatePatient(patient.id, { is_active: true });
        toast.success("Paciente reativado");
      }
      if (editing?.id === patient.id) {
        resetForm();
      }
      await reloadPatients();
    } catch (error) {
      handleApiError(error, "Não foi possível alterar o status");
    } finally {
      setLoadingForm(false);
    }
  };

  const togglePlan = (id: number) => {
    setPlans((prev) => {
      const current = prev[id] ?? { selected: false, policy_number: "" };
      return {
        ...prev,
        [id]: {
          ...current,
          selected: !current.selected,
        },
      };
    });
  };

  const updatePolicyNumber = (id: number, policy: string) => {
    setPlans((prev) => ({
      ...prev,
      [id]: {
        selected: prev[id]?.selected ?? true,
        policy_number: policy,
      },
    }));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>{editing ? "Editar paciente" : "Cadastrar paciente"}</CardTitle>
            <CardDescription>Cadastre ou atualize os dados dos pacientes.</CardDescription>
          </div>
          <Input
            placeholder="Buscar por nome, CPF ou e-mail"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="md:max-w-xs"
          />
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
              <Label htmlFor="cpf">CPF</Label>
              <Input id="cpf" {...register("cpf")} />
              {errors.cpf && <p className="text-xs text-red-500">{errors.cpf.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="birth_date">Data de nascimento</Label>
              <Input id="birth_date" type="date" {...register("birth_date")} />
              {errors.birth_date && (
                <p className="text-xs text-red-500">{errors.birth_date.message}</p>
              )}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="gender">Gênero</Label>
              <select
                id="gender"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register("gender")}
              >
                <option value="">Não informado</option>
                <option value="F">Feminino</option>
                <option value="M">Masculino</option>
                <option value="OTHER">Outro</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input id="address" {...register("address")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Convênios do paciente</Label>
            <div className="grid gap-3">
              {healthInsurances.map((plan) => {
                const selection = plans[plan.id] ?? { selected: false, policy_number: "" };
                return (
                  <div
                    key={plan.id}
                    className="rounded-md border border-slate-200 p-3 text-sm shadow-sm"
                  >
                    <label className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-slate-800">{plan.name}</p>
                        <p className="text-xs text-slate-500">
                          Cobertura: {plan.coverage_percentage ?? "N/D"}%
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={selection.selected}
                        onChange={() => togglePlan(plan.id)}
                        className="h-4 w-4"
                      />
                    </label>
                    {selection.selected && (
                      <div className="mt-2 space-y-1">
                        <Label htmlFor={`policy-${plan.id}`} className="text-xs font-medium">
                          Número da apólice
                        </Label>
                        <Input
                          id={`policy-${plan.id}`}
                          value={selection.policy_number}
                          onChange={(event) => updatePolicyNumber(plan.id, event.target.value)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_active" {...register("is_active")} className="h-4 w-4" />
            <Label htmlFor="is_active" className="text-sm font-medium">
              Perfil ativo
            </Label>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={loadingForm}>
              {loadingForm ? "Salvando..." : editing ? "Salvar alterações" : "Cadastrar paciente"}
            </Button>
            {editing && (
              <Button type="button" variant="ghost" onClick={resetForm} disabled={loadingForm}>
                Cancelar edição
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Pacientes cadastrados</CardTitle>
          <CardDescription>Administre os pacientes ativos e inativos no sistema.</CardDescription>
        </CardHeader>
        <div className="max-h-[520px] overflow-y-auto border-t border-slate-200">
          {loading ? (
            <div className="space-y-3 p-6">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : filteredPatients.length === 0 ? (
            <EmptyState className="m-4">Nenhum paciente encontrado.</EmptyState>
          ) : (
            <ul className="divide-y divide-slate-200">
              {filteredPatients.map((patient) => {
                const active = patient.user?.is_active ?? true;
                return (
                  <li key={patient.id} className="flex flex-col gap-2 px-6 py-4 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900">{patient.name}</p>
                        <p className="text-xs text-slate-500">
                          {patient.user?.email ?? "Sem e-mail informado"}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          active ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {active ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                    <div className="grid gap-1 text-xs text-slate-600 md:grid-cols-2">
                      <p>
                        <span className="font-medium">Telefone:</span>{" "}
                        {patient.user?.phone ?? "Não informado"}
                      </p>
                      <p>
                        <span className="font-medium">Nascimento:</span>{" "}
                        {patient.birth_date
                          ? new Date(patient.birth_date).toLocaleDateString("pt-BR")
                          : "Não informado"}
                      </p>
                      <p className="md:col-span-2">
                        <span className="font-medium">Convênios:</span>{" "}
                        {patient.health_insurances && patient.health_insurances.length > 0
                          ? patient.health_insurances
                              .map((plan) => {
                                const policy = plan.pivot?.policy_number
                                  ? ` (${plan.pivot.policy_number})`
                                  : "";
                                return `${plan.name}${policy}`;
                              })
                              .join(", ")
                          : "Nenhum convênio"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" onClick={() => handleEdit(patient)}>
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(patient)}
                        disabled={loadingForm}
                      >
                        {active ? "Desativar" : "Reativar"}
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
  );
}


