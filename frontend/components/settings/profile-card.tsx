/*
 ** EPITECH PROJECT, 2025
 ** EpiTrello
 ** File description:
 ** profile-card
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { updateNameAction } from "@/actions/settings";

export function ProfileCard({
  initialName,
  email,
}: {
  initialName: string;
  email: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    await updateNameAction(formData);
    setLoading(false);
    setIsEditing(false);
  }

  return (
    <Card className="p-6">
      <h2 className="mb-6 text-xl font-semibold text-foreground">
        Informations
      </h2>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="username">Nom d'utilisateur</Label>
          {isEditing ? (
            <form action={handleSubmit} className="flex gap-2">
              <Input
                name="username"
                defaultValue={initialName}
                className="flex-1"
                required
              />
              <Button type="submit" disabled={loading}>
                {loading ? "..." : "OK"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
              >
                X
              </Button>
            </form>
          ) : (
            <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-3">
              <span className="text-foreground">{initialName}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                Modifier
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Email</Label>
          <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-3">
            <span className="text-foreground">{email}</span>
            <span className="text-xs text-muted-foreground">
              Non modifiable
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
