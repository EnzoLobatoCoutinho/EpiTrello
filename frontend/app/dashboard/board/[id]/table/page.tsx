/*
 ** EPITECH PROJECT, 2025
 ** EpiTrello
 ** File description:
 ** page (Table View)
 */

"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Edit, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { io } from "socket.io-client";

import { EditCardDialog } from "@/components/board/edit-card-dialog";
import type { CardType, ListType, LabelType } from "@/types/board";
import { useClientT } from "@/lib/i18n-client";

const boardLabels: Record<string, LabelType[]> = {
  "1": [
    { id: 1, board_id: 1, name: "Design", color: "#8B5CF6" },
    { id: 2, board_id: 1, name: "Dev", color: "#3B82F6" },
    { id: 3, board_id: 1, name: "Contenu", color: "#10B981" },
    { id: 4, board_id: 1, name: "Bug", color: "#EF4444" },
    { id: 5, board_id: 1, name: "Feature", color: "#F59E0B" },
    { id: 6, board_id: 1, name: "Urgent", color: "#DC2626" },
  ],
};

export default function TablePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { t } = useClientT("dashboard");

  const [board, setBoard] = useState<{
    id: number;
    title: string;
    color?: string;
  } | null>(null);
  const [lists, setLists] = useState<ListType[]>([]);
  const [cards, setCards] = useState<CardType[]>([]);
  const [labels] = useState<LabelType[]>(boardLabels[id] || []);
  const [loading, setLoading] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editedCard, setEditedCard] = useState<CardType | null>(null);
  const [isAddingCard, setIsAddingCard] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setLoading(true);
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      try {
        const res = await fetch(`/api/dashboard/board/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (!res.ok) throw new Error("Erreur chargement board");

        const data = await res.json();
        if (!mounted) return;

        if (data.board) {
          setBoard(data.board);
        } else if (data.boardsData && data.boardsData[id]) {
          const bd = data.boardsData[id];
          setBoard({ id: Number(id), title: bd.name, color: bd.color });
        }

        const apiLists = Array.isArray(data.lists) ? data.lists : [];
        setLists(apiLists);

        const allCards: CardType[] = [];
        apiLists.forEach((l: any) => {
          if (l.cards) allCards.push(...l.cards);
        });
        setCards(allCards);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    const socket = io("http://localhost:4000");
    socket.on("connect", () => socket.emit("join-board", id));

    socket.on("card-moved", (updatedCard: CardType) => {
      setCards((prev) => {
        const exists = prev.find((c) => c.id === updatedCard.id);
        if (exists) {
          return prev.map((c) => (c.id === updatedCard.id ? updatedCard : c));
        }
        return [...prev, updatedCard];
      });
    });

    socket.on("card-deleted", (data: { id: number }) => {
      console.log("🗑️ Carte supprimée en temps réel:", data.id);
      setCards((prev) => prev.filter((c) => c.id !== data.id));
    });

    return () => {
      socket.disconnect();
    };
  }, [id]);

  function handleAddCardClick() {
    setIsAddingCard(true);
    const now = new Date().toISOString();
    const defaultListId = lists.length > 0 ? lists[0].id : 0;

    setEditedCard({
      id: 0,
      list_id: defaultListId,
      label_id: null,
      title: "",
      description: "",
      start_date: now,
      due_date: now,
      position: cards.length,
    });
    setIsDialogOpen(true);
  }

  function handleEditClick(card: CardType) {
    setIsAddingCard(false);
    setEditedCard({ ...card });
    setIsDialogOpen(true);
  }

  async function handleSave() {
    if (!editedCard || !editedCard.title.trim()) return;
    const token = localStorage.getItem("token");
    const isNew = isAddingCard;

    try {
      let res;
      if (isNew) {
        res = await fetch(`/api/dashboard/lists/${editedCard.list_id}/cards`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(editedCard),
        });
      } else {
        res = await fetch(
          `/api/dashboard/lists/${editedCard.list_id}/cards/${editedCard.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(editedCard),
          }
        );
      }

      if (!res.ok) throw new Error(`Erreur API: ${res.status}`);
      const data = await res.json();

      if (isNew) setCards((prev) => [...prev, data]);
      else setCards((prev) => prev.map((c) => (c.id === data.id ? data : c)));

      setIsDialogOpen(false);
    } catch (e) {
      console.error("Error saving card:", e);
    }
  }

  async function handleDelete(cardId: number) {
    if (!confirm(t("table.delete.confirm"))) return;
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;

    try {
      const token = localStorage.getItem("token");
      await fetch(`/api/dashboard/lists/${card.list_id}/cards/${cardId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setCards((prev) => prev.filter((c) => c.id !== cardId));
    } catch {
      console.error("Error deleting");
    }
  }

  const getListTitle = (lid: number) =>
    lists.find((l) => l.id === lid)?.title || "N/A";
  const getLabel = (lid: number | null) =>
    lid ? labels.find((l) => l.id === lid) : undefined;

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        {t("table.loading")}
      </div>
    );
  if (!board) return <div>{t("board.notFound")}</div>;

  return (
    <div className="flex h-screen flex-col">
      <div className={`${board.color || "bg-blue-600"} p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-white">
              {board.title} - {t("board.view.table")}
            </h1>
          </div>
          <div className="flex gap-2">
            <Link href={`/dashboard/board/${id}`}>
              <Button variant="secondary">{t("board.view.kanban")}</Button>
            </Link>
            <Button variant="secondary" onClick={handleAddCardClick}>
              <Plus className="mr-2 h-4 w-4" /> {t("table.add")}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-slate-50 p-6">
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">{t("table.header.title")}</TableHead>
                <TableHead className="w-[150px]">{t("table.header.list")}</TableHead>
                <TableHead className="w-[120px]">{t("table.header.label")}</TableHead>
                <TableHead className="w-[300px]">{t("table.header.description")}</TableHead>
                <TableHead className="w-[120px]">{t("table.header.start")}</TableHead>
                <TableHead className="w-[120px]">{t("table.header.end")}</TableHead>
                <TableHead className="w-[100px] text-right">{t("table.header.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cards.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {t("table.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                cards.map((card) => {
                  const label = getLabel(card.label_id);
                  return (
                    <TableRow key={card.id}>
                      <TableCell className="font-medium">
                        {card.title}
                      </TableCell>
                      <TableCell>{getListTitle(card.list_id)}</TableCell>
                      <TableCell>
                        {label ? (
                          <Badge
                            variant="secondary"
                            style={{
                              backgroundColor: label.color,
                              color: "white",
                            }}
                          >
                            {label.name}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate text-sm text-muted-foreground">
                        {card.description || "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {card.start_date
                          ? new Date(card.start_date).toLocaleDateString(
                              "fr-FR"
                            )
                          : "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {card.due_date
                          ? new Date(card.due_date).toLocaleDateString("fr-FR")
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(card)}
                            className="h-8 w-8"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(card.id)}
                            className="h-8 w-8 text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <EditCardDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        card={editedCard}
        setCard={setEditedCard as any}
        onSave={handleSave}
        labels={labels}
      />
    </div>
  );
}
