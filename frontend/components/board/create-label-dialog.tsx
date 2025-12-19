/*
 ** EPITECH PROJECT, 2025
 ** EpiTrello
 ** File description:
 ** create-label-dialog
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateLabelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
  onCreated: (label: { id: number; board_id: number; name: string; color: string }) => void;
}

export function CreateLabelDialog({ isOpen, onClose, boardId, onCreated }: CreateLabelDialogProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#8B5CF6");
  const [isSaving, setIsSaving] = useState(false);

  const create = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/dashboard/board/${boardId}/labels`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name: name.trim(), color }),
      });
      if (!res.ok) throw new Error("Failed to create label");
      const created = await res.json();
      onCreated(created);
      setName("");
      setColor("#8B5CF6");
      onClose();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la création du label");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Créer un label</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="label-name">Nom</Label>
            <Input id="label-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="label-color">Couleur</Label>
            <div className="flex items-center gap-2">
              <Input id="label-color" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-12 h-8 p-0" />
              <div className="text-sm text-muted-foreground">{color}</div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Annuler
            </Button>
            <Button onClick={create} disabled={isSaving}>
              {isSaving ? "Création..." : "Créer"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
