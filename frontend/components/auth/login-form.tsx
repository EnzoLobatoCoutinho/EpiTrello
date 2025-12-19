/*
** EPITECH PROJECT, 2025
** EpiTrello
** File description:
** login-form
*/

"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/actions/auth";
import { useClientT } from "@/lib/i18n-client";

export function LoginForm() {
  const router = useRouter();
  const [state, action, isPending] = useActionState(loginAction, undefined);
  const { t } = useClientT("auth");

  useEffect(() => {
    if (state?.success && state?.token) {
      localStorage.setItem("token", state.token);
      router.push("/dashboard");
    }
  }, [state, router]);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">{t("login.email.label")}</Label>
        <Input 
          id="email" 
          name="email" 
          type="email" 
          placeholder={t("login.email.placeholder")}
          required 
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t("login.password.label")}</Label>
        <Input 
          id="password" 
          name="password" 
          type="password" 
          required 
        />
      </div>

      {state?.error && (
        <p className="text-sm text-red-500 bg-red-50 p-2 rounded text-center">
          {state.error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? t("login.button.loading") : t("login.button")}
      </Button>
    </form>
  );
}