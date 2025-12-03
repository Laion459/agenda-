'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { handleApiError } from "@/lib/handle-api-error";
import {
  fetchProfile,
  updateProfile,
  acceptPrivacyPolicy,
  requestDataErasure,
  exportUserData,
} from "@/services/profile-service";
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
  const [privacyLoading, setPrivacyLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [exportProgress, setExportProgress] = useState(0);

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

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const profile = await fetchProfile();
      setUser(profile);
      reset({
        name: profile.name,
        email: profile.email,
        phone: profile.phone ?? "",
        password: "",
        birth_date: profile.patient?.birth_date ?? "",
        gender: (profile.patient?.gender as "M" | "F" | "OTHER" | undefined) ?? undefined,
        address: "",
        specialty: profile.doctor?.specialty ?? "",
        qualification: profile.doctor?.qualification ?? "",
        crm: profile.doctor?.crm ?? "",
      });
    } catch (error) {
      handleApiError(error, "Não foi possível carregar seu perfil");
    } finally {
      setLoading(false);
    }
  }, [reset, setUser]);

  useEffect(() => {
    void load();
  }, [load]);

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

    setSaveState('saving');
    try {
      const toastId = toast.loading('Salvando alterações...', { id: 'saving-profile' });
      const updated = await updateProfile(payload);
      setUser(updated);
      toast.success("✅ Perfil atualizado com sucesso!", { 
        id: 'saving-profile',
        duration: 3000,
        icon: '✓'
      });
      setSaveState('saved');
      reset({ ...values, password: "" });
      // Resetar estado após 2 segundos
      setTimeout(() => {
        setSaveState('idle');
      }, 2000);
    } catch (error) {
      toast.error("❌ Não foi possível atualizar seu perfil", { 
        id: 'saving-profile',
        duration: 4000
      });
      setSaveState('error');
      handleApiError(error, "Não foi possível atualizar seu perfil");
      setTimeout(() => {
        setSaveState('idle');
      }, 3000);
    }
  };

  const handleAcceptPrivacy = async () => {
    try {
      setPrivacyLoading(true);
      const response = await acceptPrivacyPolicy();
      // Atualiza o usuário no store se a resposta incluir o usuário atualizado
      if (response?.user) {
        setUser(response.user);
      }
      toast.success("Termos de privacidade aceitos.");
      await load();
    } catch (error) {
      handleApiError(error, "Não foi possível registrar sua aceitação");
    } finally {
      setPrivacyLoading(false);
    }
  };

  const handleRequestErasure = async () => {
    if (
      !window.confirm(
        "Confirmar solicitação de exclusão? Sua conta será anonimizada e você perderá acesso.",
      )
    ) {
      return;
    }

    try {
      setPrivacyLoading(true);
      await requestDataErasure();
      toast.success("Solicitação registrada. Nossa equipe entrará em contato.");
      await load();
    } catch (error) {
      handleApiError(error, "Não foi possível registrar a solicitação");
    } finally {
      setPrivacyLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      setExporting(true);
      setExportProgress(0);
      
      // Simular progresso (ou usar progresso real se a API suportar)
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);
      
      const toastId = toast.loading('Exportando seus dados...', { id: 'exporting-data' });
      
      const data = await exportUserData();
      
      clearInterval(progressInterval);
      setExportProgress(100);
      
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `meus-dados-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success("✅ Exportação gerada com sucesso!", { 
        id: 'exporting-data',
        duration: 3000,
        icon: '📥'
      });
      
      setTimeout(() => {
        setExportProgress(0);
      }, 1000);
    } catch (error) {
      setExportProgress(0);
      toast.error("❌ Não foi possível exportar seus dados", { 
        id: 'exporting-data',
        duration: 4000
      });
      handleApiError(error, "Não foi possível exportar seus dados");
    } finally {
      setExporting(false);
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
      <Card variant="elevated" className="animate-fade-in">
        <CardHeader>
          <CardTitle>Meu perfil</CardTitle>
          <CardDescription>Atualize suas informações pessoais e preferências.</CardDescription>
        </CardHeader>
        <Tabs defaultValue="info" className="p-6 pt-0">
          <TabsList className="mb-6">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="security">Segurança</TabsTrigger>
            <TabsTrigger value="privacy">Privacidade</TabsTrigger>
          </TabsList>
          
          <TabsContent value="info">
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
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

              <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                <Button 
                  type="submit" 
                  disabled={!isDirty || saveState === 'saving'}
                  loading={saveState === 'saving'}
                  success={saveState === 'saved'}
                  error={saveState === 'error'}
                >
                  {saveState === 'idle' && 'Salvar alterações'}
                  {saveState === 'saving' && 'Salvando...'}
                  {saveState === 'saved' && 'Salvo!'}
                  {saveState === 'error' && 'Erro ao salvar'}
                </Button>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="security">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nova senha</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Deixe em branco para manter a senha atual"
                  {...register("password")} 
                />
                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Deixe em branco se não deseja alterar sua senha.
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="submit" disabled={!isDirty}>
                  Atualizar senha
                </Button>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="privacy">
            <div className="space-y-6">
          <div>
            <p className="text-sm text-slate-600 mb-2">
              {authUser?.privacy_policy_accepted_at
                ? `Termos aceitos em ${new Date(
                    authUser.privacy_policy_accepted_at,
                  ).toLocaleDateString("pt-BR")}.`
                : "Você ainda não aceitou os termos de privacidade vigentes."}
            </p>
            {!authUser?.privacy_policy_accepted_at && (
              <Button
                variant="secondary"
                className="mt-2"
                onClick={handleAcceptPrivacy}
                disabled={privacyLoading}
              >
                {privacyLoading ? "Aceitando..." : "Aceitar termos de privacidade"}
              </Button>
            )}
          </div>
          <div>
            <p className="text-sm text-slate-600">
              {authUser?.data_erasure_requested_at
                ? `Solicitação de exclusão registrada em ${new Date(
                    authUser.data_erasure_requested_at,
                  ).toLocaleDateString("pt-BR")}.`
                : "Caso deseje remover seus dados, solicite a exclusão abaixo."}
            </p>
            <Button
              variant="outline"
              className="mt-2"
              onClick={handleRequestErasure}
              disabled={privacyLoading || !!authUser?.data_erasure_requested_at}
            >
              Solicitar exclusão de dados
            </Button>
          </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  Baixe uma cópia dos seus dados pessoais em formato JSON.
                </p>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    onClick={handleExportData} 
                    disabled={exporting}
                    loading={exporting}
                  >
                    {exporting ? "Exportando..." : "Exportar meus dados"}
                  </Button>
                  {exporting && exportProgress > 0 && (
                    <div className="w-full">
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden dark:bg-slate-700">
                        <div
                          className="h-full bg-blue-500 transition-all duration-300 ease-out rounded-full"
                          style={{ width: `${exportProgress}%` }}
                          role="progressbar"
                          aria-valuenow={exportProgress}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center">
                        {exportProgress}%
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}


