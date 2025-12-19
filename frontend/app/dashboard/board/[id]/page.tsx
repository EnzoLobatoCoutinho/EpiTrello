/*
 ** EPITECH PROJECT, 2025
 ** EpiTrello
 ** File description:
 ** page
 */

"use client";

import { use } from "react";
import { useState, useEffect } from "react";
import { useClientT } from "@/lib/i18n-client";
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { io } from "socket.io-client";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BoardList } from "@/components/board/board-list";
import { EditCardDialog } from "@/components/board/edit-card-dialog";
import type { CardType, ListType, LabelType } from "@/types/board";

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

export default function BoardPage({
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

  const [activeCard, setActiveCard] = useState<CardType | null>(null);
  const [activeList, setActiveList] = useState<ListType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editedCard, setEditedCard] = useState<CardType | null>(null);

  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [addingCardListId, setAddingCardListId] = useState<number | null>(null);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [isSavingCard, setIsSavingCard] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/dashboard/board/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) return;
        const data = await res.json();

        if (data.board) setBoard(data.board);
        setLists(
          data.lists.map((l: any) => ({ ...l, position: l.position ?? 0 }))
        );

        const allCards: CardType[] = [];
        data.lists.forEach((l: any) => {
          if (l.cards) allCards.push(...l.cards);
        });
        setCards(allCards);
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, [id]);

  useEffect(() => {
    const socket = io("http://localhost:4000");
    socket.on("connect", () => socket.emit("join-board", id));

    socket.on("card-moved", (updated: CardType) => {
      setCards((prev) => {
        let newCards;
        const exists = prev.find((c) => c.id === updated.id);

        if (exists) {
          newCards = prev.map((c) => (c.id === updated.id ? updated : c));
        } else {
          newCards = [...prev, updated];
        }
        return newCards.sort((a, b) => a.position - b.position);
      });
    });

    socket.on("list-added", (newList: ListType) => {
      setLists((prev) =>
        prev.find((l) => l.id === newList.id) ? prev : [...prev, newList]
      );
    });

    socket.on("list-updated", (updatedList: ListType) => {
      setLists((prev) => {
        const newLists = prev.map((l) =>
          l.id === updatedList.id ? { ...l, ...updatedList } : l
        );
        return [...newLists].sort((a, b) => a.position - b.position);
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [id]);

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    if (active.data.current?.type === "list")
      setActiveList(active.data.current.list);
    else if (active.data.current?.type === "card")
      setActiveCard(active.data.current.card);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (!activeId.startsWith("card-")) return;

    const activeCardId = Number(activeId.replace("card-", ""));
    const activeCard = cards.find((c) => c.id === activeCardId);
    if (!activeCard) return;

    let overListId: number | null = null;

    if (overId.startsWith("list-")) {
      overListId = Number(overId.replace("list-", ""));
    } else if (overId.startsWith("card-")) {
      const overCardId = Number(overId.replace("card-", ""));
      const overCard = cards.find((c) => c.id === overCardId);
      if (overCard) overListId = overCard.list_id;
    }

    if (overListId !== null && activeCard.list_id !== overListId) {
      setCards((prev) => {
        const activeItems = prev.find((i) => i.id === activeCardId);
        if (!activeItems) return prev;

        return prev.map((c) =>
          c.id === activeCardId ? { ...c, list_id: overListId as number } : c
        );
      });
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveCard(null);
    setActiveList(null);

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    console.log(`Drop: ${activeId} over ${overId}`);

    if (activeId.startsWith("card-")) {
      const activeCardId = Number(activeId.replace("card-", ""));

      const oldIndex = cards.findIndex((c) => c.id === activeCardId);
      if (oldIndex === -1) return;

      const activeCard = cards[oldIndex];
      let newIndex = -1;
      let targetListId = activeCard.list_id;

      if (overId.startsWith("card-")) {
        const overCardId = Number(overId.replace("card-", ""));
        const overIndex = cards.findIndex((c) => c.id === overCardId);
        if (overIndex !== -1) {
          newIndex = overIndex;
          targetListId = cards[overIndex].list_id;
        }
      } else if (overId.startsWith("list-")) {
        const overListId = Number(overId.replace("list-", ""));
        targetListId = overListId;
        newIndex = cards.filter((c) => c.list_id === overListId).length;
        if (activeCard.list_id === overListId) {
          newIndex = oldIndex;
        }
      }

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedCards = arrayMove(cards, oldIndex, newIndex);

        const finalCards = reorderedCards.map((card, index) => {
          if (card.id === activeCardId) {
            return { ...card, list_id: targetListId, position: index };
          }
          return { ...card, position: index };
        });

        setCards(finalCards);

        const cardsToUpdate = finalCards.filter(
          (c) => c.list_id === targetListId
        );
        updateCardPositions(cardsToUpdate);
      }
    }

    else if (activeId.startsWith("list-") && overId.startsWith("list-")) {
      const activeListId = Number(activeId.replace("list-", ""));
      const overListId = Number(overId.replace("list-", ""));

      const oldIndex = lists.findIndex((l) => l.id === activeListId);
      const newIndex = lists.findIndex((l) => l.id === overListId);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const reorderedLists = arrayMove(lists, oldIndex, newIndex);
        const updatedLists = reorderedLists.map((list, index) => ({
          ...list,
          position: index,
        }));

        setLists(updatedLists);
        updateListPosition(activeListId, newIndex);
      }
    }
  }

  const updateListPosition = async (listId: number, newPosition: number) => {
    const token = localStorage.getItem("token");
    try {
      await fetch(`/api/dashboard/board/${id}/lists/${listId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ position: newPosition }),
      });
    } catch (error) {
      console.error("Erreur save list position:", error);
    }
  };

  const handleSaveCard = async () => {
    if (!editedCard) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `/api/dashboard/board/${id}/lists/${editedCard.list_id}/cards/${editedCard.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(editedCard),
        }
      );
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setIsDialogOpen(false);
    } catch {
      console.error("Error saving card");
    }
  };

  const handleSaveNewCard = async () => {
    if (!newCardTitle.trim() || !addingCardListId || isSavingCard) return;
    setIsSavingCard(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `/api/dashboard/board/${id}/lists/${addingCardListId}/cards`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title: newCardTitle }),
        }
      );
      await res.json();
      setNewCardTitle("");
      setAddingCardListId(null);
    } catch {
      console.error("Error creating card");
    } finally {
      setIsSavingCard(false);
    }
  };

  const handleAddList = async () => {
    if (!newListTitle.trim()) return;
    const token = localStorage.getItem("token");
    console.log("token", token);
    try {
      const res = await fetch(`/api/dashboard/board/${id}/lists`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newListTitle }),
      });
      const newList = await res.json();
      setLists((prev) => [...prev, newList]);
      setNewListTitle("");
      setIsAddingList(false);
    } catch {
      console.error("Error creating list");
    }
  };

  const updateCardPositions = async (updatedCards: CardType[]) => {
    const token = localStorage.getItem("token");
    updatedCards.forEach((card) => {
      fetch(
        `/api/dashboard/board/${id}/lists/${card.list_id}/cards/${card.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            position: card.position,
            list_id: card.list_id,
          }),
        }
      );
    });
  };

  if (!board)
    return (
      <div className="flex h-screen items-center justify-center">
        Chargement...
      </div>
    );

  return (
    <div className="flex h-screen flex-col">
      {/* HEADER */}
      <div className={`${board.color || "bg-blue-600"} p-4`}>
        <div className="mb-4 flex items-center justify-between">
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
            <h1 className="text-2xl font-bold text-white">{board.title}</h1>
          </div>
          <Link href={`/dashboard/board/${id}/table`}>
            <Button variant="secondary">{t("board.view.table")}</Button>
          </Link>
        </div>
      </div>

      {/* CANVAS */}
      <div className="flex-1 overflow-x-auto bg-slate-50 p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={lists.map((l) => `list-${l.id}`)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex gap-4 h-full items-start">
              {/* LISTES */}
              {lists.map((list) => (
                <BoardList
                  key={list.id}
                  list={list}
                  cards={cards
                    .filter((c) => c.list_id === list.id)
                    .sort((a, b) => a.position - b.position)}
                  labels={labels}
                  onCardClick={(c) => {
                    setEditedCard(c);
                    setIsDialogOpen(true);
                  }}
                  isAddingCard={addingCardListId === list.id}
                  newCardTitle={newCardTitle}
                  setNewCardTitle={setNewCardTitle}
                  onAddCardClick={setAddingCardListId}
                  onSaveNewCard={handleSaveNewCard}
                  onCancelAddCard={() => {
                    setAddingCardListId(null);
                    setNewCardTitle("");
                  }}
                />
              ))}

              {/* BOUTON NOUVELLE LISTE */}
              <div className="w-72 flex-shrink-0">
                {isAddingList ? (
                  <Card className="bg-white p-3">
                    <Input
                      placeholder="Nouvelle liste"
                      value={newListTitle}
                      onChange={(e) => setNewListTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddList();
                      }}
                      autoFocus
                    />
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" onClick={handleAddList}>
                        Ajouter
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsAddingList(false)}
                      >
                        X
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <Button
                    className="w-full justify-start bg-white/20 hover:bg-white/30 text-black border-dashed border-2"
                    variant="outline"
                    onClick={() => setIsAddingList(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" /> {t("list.addList.trigger")}
                  </Button>
                )}
              </div>
            </div>
          </SortableContext>

          <DragOverlay>{/* Check si tu veux mettre un overlay */}</DragOverlay>
        </DndContext>
      </div>

      <EditCardDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        card={editedCard}
        setCard={setEditedCard as any}
        onSave={handleSaveCard}
        labels={labels}
      />
    </div>
  );
}
