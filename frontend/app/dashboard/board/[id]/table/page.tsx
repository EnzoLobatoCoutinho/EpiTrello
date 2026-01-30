/*
 ** EPITECH PROJECT, 2025
 ** EpiTrello
 ** File description:
 ** page (Table View)
 */

"use client";

import React, { use, useState, useEffect } from "react";
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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

interface CardRowProps {
  card: CardType;
  label?: LabelType;
  listTitle: string;
  onEdit: (card: CardType) => void;
  onDelete: (id: number) => void;
}

function CardRow({ card, label, listTitle, onEdit, onDelete }: CardRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `card-${card.id}`,
    data: { type: "card", card },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow key={card.id} ref={setNodeRef as any} style={style} {...attributes} {...listeners}>
      <TableCell className="font-medium">{card.title}</TableCell>
      <TableCell>{listTitle}</TableCell>
      <TableCell>
        {label ? (
          <Badge variant="secondary" style={{ backgroundColor: label.color, color: "white" }}>
            {label.name}
          </Badge>
        ) : (
          "-"
        )}
      </TableCell>
      <TableCell className="max-w-[300px] truncate text-sm text-muted-foreground">{card.description || "-"}</TableCell>
      <TableCell className="text-sm">{card.start_date ? new Date(card.start_date).toLocaleDateString("fr-FR") : "-"}</TableCell>
      <TableCell className="text-sm">{card.due_date ? new Date(card.due_date).toLocaleDateString("fr-FR") : "-"}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(card)} className="h-8 w-8">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(card.id)} className="h-8 w-8 text-red-500 hover:bg-red-50">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

interface ListHeaderProps {
  list: ListType;
  count: number;
  onRename?: (list: ListType) => void;
}

function ListHeader({ list, count }: ListHeaderProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `list-${list.id}`, data: { type: "list", list } });

  return (
    <TableRow ref={setNodeRef as any} className={isOver ? "bg-accent/20" : "bg-muted/10"}>
      <TableCell colSpan={7} className="font-semibold py-2">
        <div className="flex items-center justify-between">
          <div>
            {list.title} ({count})
          </div>
          <div>
            <Button variant="ghost" size="icon" onClick={() => { if (typeof (window) !== 'undefined') { const ev = new CustomEvent('rename-list', { detail: { listId: list.id } }); window.dispatchEvent(ev); } }}>
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}


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
  const [labels, setLabels] = useState<LabelType[]>([]);
  const [loading, setLoading] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editedCard, setEditedCard] = useState<CardType | null>(null);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [activeCard, setActiveCard] = useState<CardType | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

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
        if (Array.isArray(data.labels)) setLabels(data.labels);
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
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000");
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

  // Listen for ListHeader edit button events
  useEffect(() => {
    function onRename(ev: any) {
      const listId = ev?.detail?.listId;
      if (typeof listId === "number") {
        handleRenameListById(listId);
      }
    }

    window.addEventListener("rename-list", onRename as any);
    return () => window.removeEventListener("rename-list", onRename as any);
  }, [lists]);

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
      // sanitize checklist: remove temporary/non-positive ids so server creates new items
      const payload: any = { ...editedCard } as any;
      if (Array.isArray(payload.checklist)) {
        payload.checklist = payload.checklist.map((it: any) => {
          const item: any = {
            title: String(it.title || "").slice(0, 255),
            checked: !!it.checked,
            position: it.position ?? null,
          };
          if (it.id && Number(it.id) > 0) item.id = Number(it.id);
          return item;
        });
      }
      console.log("Table saving card payload (sanitized):", payload);

      if (isNew) {
        res = await fetch(`/api/dashboard/board/${id}/lists/${editedCard.list_id}/cards`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(
          `/api/dashboard/board/${id}/lists/${editedCard.list_id}/cards/${editedCard.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
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
      await fetch(`/api/dashboard/board/${id}/lists/${card.list_id}/cards/${cardId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setCards((prev) => prev.filter((c) => c.id !== cardId));
    } catch {
      console.error("Error deleting");
    }
  }

  const updateCardPositions = async (updatedCards: CardType[]) => {
    const token = localStorage.getItem("token");
    updatedCards.forEach((card) => {
      fetch(`/api/dashboard/board/${id}/lists/${card.list_id}/cards/${card.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ position: card.position, list_id: card.list_id }),
      }).catch((e) => console.error("Error updating card position", e));
    });
  };

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    if (active.data.current?.type === "card") setActiveCard(active.data.current.card as CardType);
  }

  function handleDragOver(event: any) {
    const { active, over } = event as { active: any; over: any };
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (!activeId.startsWith("card-")) return;

    const activeCardId = Number(activeId.replace("card-", ""));
    const activeCardObj = cards.find((c) => c.id === activeCardId);
    if (!activeCardObj) return;

    let overListId: number | null = null;

    if (overId.startsWith("card-")) {
      const overCardId = Number(overId.replace("card-", ""));
      const overCard = cards.find((c) => c.id === overCardId);
      if (overCard) overListId = overCard.list_id;
    } else if (overId.startsWith("list-")) {
      const lid = Number(overId.replace("list-", ""));
      if (!isNaN(lid)) overListId = lid;
    }

    if (overListId !== null && activeCardObj.list_id !== overListId) {
      setCards((prev) => prev.map((c) => (c.id === activeCardId ? { ...c, list_id: overListId as number } : c)));
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event as DragEndEvent & { active: any; over: any };
    setActiveCard(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (!activeId.startsWith("card-")) return;

    const activeCardId = Number(activeId.replace("card-", ""));
    const oldIndex = cards.findIndex((c) => c.id === activeCardId);
    if (oldIndex === -1) return;

    let newIndex = -1;
    let targetListId = cards[oldIndex].list_id;

    if (overId.startsWith("card-")) {
      const overCardId = Number(overId.replace("card-", ""));
      const overIndex = cards.findIndex((c) => c.id === overCardId);
      if (overIndex !== -1) {
        newIndex = overIndex;
        targetListId = cards[overIndex].list_id;
      }
    } else if (overId.startsWith("list-")) {
      const overListId = Number(overId.replace("list-", ""));
      if (!isNaN(overListId)) {
        targetListId = overListId;
        // place at end of list
        newIndex = cards.filter((c) => c.list_id === overListId).length;
        if (cards[oldIndex].list_id === overListId) {
          newIndex = oldIndex;
        }
      }
    }

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(cards, oldIndex, newIndex);
      const final = reordered.map((card, idx) => ({ ...card, position: idx, list_id: card.list_id }));
      setCards(final);

      const cardsToUpdate = final.filter((c) => c.list_id === targetListId);
      updateCardPositions(cardsToUpdate);
    }
  }

  async function handleRenameListById(listId: number) {
    const list = lists.find((l) => l.id === listId);
    if (!list) return;
    const newTitle = prompt("Nouveau titre de la liste", list.title);
    if (!newTitle || newTitle.trim() === "" || newTitle.trim() === list.title) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/dashboard/board/${id}/lists/${listId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      if (!res.ok) throw new Error("Error renaming list");
      const updated = await res.json();
      setLists((prev) => prev.map((l) => (l.id === updated.id ? { ...l, title: updated.title } : l)));
    } catch (err) {
      console.error("Error renaming list", err);
      alert("Impossible de renommer la liste");
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
              {t("board.view.table")}
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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={cards.map((c) => `card-${c.id}`)} strategy={verticalListSortingStrategy}>
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
              {lists.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    {t("table.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                // Render each list as a section with its own header row
                lists.map((list) => {
                  const listCards = cards
                    .filter((c) => c.list_id === list.id)
                    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

                  return (
                    <React.Fragment key={`list-${list.id}`}>
                      <ListHeader list={list} count={listCards.length} />

                      {listCards.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-sm text-muted-foreground">
                            — Aucune carte dans cette liste —
                          </TableCell>
                        </TableRow>
                      ) : (
                        listCards.map((card) => {
                          const label = getLabel(card.label_id);
                          const listTitle = getListTitle(card.list_id);
                          return (
                            <CardRow key={`card-${card.id}`} card={card} label={label} listTitle={listTitle} onEdit={handleEditClick} onDelete={handleDelete} />
                          );
                        })
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
              </Table>
            </SortableContext>
          </DndContext>
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
