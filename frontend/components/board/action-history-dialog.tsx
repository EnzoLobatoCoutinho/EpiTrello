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

  const fetchActionHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/rollback?boardId=${boardId}&limit=20`,
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

  const handleRollback = async (actionId: number) => {
    setRollingBackId(actionId);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/rollback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          actionHistoryId: actionId,
          boardId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Action annulée avec succès");
        setActions(actions.filter((a) => a.id !== actionId));
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
      <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Historique des actions</DialogTitle>
          <DialogDescription>
            Cliquez sur "Annuler" pour revenir à l'état précédent d'une action
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : actions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucune action récente à annuler
          </div>
        ) : (
          <div className="space-y-2">
            {actions.map((action) => (
              <div
                key={action.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <p className="font-medium">{getActionLabel(action.action_type)}</p>
                  <p className="text-sm text-gray-500">
                    {action.user.username} •{" "}
                    {new Date(action.created_at).toLocaleString("fr-FR")}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRollback(action.id)}
                  disabled={rollingBackId === action.id}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {rollingBackId === action.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Annuler
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
