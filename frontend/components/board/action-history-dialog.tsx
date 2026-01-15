/*
 ** EPITECH PROJECT, 2025
 ** EpiTrello
 ** File description:
 ** action-history-dialog
 */

"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ActionHistoryItem {
  id: number;
  action_type: string;
  entity_type: string;
  entity_id: number;
  user: {
    username: string;
    email: string;
  };
  created_at: string;
}

interface ActionHistoryDialogProps {
  boardId: number;
}

export function ActionHistoryDialog({ boardId }: ActionHistoryDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [actions, setActions] = useState<ActionHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [rollingBackId, setRollingBackId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchActionHistory();
    }
  }, [isOpen]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    // Reload page when closing the modal
    if (!open) {
      window.location.reload();
    }
  };

  const fetchActionHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/rollback?boardId=${boardId}&limit=50`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
      );
      if (response.ok) {
        const data = await response.json();
        setActions(data.data || []);
      } else {
        toast.error("Erreur lors du chargement de l'historique");
      }
    } catch (error) {
      toast.error("Erreur lors du chargement de l'historique");
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async () => {
    if (actions.length === 0) return;
    
    const latestAction = actions[0];
    setRollingBackId(latestAction.id);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/rollback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          actionHistoryId: latestAction.id,
          boardId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Action annulée avec succès");
        // Reload the history without closing the modal
        await fetchActionHistory();
      } else {
        toast.error(data.error || "Erreur lors de l'annulation");
      }
    } catch (error) {
      toast.error("Erreur lors de l'annulation");
    } finally {
      setRollingBackId(null);
    }
  };

  const getActionLabel = (actionType: string): string => {
    const labels: Record<string, string> = {
      create_card: "Création de carte",
      delete_card: "Suppression de carte",
      update_card: "Modification de carte",
      create_list: "Création de liste",
      delete_list: "Suppression de liste",
      update_list: "Modification de liste",
    };
    return labels[actionType] || actionType;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          title="Historique des actions"
        >
          <RotateCcw className="w-4 h-4" />
          Annuler une action
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Historique des actions</DialogTitle>
          <DialogDescription>
            Liste complète des actions effectuées sur ce tableau
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : actions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucune action enregistrée
          </div>
        ) : (
          <>
            <div className="overflow-y-auto pr-2 space-y-2 flex-1">
              {actions.map((action, index) => (
                <div
                  key={action.id}
                  className={`p-3 border rounded-lg ${index === 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{getActionLabel(action.action_type)}</p>
                        {index === 0 && (
                          <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
                            Dernière action
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {action.user.username} • {new Date(action.created_at).toLocaleString("fr-FR")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t mt-4">
              <Button
                onClick={handleRollback}
                disabled={rollingBackId !== null}
                className="w-full"
                variant="destructive"
              >
                {rollingBackId !== null ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Annulation en cours...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Annuler la dernière action
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
