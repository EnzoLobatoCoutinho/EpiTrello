/*
** EPITECH PROJECT, 2025
** EpiTrello
** File description:
** register-form
*/

"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerAction } from "@/actions/auth";
import { useClientT } from "@/lib/i18n-client";

export function RegisterForm() {
  const [state, action, isPending] = useActionState(registerAction, undefined);
  const { t } = useClientT("auth");

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">{t("register.username.label")}</Label>
        <Input 
          id="username" 
          name="username" 
          type="text" 
          placeholder={t("register.username.placeholder")}
          required 
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{t("register.email.label")}</Label>
        <Input 
          id="email" 
          name="email" 
          type="email" 
          placeholder={t("register.email.placeholder")}
          required 
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t("register.password.label")}</Label>
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
        {isPending ? t("register.button.loading") : t("register.button")}
      </Button>
    </form>
  );
}