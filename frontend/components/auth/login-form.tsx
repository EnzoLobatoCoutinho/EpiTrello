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

export function LoginForm() {
  const router = useRouter();
  const [state, action, isPending] = useActionState(loginAction, undefined);

  useEffect(() => {
    if (state?.success && state?.token) {
      localStorage.setItem("token", state.token);
      router.push("/dashboard");
    }
  }, [state, router]);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input 
          id="email" 
          name="email" 
          type="email" 
          placeholder="exemple@mail.com" 
          required 
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
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
        {isPending ? "Connexion..." : "Se connecter"}
      </Button>
    </form>
  );
}