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

export function RegisterForm() {
  const [state, action, isPending] = useActionState(registerAction, undefined);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">Nom d'utilisateur</Label>
        <Input 
          id="username" 
          name="username" 
          type="text" 
          placeholder="Votre pseudo" 
          required 
        />
      </div>

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
        {isPending ? "Création..." : "S'inscrire"}
      </Button>
    </form>
  );
}