/*
 ** EPITECH PROJECT, 2025
 ** EpiTrello
 ** File description:
 ** edit-card-dialog
 */

"use client";

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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CardType, LabelType } from "@/types/board";

interface EditCardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  card: CardType | null;
  setCard: (card: CardType) => void;
  onSave: () => void;
  onDelete?: (cardId: number) => void;
  labels: LabelType[];
}

export function EditCardDialog({
  isOpen,
  onClose,
  card,
  setCard,
  onSave,
  onDelete,
  labels,
}: EditCardDialogProps) {
  if (!card) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Modifier la carte</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre</Label>
            <Input
              id="title"
              value={card.title}
              onChange={(e) => setCard({ ...card, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={card.description}
              onChange={(e) =>
                setCard({ ...card, description: e.target.value })
              }
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="label">Label</Label>
            <Select
              value={card.label_id?.toString() || "0"}
              onValueChange={(value) =>
                setCard({
                  ...card,
                  label_id: value === "0" ? null : Number(value),
                })
              }
            >
              <SelectTrigger id="label">
                <SelectValue placeholder="Sélectionner un label" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Aucun</SelectItem>
                {labels.map((label) => (
                  <SelectItem key={label.id} value={label.id.toString()}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded"
                        style={{ backgroundColor: label.color }}
                      />
                      {label.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Début</Label>
              <Input
                id="startDate"
                type="date"
                value={
                  card.start_date
                    ? new Date(card.start_date).toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  setCard({
                    ...card,
                    start_date: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : "",
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Échéance</Label>
              <Input
                id="dueDate"
                type="date"
                value={
                  card.due_date
                    ? new Date(card.due_date).toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  setCard({
                    ...card,
                    due_date: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : "",
                  })
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <div className="flex flex-1 items-center justify-between">
            <div>
              {onDelete && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (!card) return;
                    if (confirm("Supprimer cette carte ?")) {
                      onDelete(card.id);
                      onClose();
                    }
                  }}
                >
                  Supprimer
                </Button>
              )}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button onClick={onSave}>Enregistrer</Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
