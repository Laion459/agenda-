'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/services/auth-service";
import { useAuthStore } from "@/store/auth-store";

const schema = z.object({
  email: z.string().email("Informe um e-mail válido"),
  password: z.string().min(6, "Informe a senha"),
});

type LoginForm = z.infer<typeof schema>;

export default function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginForm>({
    resolver: zodResolver(schema),
  });
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (values: LoginForm) => {
    setLoading(true);
    try {
      const result = await login(values);
      setAuth(result);
      router.replace("/dashboard");
    } catch (error: any) {
      setError("email", {
        type: "manual",
        message: error?.response?.data?.message ?? "Credenciais inválidas",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md space-y-6">
      <CardHeader className="space-y-2">
        <CardTitle>Entrar</CardTitle>
        <CardDescription>Acesse sua conta Agenda+ para gerenciar consultas.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" placeholder="seu@email.com" {...register("email")} />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input id="password" type="password" {...register("password")} />
          {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>
      <p className="text-sm text-slate-600">
        Ainda não tem conta?{" "}
        <Link className="text-blue-600 hover:underline" href="/register">
          Cadastre-se
        </Link>
      </p>
    </Card>
  );
}


