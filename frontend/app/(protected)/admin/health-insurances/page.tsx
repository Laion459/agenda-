'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { handleApiError } from "@/lib/handle-api-error";
import {
  createHealthInsurance,
  deleteHealthInsurance,
  fetchHealthInsurances,
  updateHealthInsurance,
} from "@/services/health-insurance-service";
import { HealthInsurance } from "@/types";
import { useAuthStore } from "@/store/auth-store";
import toast from "react-hot-toast";

const schema = z.object({
  id: z.number().optional(),
  name: z.string().min(3, "Informe o nome"),
  description: z.string().optional(),
  coverage_percentage: z
    .union([z.number(), z.string()])
    .optional()
    .transform((value) => (value === '' || value === undefined ? undefined : Number(value)))
    .refine((value) => value === undefined || (!Number.isNaN(value) && value >= 0 && value <= 100), {
      message: 'Cobertura deve estar entre 0 e 100',
    }),
  is_active: z.boolean().default(true),
});

type FormValues = z.infer<typeof schema>;

export default function HealthInsurancesPage() {
  const user = useAuthStore((state) => state.user);
  const [items, setItems] = useState<HealthInsurance[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<HealthInsurance | null>(null);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      is_active: true,
    },
  });

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchHealthInsurances();
        setItems(data);
      } catch (error) {
        handleApiError(error, "Não foi possível carregar os convênios");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const reloadItems = useCallback(async () => {
    const data = await fetchHealthInsurances();
    setItems(data);
  }, []);

  const resetForm = () => {
    setEditing(null);
    reset({ name: "", description: "", coverage_percentage: undefined, is_active: true });
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      if (editing) {
        await updateHealthInsurance(editing.id, {
          name: values.name,
          description: values.description,
          coverage_percentage: values.coverage_percentage,
          is_active: values.is_active,
        });
        await updateHealthInsurance(editing.id, {
          name: values.name,
          description: values.description,
          coverage_percentage: values.coverage_percentage,
          is_active: values.is_active,
        });
        toast.success("Convênio atualizado");
      } else {
        await createHealthInsurance({
          name: values.name,
          description: values.description,
          coverage_percentage: values.coverage_percentage,
          is_active: values.is_active,
        });
        toast.success("Convênio cadastrado");
      }

      await reloadItems();
      resetForm();
    } catch (error) {
      handleApiError(
        error,
        editing ? "Não foi possível atualizar o convênio" : "Não foi possível criar o convênio",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item: HealthInsurance) => {
    setEditing(item);
    reset({
      id: item.id,
      name: item.name,
      description: item.description ?? "",
      coverage_percentage: item.coverage_percentage ? Number(item.coverage_percentage) : undefined,
      is_active: item.is_active,
    });
  };

  const handleToggleActive = async (item: HealthInsurance) => {
    const question = item.is_active
      ? "Desativar este convênio? Médicos e pacientes deixarão de vinculá-lo."
      : "Reativar este convênio para uso nas agendas?";
    if (typeof window !== "undefined" && !window.confirm(question)) {
      return;
    }

    try {
      await updateHealthInsurance(item.id, { is_active: !item.is_active });
      await reloadItems();
      toast.success("Status atualizado");
    } catch (error) {
      handleApiError(error, "Não foi possível atualizar status");
    }
  };

  const handleDelete = async (item: HealthInsurance) => {
    if (
      typeof window !== "undefined" &&
      !window.confirm(`Remover o convênio ${item.name}? Esta operação não poderá ser desfeita.`)
    ) {
      return;
    }

    try {
      await deleteHealthInsurance(item.id);
      await reloadItems();
      toast.success("Convênio removido");
      if (editing?.id === item.id) {
        resetForm();
      }
    } catch (error) {
      handleApiError(error, "Não foi possível remover convênio");
    }
  };

  const normalizedFilter = filter.trim().toLowerCase();
  const orderedItems = useMemo(
    () =>
      [...items]
        .sort((a, b) => a.name.localeCompare(b.name))
        .filter((item) =>
          (statusFilter === "all" ||
            (statusFilter === "active" && item.is_active) ||
            (statusFilter === "inactive" && !item.is_active)) &&
          (normalizedFilter
            ? [item.name, item.description, item.coverage_percentage?.toString() ?? ""]
                .filter(Boolean)
                .some((value) => value!.toLowerCase().includes(normalizedFilter))
            : true)
        ),
    [items, normalizedFilter, statusFilter],
  );

  if (user?.role !== "ADMIN") {
    return <EmptyState>Você não tem permissão para acessar esta página.</EmptyState>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>{editing ? "Editar convênio" : "Adicionar convênio"}</CardTitle>
            <CardDescription>Cadastre ou atualize convênios aceitos na clínica.</CardDescription>
          </div>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
            <Input
              placeholder="Buscar por nome, descrição ou cobertura"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="md:max-w-xs"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 md:w-36"
            >
              <option value="all">Todos</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6 pt-0">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input id="description" {...register("description")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="coverage_percentage">Cobertura (%)</Label>
            <Input
              id="coverage_percentage"
              type="number"
              min={0}
              max={100}
              step={0.1}
              {...register("coverage_percentage")}
            />
            {errors.coverage_percentage && <p className="text-xs text-red-500">{errors.coverage_percentage.message}</p>}
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_active" {...register("is_active")} className="h-4 w-4" />
            <Label htmlFor="is_active" className="text-sm font-medium">
              Ativo
            </Label>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Salvando..." : editing ? "Salvar alterações" : "Cadastrar convênio"}
            </Button>
            {editing && (
              <Button type="button" variant="ghost" onClick={resetForm}>
                Cancelar edição
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Convênios cadastrados</CardTitle>
          <CardDescription>Gerencie a lista de convênios aceitos.</CardDescription>
        </CardHeader>
        <div className="max-h-[540px] overflow-y-auto border-t border-slate-200">
          {loading ? (
            <div className="space-y-3 p-6">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : orderedItems.length === 0 ? (
            <EmptyState className="m-4">Nenhum convênio cadastrado.</EmptyState>
          ) : (
            <ul className="divide-y divide-slate-200">
              {orderedItems.map((item) => (
                    <li
                      key={item.id}
                      className="flex flex-col gap-2 px-6 py-4 text-sm md:flex-row md:items-center md:justify-between"
                    >
                  <div>
                    <p className="font-medium text-slate-900">{item.name}</p>
                    {item.coverage_percentage && (
                          <p className="text-xs text-slate-500">
                            Cobertura média: {Number(item.coverage_percentage).toFixed(1)}%
                          </p>
                    )}
                    {item.description && <p className="text-xs text-slate-500">{item.description}</p>}
                        <span
                          className={`mt-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                            item.is_active ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {item.is_active ? "Ativo" : "Inativo"}
                        </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Button variant="secondary" onClick={() => handleEdit(item)}>
                      Editar
                    </Button>
                    <Button variant="ghost" onClick={() => handleToggleActive(item)}>
                          {item.is_active ? "Desativar" : "Ativar"}
                    </Button>
                    <Button
                      variant="ghost"
                          onClick={() => {
                            void handleDelete(item);
                          }}
                    >
                      Remover
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
}


