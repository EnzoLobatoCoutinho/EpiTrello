/*
 ** EPITECH PROJECT, 2025
 ** EpiTrello
 ** File description:
 ** edit-card-dialog
 */

"use client";
import React from "react";
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
import { Trash2, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CardType, LabelType } from "@/types/board";

type ChecklistItem = {
  id: number;
  card_id: number;
  title: string;
  checked: boolean;
  position?: number | null;
};

interface EditCardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  card: CardType | null;
  setCard: (card: CardType) => void;
  onSave: () => void;
  onAutoSave?: (card: CardType) => void;
  onDelete?: (cardId: number) => void;
  labels: LabelType[];
}

export function EditCardDialog({
  isOpen,
  onClose,
  card,
  setCard,
  onSave,
  onAutoSave,
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

          <div className="space-y-2">
            <Label>Checklist</Label>
            <div className="space-y-2">
              {(card.checklist || []).map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!item.checked}
                    onChange={(e) => {
                      const updatedCard = {
                        ...card,
                        checklist: (card.checklist || []).map((it) =>
                          it.id === item.id ? { ...it, checked: e.target.checked } : it
                        ),
                      } as CardType;
                      setCard(updatedCard);
                      // Auto-save immediately when checkbox is toggled
                      if (onAutoSave) {
                        onAutoSave(updatedCard);
                      }
                    }}
                  />
                  <input
                    className="flex-1 bg-white border rounded px-2 py-1"
                    value={item.title}
                    onChange={(e) =>
                      setCard({
                        ...card,
                        checklist: (card.checklist || []).map((it) =>
                          it.id === item.id ? { ...it, title: e.target.value } : it
                        ),
                      } as CardType)
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setCard({
                        ...card,
                        checklist: (card.checklist || []).filter((it) => it.id !== item.id),
                      } as CardType)
                    }
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}

              <AddChecklistInput
                onAdd={(title) => {
                  const nextId = Date.now() * -1; // temporary negative id
                  const newItem: ChecklistItem = {
                    id: nextId,
                    card_id: card.id,
                    title,
                    checked: false,
                  };
                  setCard({ ...card, checklist: [...(card.checklist || []), newItem] } as CardType);
                }}
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

function AddChecklistInput({ onAdd }: { onAdd: (title: string) => void }) {
  const [val, setVal] = React.useState("");
  return (
    <div className="flex gap-2">
      <Input
        placeholder="Nouvel item"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && val.trim()) {
            onAdd(val.trim());
            setVal("");
          }
        }}
      />
      <Button
        onClick={() => {
          if (!val.trim()) return;
          onAdd(val.trim());
          setVal("");
        }}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
