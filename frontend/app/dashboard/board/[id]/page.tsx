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
import { ArrowLeft, Plus, Tag, Users, Download, Upload, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BoardList } from "@/components/board/board-list";
import { EditCardDialog } from "@/components/board/edit-card-dialog";
import { CreateLabelDialog } from "@/components/board/create-label-dialog";
import { ActionHistoryDialog } from "@/components/board/action-history-dialog";
import type { CardType, ListType, LabelType } from "@/types/board";


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
  const [labels, setLabels] = useState<LabelType[]>([]);

  const [activeCard, setActiveCard] = useState<CardType | null>(null);
  const [activeList, setActiveList] = useState<ListType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editedCard, setEditedCard] = useState<CardType | null>(null);
  const [isLabelDialogOpen, setIsLabelDialogOpen] = useState(false);

  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [addingCardListId, setAddingCardListId] = useState<number | null>(null);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [isSavingCard, setIsSavingCard] = useState(false);
  const fileInputRef = useState<HTMLInputElement | null>(null)[0];
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  useEffect(() => {
    try {
      if (editedCard && typeof window !== "undefined") {
        try {
          sessionStorage.setItem(`editedCard-${editedCard.id}`, JSON.stringify(editedCard));
        } catch (e) {
          console.warn("Could not save editedCard to sessionStorage", e);
        }
      }
    } catch {}
  }, [editedCard]);

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

        if (data.labels) setLabels(data.labels);

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
    // Check if calendar is connected
    async function checkCalendarConnection() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch('/api/user/calendar-status', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (res.ok) {
          const data = await res.json();
          setIsCalendarConnected(data.connected);
        }
      } catch (e) {
        console.error('Failed to check calendar status:', e);
      }
    }
    checkCalendarConnection();
  }, []);

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL);
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

    socket.on("card-deleted", (data: { id: number }) => {
      setCards((prev) => prev.filter((c) => c.id !== data.id));
    });

    socket.on("list-deleted", (data: { id: number }) => {
      setLists((prev) => prev.filter((l) => l.id !== data.id));
      setCards((prev) => prev.filter((c) => c.list_id !== data.id));
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

  const handleAutoSaveCard = async (cardToSave: CardType) => {
    const token = localStorage.getItem("token");
    try {
      // Sanitize and log payload. Always include `checklist` (may be empty)
      const payload: any = { ...cardToSave } as any;
      payload.checklist = (cardToSave?.checklist || []).map((it: any) => {
        const item: any = {
          title: String(it.title || "").slice(0, 255),
          checked: !!it.checked,
          position: it.position ?? null,
        };
        // only include id if it's a positive existing id
        if (it && it.id && Number(it.id) > 0) item.id = Number(it.id);
        return item;
      });
      console.log("Auto-saving card payload (sanitized):", payload);

      const res = await fetch(
        `/api/dashboard/board/${id}/lists/${cardToSave.list_id}/cards/${cardToSave.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const text = await res.text().catch(() => "<no body>");
        console.error("Auto-save card failed:", res.status, text);
        throw new Error(`API ${res.status}`);
      }
      const updated = await res.json();
      setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } catch (e) {
      console.error("Error auto-saving card:", e);
    }
  };

  const handleSaveCard = async () => {
    if (!editedCard) return;
    await handleAutoSaveCard(editedCard);
    // Remove draft from sessionStorage after successful save
    try {
      if (typeof window !== "undefined") sessionStorage.removeItem(`editedCard-${editedCard.id}`);
    } catch (e) {}
    setIsDialogOpen(false);
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
      // Don't add immediately - let Socket.IO handle it to avoid duplicates
      // setLists((prev) => [...prev, newList]);
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

  async function handleDeleteCard(cardId: number) {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;
    if (!confirm("Supprimer cette carte ?")) return;
    const token = localStorage.getItem("token");
    try {
      await fetch(
        `/api/dashboard/board/${id}/lists/${card.list_id}/cards/${cardId}`,
        {
          method: "DELETE",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
      );
      setCards((prev) => prev.filter((c) => c.id !== cardId));
      try {
        if (typeof window !== "undefined") sessionStorage.removeItem(`editedCard-${cardId}`);
      } catch (e) {}
      setIsDialogOpen(false);
    } catch (err) {
      console.error("Error deleting card", err);
    }
  }

  async function handleListAction(action: string, list: ListType) {
    const token = localStorage.getItem("token");
    if (action === "menu") {
      const choice = prompt("Entrez 'rename' pour renommer ou 'delete' pour supprimer la liste");
      if (!choice) return;
      if (choice === "delete") {
        if (!confirm(`Supprimer la liste '${list.title}' ?`)) return;
        try {
          await fetch(`/api/dashboard/board/${id}/lists/${list.id}`, {
            method: "DELETE",
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });
          setLists((prev) => prev.filter((l) => l.id !== list.id));
          setCards((prev) => prev.filter((c) => c.list_id !== list.id));
        } catch (err) {
          console.error("Error deleting list", err);
        }
      } else if (choice === "rename") {
        const newTitle = prompt("Nouveau titre de la liste", list.title);
        if (!newTitle) return;
        try {
          const res = await fetch(`/api/dashboard/board/${id}/lists/${list.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ title: newTitle }),
          });
          if (res.ok) {
            const updated = await res.json();
            setLists((prev) => prev.map((l) => (l.id === updated.id ? { ...l, title: updated.title } : l)));
          }
        } catch (err) {
          console.error("Error renaming list", err);
        }
      }
    }
  }

  const handleConnectCalendar = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch('/api/auth/google-calendar/url', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await res.json();
      window.location.href = data.url;
    } catch (e) {
      console.error('Failed to get calendar auth URL:', e);
      alert('Erreur lors de la connexion à Google Calendar');
    }
  };

  async function handleExportJSON() {
    const exportData = {
      lists: lists.map(l => ({ 
        title: l.title, 
        cards: cards.filter(c => c.list_id === l.id).map(card => ({
          title: card.title,
          description: card.description,
          position: card.position
        }))
      })),
      labels: labels.map(label => ({
        name: label.name,
        color: label.color
      })),
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `board-${board?.title || id}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function handleImportJSON(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      if (!importData.lists || !Array.isArray(importData.lists)) {
        alert("Format JSON invalide");
        return;
      }

      const token = localStorage.getItem("token");

      // Import lists and cards
      for (const list of importData.lists) {
        const resList = await fetch(`/api/dashboard/board/${id}/lists`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ title: list.title }),
        });

        if (!resList.ok) {
          console.error("Failed to create list:", list.title);
          continue;
        }
        const newList = await resList.json();

        // Import cards for this list
        if (list.cards && Array.isArray(list.cards)) {
          for (const card of list.cards) {
            const cardRes = await fetch(`/api/dashboard/board/${id}/lists/${newList.id}/cards`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({
                title: card.title,
                description: card.description || "",
              }),
            });

            if (!cardRes.ok) {
              console.error("Failed to create card:", card.title);
            }
          }
        }
      }

      // Wait for DB to propagate
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Reload board data
      const res = await fetch(`/api/dashboard/board/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (res.ok) {
        const data = await res.json();
        if (data.board) setBoard(data.board);
        
        // Reconstruct cards from lists
        const allCards: CardType[] = [];
        data.lists?.forEach((l: any) => {
          if (l.cards) allCards.push(...l.cards);
        });
        
        setLists(data.lists?.map((l: any) => ({ ...l, position: l.position ?? 0 })) || []);
        setCards(allCards.map((c: any) => ({ ...c, position: c.position ?? 0 })));
        setLabels(data.labels || []);
        
        // Show success message after state is updated
        setTimeout(() => alert("Import réussi !"), 100);
      } else {
        alert("Erreur lors du rechargement des données");
      }
    } catch (error) {
      console.error("Erreur d'import:", error);
      alert("Erreur lors de l'import du fichier JSON");
    }

    // Reset input
    event.target.value = "";
  }

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
          <div className="flex items-center gap-2">
            {!isCalendarConnected && (
              <Button
                variant="secondary"
                onClick={handleConnectCalendar}
                className="gap-2"
              >
                <CalendarIcon className="h-4 w-4" />
                Connecter Calendar
              </Button>
            )}
            {isCalendarConnected && (
              <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1.5 rounded-md text-sm font-medium">
                <CalendarIcon className="h-4 w-4" />
                Calendar connecté
              </div>
            )}
            <ActionHistoryDialog boardId={Number(id)} />
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={handleExportJSON}
              title="Exporter en JSON"
            >
              <Download className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => document.getElementById('import-json-input')?.click()}
              title="Importer depuis JSON"
            >
              <Upload className="h-5 w-5" />
            </Button>
            <input
              id="import-json-input"
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportJSON}
            />
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => setIsLabelDialogOpen(true)}
              title="Gérer les labels"
            >
              <Tag className="h-5 w-5" />
            </Button>
            <Link href={`/dashboard/board/${id}/members`}>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                title="Gérer les membres"
              >
                <Users className="h-5 w-5" />
              </Button>
            </Link>
            <Link href={`/dashboard/board/${id}/table`}>
              <Button variant="secondary">{t("board.view.table")}</Button>
            </Link>
          </div>
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
                  key={`list-${list.id}`}
                  list={list}
                  cards={cards
                    .filter((c) => c.list_id === list.id)
                    .sort((a, b) => a.position - b.position)}
                  labels={labels}
                  onCardClick={(c) => {
                    setEditedCard(c);
                    setIsDialogOpen(true);
                  }}
                  onListAction={handleListAction}
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
        onAutoSave={handleAutoSaveCard}
        onDelete={handleDeleteCard}
        labels={labels}
      />

      <CreateLabelDialog
        isOpen={isLabelDialogOpen}
        onClose={() => setIsLabelDialogOpen(false)}
        boardId={id}
        onCreated={(label) => setLabels((prev) => [...prev, label])}
      />
    </div>
  );
}
