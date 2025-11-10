'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { Download, Search } from "lucide-react";
import { useEffect, useState } from "react";
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
import { exportAdminUsers, fetchAdminUsers } from "@/services/admin-user-service";
import { User } from "@/types";

const filterSchema = z.object({
  search: z.string().optional(),
  role: z.enum(["", "ADMIN", "DOCTOR", "PATIENT"]).optional(),
  is_active: z.enum(["", "true", "false"]).optional(),
  created_from: z.string().optional(),
  created_to: z.string().optional(),
});

type FilterForm = z.infer<typeof filterSchema>;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FilterForm>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      search: "",
      role: "",
      is_active: "",
      created_from: "",
      created_to: "",
    },
  });

  const loadUsers = async (payload?: FilterForm) => {
    try {
      setLoading(true);
      const response = await fetchAdminUsers(payload);
      setUsers(response.data ?? []);
    } catch (error) {
      handleApiError(error, "Não foi possível carregar os usuários");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const onSubmit = async (values: FilterForm) => {
    const payload = {
      ...values,
    };
    if (payload.role === "") delete payload.role;
    if (payload.is_active === "") delete payload.is_active;
    void loadUsers(payload);
  };

  const onExport = async () => {
    const values = watch();
    const params: Record<string, string | undefined> = {
      search: values.search || undefined,
      role: values.role || undefined,
      is_active: values.is_active || undefined,
      created_from: values.created_from || undefined,
      created_to: values.created_to || undefined,
    };

    try {
      const response = await exportAdminUsers(params);
      const blob = new Blob([response.data], { type: "text/csv;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `usuarios-${Date.now()}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success("Exportação iniciada com sucesso");
    } catch (error) {
      handleApiError(error, "Falha ao exportar usuários");
    }
  };

  const resetFilters = () => {
    reset({
      search: "",
      role: "",
      is_active: "",
      created_from: "",
      created_to: "",
    });
    void loadUsers();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Usuários</CardTitle>
          <CardDescription>Administre todos os perfis cadastrados no sistema.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 p-6 pt-0 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2 md:col-span-2 lg:col-span-1">
            <Label htmlFor="search">Busca</Label>
            <div className="flex items-center gap-2">
              <Input id="search" placeholder="Nome, e-mail ou telefone" {...register("search")} />
              <Button type="submit" variant="secondary">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Perfil</Label>
            <select
              id="role"
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register("role")}
            >
              <option value="">Todos</option>
              <option value="ADMIN">Admin</option>
              <option value="DOCTOR">Médico</option>
              <option value="PATIENT">Paciente</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="is_active">Status</Label>
            <select
              id="is_active"
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register("is_active")}
            >
              <option value="">Todos</option>
              <option value="true">Ativos</option>
              <option value="false">Inativos</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="created_from">Criado a partir de</Label>
            <Input id="created_from" type="date" {...register("created_from")} />
            {errors.created_from && (
              <p className="text-xs text-red-500">{errors.created_from.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="created_to">Criado até</Label>
            <Input id="created_to" type="date" {...register("created_to")} />
            {errors.created_to && <p className="text-xs text-red-500">{errors.created_to.message}</p>}
          </div>
          <div className="flex items-end gap-2">
            <Button type="submit">Aplicar filtros</Button>
            <Button type="button" variant="ghost" onClick={resetFilters}>
              Limpar
            </Button>
            <Button type="button" variant="secondary" onClick={onExport}>
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
          <CardDescription>Resumo dos usuários correspondentes ao filtro.</CardDescription>
        </CardHeader>
        <div className="max-h-[560px] overflow-y-auto border-t border-slate-200">
          {loading ? (
            <div className="space-y-3 p-6">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : users.length === 0 ? (
            <EmptyState className="m-6">Nenhum usuário encontrado com os filtros aplicados.</EmptyState>
          ) : (
            <ul className="divide-y divide-slate-200">
              {users.map((user) => (
                <li key={user.id} className="flex flex-col gap-2 px-6 py-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        user.is_active ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {user.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <div className="grid gap-1 text-xs text-slate-600 md:grid-cols-2 lg:grid-cols-3">
                    <p>
                      <span className="font-medium">Telefone:</span> {user.phone ?? "N/D"}
                    </p>
                    <p>
                      <span className="font-medium">Perfil:</span> {user.role}
                    </p>
                    <p>
                      <span className="font-medium">Criado em:</span>{" "}
                      {user.created_at ? new Date(user.created_at).toLocaleDateString("pt-BR") : "N/D"}
                    </p>
                    {user.role === "DOCTOR" && (
                      <p className="md:col-span-2 lg:col-span-3">
                        <span className="font-medium">Especialidade:</span>{" "}
                        {user.doctor?.specialty ?? "Não informada"}
                      </p>
                    )}
                    {user.role === "PATIENT" && (
                      <p className="md:col-span-2 lg:col-span-3">
                        <span className="font-medium">CPF:</span> {user.patient?.cpf ?? "Não informado"}
                      </p>
                    )}
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


