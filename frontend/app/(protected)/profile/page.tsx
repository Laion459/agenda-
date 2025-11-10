'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { handleApiError } from "@/lib/handle-api-error";
import { fetchProfile, updateProfile } from "@/services/profile-service";
import { useAuthStore } from "@/store/auth-store";

const profileSchema = z.object({
  name: z.string().min(3, "Informe seu nome"),
  email: z.string().email("Informe um e-mail válido"),
  phone: z.string().optional(),
  password: z.string().optional(),
  birth_date: z.string().optional(),
  gender: z.enum(["", "M", "F", "OTHER"]).optional(),
  address: z.string().optional(),
  specialty: z.string().optional(),
  qualification: z.string().optional(),
  crm: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const setUser = useAuthStore((state) => state.setUser);
  const authUser = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      birth_date: "",
      gender: "",
      address: "",
      specialty: "",
      qualification: "",
      crm: "",
    },
  });

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const profile = await fetchProfile();
        reset({
          name: profile.name,
          email: profile.email,
          phone: profile.phone ?? "",
          password: "",
          birth_date: profile.patient?.birth_date ?? "",
          gender: profile.patient?.gender ?? "",
          address: profile.patient?.address ?? "",
          specialty: profile.doctor?.specialty ?? "",
          qualification: profile.doctor?.qualification ?? "",
          crm: profile.doctor?.crm ?? "",
        });
      } catch (error) {
        handleApiError(error, "Não foi possível carregar seu perfil");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [authUser?.role, reset]);

  const onSubmit = async (values: ProfileForm) => {
    const payload: Record<string, unknown> = {
      name: values.name,
      email: values.email,
      phone: values.phone,
    };

    if (values.password) {
      payload.password = values.password;
    }

    if (authUser?.role === "PATIENT") {
      payload.patient = {
        birth_date: values.birth_date || undefined,
        gender: values.gender || undefined,
        address: values.address || undefined,
      };
    }

    if (authUser?.role === "DOCTOR") {
      payload.doctor = {
        specialty: values.specialty || undefined,
        qualification: values.qualification || undefined,
        crm: values.crm || undefined,
      };
    }

    try {
      const updated = await updateProfile(payload);
      setUser(updated);
      toast.success("Perfil atualizado com sucesso");
      reset({ ...values, password: "" });
    } catch (error) {
      handleApiError(error, "Não foi possível atualizar seu perfil");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Meu perfil</CardTitle>
          <CardDescription>Atualize suas informações pessoais e preferências.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 p-6 pt-0 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" {...register("phone")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Nova senha</Label>
            <Input id="password" type="password" {...register("password")} />
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>

          {authUser?.role === "PATIENT" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="birth_date">Data de nascimento</Label>
                <Input id="birth_date" type="date" {...register("birth_date")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gênero</Label>
                <select
                  id="gender"
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register("gender")}
                >
                  <option value="">Não informar</option>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                  <option value="OTHER">Outro</option>
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Endereço</Label>
                <Textarea id="address" rows={3} {...register("address")} />
              </div>
            </>
          )}

          {authUser?.role === "DOCTOR" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="crm">CRM</Label>
                <Input id="crm" {...register("crm")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialty">Especialidade</Label>
                <Input id="specialty" {...register("specialty")} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="qualification">Qualificações</Label>
                <Textarea id="qualification" rows={3} {...register("qualification")} />
              </div>
            </>
          )}

          <div className="md:col-span-2 flex justify-end gap-2">
            <Button type="submit" disabled={!isDirty}>
              Salvar alterações
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}


