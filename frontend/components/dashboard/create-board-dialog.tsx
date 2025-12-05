/*
 ** EPITECH PROJECT, 2025
 ** EpiTrello
 ** File description:
 ** create-board-dialog
 */

"use client";

import { useActionState, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBoardAction } from "@/actions/board";
import { Plus } from "lucide-react";

export function CreateBoardDialog({
  triggerStyle = "button",
}: {
  triggerStyle?: "button" | "card";
}) {
  const [open, setOpen] = useState(false);
  const [state, action, isPending] = useActionState(
    createBoardAction,
    undefined
  );

  useEffect(() => {
    if (state?.success) setOpen(false);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerStyle === "button" ? (
          <Button className="gap-2 bg-primary text-primary-foreground">
            <Plus className="h-4 w-4" /> Créer un board
          </Button>
        ) : (
          <Card className="group flex h-full cursor-pointer items-center justify-center border-2 border-dashed transition-all hover:border-primary hover:bg-accent min-h-[120px]">
            <div className="p-8 text-center">
              <Plus className="mx-auto mb-2 h-8 w-8 text-muted-foreground transition-colors group-hover:text-primary" />
              <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
                Nouveau board
              </p>
            </div>
          </Card>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Créer un nouveau tableau</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre</Label>
            <Input
              id="title"
              name="title"
              placeholder="Ex: Campagne Marketing"
              required
              autoFocus
            />
          </div>
          {state?.error && (
            <p className="text-sm text-red-500">{state.error}</p>
          )}
          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Création..." : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
