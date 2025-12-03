'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { Search, Shield, Filter, Calendar, Eye, Save, X, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { clsx } from "clsx";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Modal } from "@/components/ui/modal";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { handleApiError } from "@/lib/handle-api-error";
import { fetchAdminAdmins, fetchAdminAdminsStatistics, createAdminAdmin, updateAdminAdmin, deleteAdminAdmin } from "@/services/admin-admin-service";
import { User } from "@/types";
import { TYPOGRAPHY, COLORS } from "@/constants/design-tokens";

const filterSchema = z.object({
  search: z.string().optional(),
  is_active: z.enum(["", "true", "false"]).optional(),
  created_from: z.string().optional(),
  created_to: z.string().optional(),
});

const adminFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("E-mail inválido"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  password: z.string().optional().refine((val) => !val || val.length >= 8, {
    message: "Senha deve ter no mínimo 8 caracteres",
  }),
  is_active: z.boolean(),
});

type FilterForm = z.infer<typeof filterSchema>;
type AdminForm = z.infer<typeof adminFormSchema>;

export default function AdminAdminsPage() {
  const [admins, setAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<{
    total: number;
    active: number;
    inactive: number;
  } | null>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FilterForm>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      search: "",
      is_active: "",
      created_from: "",
      created_to: "",
    },
  });

  const {
    register: registerForm,
    handleSubmit: handleSubmitForm,
    reset: resetForm,
    watch: watchForm,
    formState: { errors: errorsForm },
    setValue: setFormValue,
  } = useForm<AdminForm>({
    resolver: zodResolver(adminFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      is_active: true,
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    watch: watchEdit,
    formState: { errors: errorsEdit },
    setValue: setEditValue,
  } = useForm<AdminForm>({
    resolver: zodResolver(adminFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      is_active: false,
    },
  });

  const isActiveValue = watchEdit("is_active") ?? false;
  const isActiveFormValue = watchForm("is_active") ?? true;

  const loadAdmins = useCallback(async (payload?: FilterForm) => {
    try {
      setLoading(true);
      const cleanPayload = payload ? Object.fromEntries(
        Object.entries(payload).filter(([_, value]) => value !== "" && value !== undefined && value !== null)
      ) : undefined;
      
      const params = cleanPayload || {};
      if (!params.per_page && Object.keys(params).length === 0) {
        params.per_page = 100;
      }
      
      const response = await fetchAdminAdmins(params);
      setAdmins(response.data ?? []);
    } catch (error) {
      handleApiError(error, "Não foi possível carregar os administradores");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStatistics = useCallback(async () => {
    try {
      const stats = await fetchAdminAdminsStatistics();
      setStatistics(stats);
    } catch (error) {
      handleApiError(error, "Não foi possível carregar as estatísticas");
    }
  }, []);

  useEffect(() => {
    void loadAdmins();
    void loadStatistics();
  }, [loadAdmins, loadStatistics]);

  useEffect(() => {
    if (selectedAdmin) {
      setEditValue('name', selectedAdmin.name || '');
      setEditValue('email', selectedAdmin.email || '');
      setEditValue('phone', selectedAdmin.phone || '');
      setEditValue('password', '');
      setEditValue('is_active', selectedAdmin.is_active ?? false);
    } else {
      resetEdit({
        name: "",
        email: "",
        phone: "",
        password: "",
        is_active: false,
      });
    }
  }, [selectedAdmin, setEditValue, resetEdit]);

  const onSubmit = async (values: FilterForm) => {
    const sanitized: FilterForm = {
      search: values.search?.trim() || undefined,
      is_active: values.is_active && values.is_active !== "" ? values.is_active : undefined,
      created_from: values.created_from && values.created_from !== "" ? values.created_from : undefined,
      created_to: values.created_to && values.created_to !== "" ? values.created_to : undefined,
    };
    await loadAdmins(sanitized);
  };

  const resetFilters = () => {
    reset({
      search: "",
      is_active: "",
      created_from: "",
      created_to: "",
    });
    void loadAdmins({});
  };

  const handleViewAdmin = (admin: User) => {
    setSelectedAdmin(admin);
    setIsModalOpen(true);
  };

  const handleCreateAdmin = () => {
    setSelectedAdmin(null);
    resetForm({
      name: "",
      email: "",
      phone: "",
      password: "",
      is_active: true,
    });
    setIsCreateModalOpen(true);
  };

  const onSubmitCreate = async (values: AdminForm) => {
    try {
      setSaving(true);
      const payload: {
        name: string;
        email: string;
        phone: string;
        password?: string;
        is_active: boolean;
      } = {
        name: values.name,
        email: values.email,
        phone: values.phone,
        is_active: values.is_active,
      };
      
      if (values.password && values.password.trim() !== '') {
        payload.password = values.password;
      }
      
      await createAdminAdmin(payload);
      toast.success("Administrador criado com sucesso!");
      setIsCreateModalOpen(false);
      resetForm();
      await loadAdmins();
      await loadStatistics();
    } catch (error) {
      handleApiError(error, "Não foi possível criar o administrador");
    } finally {
      setSaving(false);
    }
  };

  const onSubmitEdit = async (values: AdminForm) => {
    if (!selectedAdmin) return;
    
    try {
      setSaving(true);
      const payload: {
        name?: string;
        email?: string;
        phone?: string;
        password?: string;
        is_active?: boolean;
      } = {
        name: values.name,
        email: values.email,
        phone: values.phone,
        is_active: values.is_active,
      };
      
      if (values.password && values.password.trim() !== '') {
        payload.password = values.password;
      }
      
      await updateAdminAdmin(selectedAdmin.id, payload);
      toast.success("Administrador atualizado com sucesso!");
      setIsModalOpen(false);
      setSelectedAdmin(null);
      resetEdit();
      await loadAdmins();
      await loadStatistics();
    } catch (error) {
      handleApiError(error, "Não foi possível atualizar o administrador");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAdmin = async (adminId: number) => {
    if (!confirm("Tem certeza que deseja excluir este administrador? Esta ação não pode ser desfeita.")) {
      return;
    }

    try {
      setDeleting(adminId);
      await deleteAdminAdmin(adminId);
      toast.success("Administrador excluído com sucesso!");
      await loadAdmins();
      await loadStatistics();
      if (selectedAdmin?.id === adminId) {
        setIsModalOpen(false);
        setSelectedAdmin(null);
      }
    } catch (error) {
      handleApiError(error, "Não foi possível excluir o administrador");
    } finally {
      setDeleting(null);
    }
  };

  const summary = useMemo(() => {
    if (!statistics) {
      return {
        total: 0,
        active: 0,
        inactive: 0,
      };
    }
    return statistics;
  }, [statistics]);

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 animate-fade-in">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className={clsx(TYPOGRAPHY.heading.h1, COLORS.text.primary)}>
              Administradores
            </h1>
            <p className={clsx(TYPOGRAPHY.body.base, COLORS.text.secondary, "flex items-center gap-2 mt-1")}>
              <Filter className="h-4 w-4 text-purple-500" />
              Gerencie os administradores do sistema
            </p>
          </div>
        </div>
        <Button onClick={handleCreateAdmin} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="h-4 w-4 mr-2" />
          Novo Administrador
        </Button>
      </div>

      {/* Filtros */}
      <Card variant="interactive" className="border-l-4 border-l-purple-500 dark:border-l-purple-400">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <CardTitle>Filtros de Busca</CardTitle>
          </div>
          <CardDescription>Filtre os administradores por status ou período de criação</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 p-6 pt-0 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="search">Busca</Label>
            <div className="flex items-center gap-2">
              <Input id="search" placeholder="Nome, e-mail ou telefone" {...register("search")} />
              <Button type="submit" variant="secondary">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="is_active">Status</Label>
            <select
              id="is_active"
              className="w-full rounded-md border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:border-purple-400 transition-colors"
              {...register("is_active")}
            >
              <option value="">Todos</option>
              <option value="true">Ativos</option>
              <option value="false">Inativos</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="created_from" className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-500" />
              Criado a partir de
            </Label>
            <Input id="created_from" type="date" {...register("created_from")} />
            {errors.created_from && (
              <p className="text-xs text-red-500">{errors.created_from.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="created_to" className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-500" />
              Criado até
            </Label>
            <Input id="created_to" type="date" {...register("created_to")} />
            {errors.created_to && <p className="text-xs text-red-500">{errors.created_to.message}</p>}
          </div>
          <div className="flex items-end gap-2 md:col-span-4">
            <Button type="submit" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Aplicar filtros
            </Button>
            <Button type="button" variant="ghost" onClick={resetFilters}>
              Limpar
            </Button>
          </div>
        </form>
      </Card>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card variant="interactive" className="border-l-4 border-l-purple-500 dark:border-l-purple-400 animate-fade-in">
          <div className="space-y-1 p-4">
            <p className="text-xs font-semibold uppercase text-purple-700 dark:text-purple-300">Total de Administradores</p>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{summary.total}</p>
          </div>
        </Card>
        <Card variant="interactive" className="border-l-4 border-l-emerald-500 dark:border-l-emerald-400 animate-fade-in" style={{ animationDelay: '50ms' }}>
          <div className="space-y-1 p-4">
            <p className="text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">Ativos</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{summary.active}</p>
          </div>
        </Card>
        <Card variant="interactive" className="border-l-4 border-l-slate-400 dark:border-l-slate-500 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="space-y-1 p-4">
            <p className="text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">Inativos</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{summary.inactive}</p>
          </div>
        </Card>
      </div>

      {/* Lista de Administradores */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
          <CardDescription>Lista de administradores cadastrados no sistema</CardDescription>
        </CardHeader>
        <div className="max-h-[560px] overflow-y-auto border-t border-slate-200">
          {loading ? (
            <div className="space-y-3 p-6">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : admins.length === 0 ? (
            <EmptyState className="m-6">Nenhum administrador encontrado com os filtros aplicados.</EmptyState>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-700">
              {admins.map((admin, index) => (
                <li 
                  key={admin.id} 
                  className={clsx(
                    "flex flex-col gap-2 px-6 py-4 text-sm",
                    "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150",
                    "animate-fade-in"
                  )}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{admin.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{admin.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={clsx(
                          "rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200",
                          admin.is_active 
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                            : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                        )}
                      >
                        {admin.is_active ? "Ativo" : "Inativo"}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewAdmin(admin)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Visualizar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteAdmin(admin.id)}
                        disabled={deleting === admin.id}
                        className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                        {deleting === admin.id ? "Excluindo..." : "Excluir"}
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-1 text-xs text-slate-600 md:grid-cols-2">
                    <p>
                      <span className="font-medium">Telefone:</span> {admin.phone ?? "N/D"}
                    </p>
                    <p>
                      <span className="font-medium">Criado em:</span>{" "}
                      {admin.created_at ? new Date(admin.created_at).toLocaleDateString("pt-BR") : "N/D"}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      {/* Modal de Criação */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetForm();
        }}
        title="Criar Novo Administrador"
        size="lg"
      >
        <form onSubmit={handleSubmitForm(onSubmitCreate)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create_name">Nome *</Label>
            <Input id="create_name" {...registerForm("name")} />
            {errorsForm.name && (
              <p className="text-xs text-red-500">{errorsForm.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="create_email">E-mail *</Label>
            <Input id="create_email" type="email" {...registerForm("email")} />
            {errorsForm.email && (
              <p className="text-xs text-red-500">{errorsForm.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="create_phone">Telefone *</Label>
            <Input id="create_phone" {...registerForm("phone")} />
            {errorsForm.phone && (
              <p className="text-xs text-red-500">{errorsForm.phone.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="create_password">Senha (opcional - será gerada automaticamente se não informada)</Label>
            <Input id="create_password" type="password" {...registerForm("password")} />
            {errorsForm.password && (
              <p className="text-xs text-red-500">{errorsForm.password.message}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              id="create_is_active"
              type="checkbox"
              checked={isActiveFormValue}
              onChange={(e) => setFormValue("is_active", e.target.checked)}
              className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 h-4 w-4"
            />
            <Label htmlFor="create_is_active" className="cursor-pointer">
              Ativo
            </Label>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button type="button" variant="ghost" onClick={() => {
              setIsCreateModalOpen(false);
              resetForm();
            }}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Criando..." : "Criar Administrador"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Edição */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAdmin(null);
          resetEdit();
        }}
        title="Editar Administrador"
        size="lg"
      >
        {selectedAdmin && (
          <form onSubmit={handleSubmitEdit(onSubmitEdit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_name">Nome *</Label>
              <Input id="edit_name" {...registerEdit("name")} />
              {errorsEdit.name && (
                <p className="text-xs text-red-500">{errorsEdit.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_email">E-mail *</Label>
              <Input id="edit_email" type="email" {...registerEdit("email")} />
              {errorsEdit.email && (
                <p className="text-xs text-red-500">{errorsEdit.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_phone">Telefone *</Label>
              <Input id="edit_phone" {...registerEdit("phone")} />
              {errorsEdit.phone && (
                <p className="text-xs text-red-500">{errorsEdit.phone.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_password">Nova Senha (deixe em branco para manter a atual)</Label>
              <Input id="edit_password" type="password" {...registerEdit("password")} />
              {errorsEdit.password && (
                <p className="text-xs text-red-500">{errorsEdit.password.message}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                id="edit_is_active"
                type="checkbox"
                checked={isActiveValue}
                onChange={(e) => setEditValue("is_active", e.target.checked)}
                className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 h-4 w-4"
              />
              <Label htmlFor="edit_is_active" className="cursor-pointer">
                Ativo
              </Label>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button type="button" variant="ghost" onClick={() => {
                setIsModalOpen(false);
                setSelectedAdmin(null);
                resetEdit();
              }}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </AdminLayout>
  );
}

