"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Plus, MoreHorizontal, GripVertical, Tag, Calendar } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
  type DragOverEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label as UILabel } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

type LabelType = {
  id: number
  board_id: number
  name: string
  color: string
}

type CardType = {
  id: number
  list_id: number
  label_id: number | null
  title: string
  description: string
  start_date: string
  due_date: string
  position: number
}

type ListType = {
  id: number
  board_id: number
  title: string
  position: number
}

const boardLabels: Record<string, LabelType[]> = {
  "1": [
    { id: 1, board_id: 1, name: "Design", color: "#8B5CF6" },
    { id: 2, board_id: 1, name: "Dev", color: "#3B82F6" },
    { id: 3, board_id: 1, name: "Contenu", color: "#10B981" },
    { id: 4, board_id: 1, name: "Bug", color: "#EF4444" },
    { id: 5, board_id: 1, name: "Feature", color: "#F59E0B" },
    { id: 6, board_id: 1, name: "Urgent", color: "#DC2626" },
  ],
}

function SortableCard({ card, label, onClick }: { card: CardType; label: LabelType | undefined; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `card-${card.id}`,
    data: { type: "card", card },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="cursor-grab p-3 transition-shadow hover:shadow-md active:cursor-grabbing"
    >
      <h3 className="mb-2 font-medium text-foreground">{card.title}</h3>

      <div className="mb-2 flex flex-wrap gap-2">
        {label && (
          <Badge
            variant="secondary"
            className="flex items-center gap-1 text-xs"
            style={{ backgroundColor: label.color, color: "white" }}
          >
            <Tag className="h-3 w-3" />
            {label.name}
          </Badge>
        )}
        {card.due_date && (
          <Badge variant="outline" className="flex items-center gap-1 text-xs">
            <Calendar className="h-3 w-3" />
            {new Date(card.due_date).toLocaleDateString("fr-FR")}
          </Badge>
        )}
      </div>

      {card.description && <p className="text-sm text-muted-foreground">{card.description}</p>}
    </Card>
  )
}

function DroppableList({
  list,
  cards,
  labels,
  dragHandleProps,
  onCardClick,
  onAddCard,
}: {
  list: ListType
  cards: CardType[]
  labels: LabelType[]
  dragHandleProps?: any
  onCardClick: (card: CardType) => void
  onAddCard: () => void
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `list-${list.id}`,
    data: { type: "list", list },
  })

  return (
    <Card className="bg-background">
      <div className="p-3">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            <h2 className="font-semibold text-foreground">{list.title}</h2>
            <span className="text-sm text-muted-foreground">({cards.length})</span>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        <div ref={setNodeRef} className={`min-h-[100px] rounded ${isOver ? "bg-accent/50" : ""}`}>
          <SortableContext items={cards.map((c) => `card-${c.id}`)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {cards.map((card) => {
                const cardLabel = labels.find((l) => l.id === card.label_id)
                return <SortableCard key={card.id} card={card} label={cardLabel} onClick={() => onCardClick(card)} />
              })}
              {cards.length === 0 && (
                <div className="flex h-20 items-center justify-center rounded border-2 border-dashed border-muted-foreground/20">
                  <p className="text-sm text-muted-foreground">Déposez une carte ici</p>
                </div>
              )}
            </div>
          </SortableContext>
        </div>

        <Button
          variant="ghost"
          className="mt-2 w-full justify-start gap-2 text-muted-foreground hover:bg-accent"
          onClick={onAddCard}
        >
          <Plus className="h-4 w-4" />
          Ajouter une carte
        </Button>
      </div>
    </Card>
  )
}

function SortableList({
  list,
  cards,
  labels,
  onCardClick,
  onAddCard,
}: {
  list: ListType
  cards: CardType[]
  labels: LabelType[]
  onCardClick: (card: CardType) => void
  onAddCard: (listId: number) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `list-${list.id}`,
    data: { type: "list", list },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="w-72 flex-shrink-0">
      <DroppableList
        list={list}
        cards={cards}
        labels={labels}
        dragHandleProps={{ ...attributes, ...listeners }}
        onCardClick={onCardClick}
        onAddCard={() => onAddCard(list.id)}
      />
    </div>
  )
}

export default function BoardPage({ params }: { params: { id: string } }) {
  const { id } = params
  const [board, setBoard] = useState<{ id: number; title: string; color?: string; workspace_id?: number; description?: string } | null>(
    null,
  )
  const labels = boardLabels[id] || []
  const [lists, setLists] = useState<ListType[]>([])
  const [cards, setCards] = useState<CardType[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCard, setActiveCard] = useState<CardType | null>(null)
  const [activeList, setActiveList] = useState<ListType | null>(null)
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editedCard, setEditedCard] = useState<CardType | null>(null)
  const [isAddingList, setIsAddingList] = useState(false)
  const [newListTitle, setNewListTitle] = useState("")
  const [addingCardListId, setAddingCardListId] = useState<number | null>(null)
  const [newCardTitle, setNewCardTitle] = useState("")

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  function getCardsForList(listId: number): CardType[] {
    return cards.filter((card) => card.list_id === listId).sort((a, b) => a.position - b.position)
  }

  function handleCardClick(card: CardType) {
    setSelectedCard(card)
    setEditedCard({ ...card })
    setIsDialogOpen(true)
  }

  const handleSaveCard = async () => {
  if (!editedCard) return;

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  
  console.log("🔍 Tentative de sauvegarde:", {
    cardId: editedCard.id,
    listId: editedCard.list_id,
    endpoint: `/api/dashboard/list/${editedCard.list_id}/cards/${editedCard.id}`
  });
  
  try {
    if (!token) {
      console.log("⚠️ Pas de token, mise à jour locale uniquement");
      setCards(prevCards => 
        prevCards.map(card => 
          card.id === editedCard.id ? { ...card, ...editedCard } : card
        )
      );
      setIsDialogOpen(false);
      return;
    }

    const response = await fetch(`/api/dashboard/list/${editedCard.list_id}/cards/${editedCard.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: editedCard.title,
        description: editedCard.description,
        label_id: editedCard.label_id,
        start_date: editedCard.start_date,
        due_date: editedCard.due_date,
        list_id: editedCard.list_id,
      }),
    });

    console.log("📡 Réponse API:", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const error = await response.json();
        console.error("❌ Erreur API (JSON):", error);
      } else {
        const text = await response.text();
        console.error("❌ Erreur API (Texte):", text);
      }
      
      setCards(prevCards => 
        prevCards.map(card => 
          card.id === editedCard.id ? { ...card, ...editedCard } : card
        )
      );
      setIsDialogOpen(false);
      return;
    }

    const updatedCard = await response.json();
    console.log("✅ Carte mise à jour avec succès:", updatedCard);
    
    setCards(prevCards => 
      prevCards.map(card => 
        card.id === updatedCard.id 
          ? {
              ...card,
              title: updatedCard.title,
              description: updatedCard.description || "",
              label_id: updatedCard.label_id,
              start_date: updatedCard.start_date ? new Date(updatedCard.start_date).toISOString() : card.start_date,
              due_date: updatedCard.due_date ? new Date(updatedCard.due_date).toISOString() : card.due_date,
            }
          : card
      )
    );
    
    setIsDialogOpen(false);
    
  } catch (error) {
    console.error("💥 Erreur réseau:", error);
    
    setCards(prevCards => 
      prevCards.map(card => 
        card.id === editedCard.id ? { ...card, ...editedCard } : card
      )
    );
    setIsDialogOpen(false);
  }
};


  function handleDragStart(event: DragStartEvent) {
    const { active } = event

    if (active.data.current?.type === "list") {
      setActiveList(active.data.current.list)
    } else if (active.data.current?.type === "card") {
      setActiveCard(active.data.current.card)
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const activeType = active.data.current?.type
    const overType = over.data.current?.type
    if (activeType === "card") {
      const activeCard = active.data.current?.card as CardType
      const overListId =
        overType === "list" ? over.data.current?.list.id : overType === "card" ? over.data.current?.card.list_id : null

      if (overListId && activeCard.list_id !== overListId) {
        setCards((prevCards) => {
          const updatedCards = prevCards.map((card) =>
            card.id === activeCard.id ? { ...card, list_id: overListId } : card,
          )
          return updatedCards
        })
      }
    }
  }

  function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event
  if (!over) return

  const activeId = String(active.id)
  const overId = String(over.id)

  // Drag d'une carte
  if (activeId.startsWith("card-") && overId.startsWith("card-")) {
    const activeCardId = Number(activeId.replace("card-", ""))
    const overCardId = Number(overId.replace("card-", ""))

    const oldIndex = cards.findIndex((c) => c.id === activeCardId)
    const newIndex = cards.findIndex((c) => c.id === overCardId)

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(cards, oldIndex, newIndex)
      
      const updatedCards = reordered.map((card, idx) => ({
        ...card,
        position: idx,
      }))
      
      setCards(updatedCards)

      const movedCards = updatedCards
        .filter((card, idx) => {
          const originalCard = cards[idx]
          return originalCard && (card.id !== originalCard.id || card.position !== originalCard.position)
        })
        .map(card => ({
          id: card.id,
          position: card.position,
          list_id: card.list_id,
        }))

      if (movedCards.length > 0) {
        updateCardPositions(movedCards)
      }
    }
  }

  // Drag d'une carte vers une liste (CORRIGÉ)
  if (activeId.startsWith("card-") && overId.startsWith("list-")) {
    const cardId = Number(activeId.replace("card-", ""))
    const targetListId = Number(overId.replace("list-", ""))

    const cardIndex = cards.findIndex((c) => c.id === cardId)
    if (cardIndex === -1) return

    const movedCard = cards[cardIndex]
    if (movedCard.list_id === targetListId) return

    // Récupérer la liste source de la carte
    const sourceListId = movedCard.list_id

    // Compter les cartes dans la liste cible
    const cardsInTargetList = cards.filter((c) => c.list_id === targetListId)
    const newPosition = cardsInTargetList.length

    // Mettre à jour la carte localement
    const updatedCards = cards.map((c) =>
      c.id === cardId ? { ...c, list_id: targetListId, position: newPosition } : c
    )

    setCards(updatedCards)

    // Mettre à jour en backend avec la NOUVELLE liste
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (token) {
      fetch(`/api/dashboard/list/${targetListId}/cards/${cardId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          position: newPosition,
          list_id: targetListId,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("✅ Carte déplacée vers la liste", targetListId, ":", data)
        })
        .catch((error) => {
          console.error("❌ Erreur lors du déplacement de la carte:", error)
        })
    }
  }

  // Drag d'une liste
  if (activeId.startsWith("list-") && overId.startsWith("list-")) {
    const activeListId = Number(activeId.replace("list-", ""))
    const overListId = Number(overId.replace("list-", ""))

    const oldIndex = lists.findIndex((l) => l.id === activeListId)
    const newIndex = lists.findIndex((l) => l.id === overListId)

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(lists, oldIndex, newIndex)
      const updatedLists = reordered.map((list, idx) => ({
        ...list,
        position: idx,
      }))
      setLists(updatedLists)

      const movedLists = updatedLists
        .filter((list, idx) => {
          const originalList = lists[idx]
          return originalList && (list.id !== originalList.id || list.position !== originalList.position)
        })
        .map(list => ({
          id: list.id,
          position: list.position,
        }))

      if (movedLists.length > 0) {
        updateListPositions(movedLists)
      }
    }
  }
}

  const updateListPositions = async (movedLists: { id: number; position: number }[]) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  if (!token) return

  try {
    const updatePromises = movedLists.map(list =>
      fetch(`/api/dashboard/board/${id}/lists/${list.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          position: list.position,
        }),
      })
    )

    await Promise.all(updatePromises)
    console.log("✅ Positions des listes mises à jour avec succès")
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour des positions des listes:", error)
  }
}

  function handleAddList() {
    if (!newListTitle.trim()) return
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (!token) {
      const newList: ListType = {
        id: Date.now(),
        board_id: board?.id ?? Number(id),
        title: newListTitle,
        position: lists.length,
      }
      setLists((s) => [...s, newList])
      setNewListTitle("")
      setIsAddingList(false)
      return
    }

    fetch(`/api/dashboard/board/${id}/lists`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: newListTitle }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.id) {
          setLists((s) => [...s, { id: Number(data.id), board_id: Number(id), title: data.title, position: data.position ?? s.length }])
        }
      })
      .catch(() => {
        const newList: ListType = {
          id: Date.now(),
          board_id: board?.id ?? Number(id),
          title: newListTitle,
          position: lists.length,
        }
        setLists((s) => [...s, newList])
      })
      .finally(() => {
        setNewListTitle("")
        setIsAddingList(false)
      })
  }

  function handleAddCard(listId: number) {
    setAddingCardListId(listId)
  }

  function handleSaveNewCard() {
    if (!newCardTitle.trim() || !addingCardListId) return
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (!token) {
      const now = new Date().toISOString()
      const cardsInList = cards.filter((c) => c.list_id === addingCardListId)
      const newCard: CardType = {
        id: Date.now(),
        list_id: addingCardListId,
        label_id: null,
        title: newCardTitle,
        description: "",
        start_date: now,
        due_date: now,
        position: cardsInList.length,
      }
      setCards((s) => [...s, newCard])
      setNewCardTitle("")
      setAddingCardListId(null)
      return
    }

    fetch(`/api/dashboard/list/${addingCardListId}/cards`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: newCardTitle }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.id) {
          const card = {
            id: Number(data.id),
            list_id: Number(data.list_id || addingCardListId),
            label_id: data.label_id ? Number(data.label_id) : null,
            title: data.title,
            description: data.description || "",
            start_date: data.start_date ? new Date(data.start_date).toISOString() : new Date().toISOString(),
            due_date: data.due_date ? new Date(data.due_date).toISOString() : new Date().toISOString(),
            position: data.position ?? cards.filter((c) => c.list_id === addingCardListId).length,
          }
          setCards((s) => [...s, card])
        }
      })
      .catch(() => {
        const now = new Date().toISOString()
        const cardsInList = cards.filter((c) => c.list_id === addingCardListId)
        const newCard: CardType = {
          id: Date.now(),
          list_id: addingCardListId,
          label_id: null,
          title: newCardTitle,
          description: "",
          start_date: now,
          due_date: now,
          position: cardsInList.length,
        }
        setCards((s) => [...s, newCard])
      })
      .finally(() => {
        setNewCardTitle("")
        setAddingCardListId(null)
      })
  }

  const updateCardPositions = async (movedCards: { id: number; position: number; list_id: number }[]) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  if (!token) return

  try {
    const updatePromises = movedCards.map(card =>
      fetch(`/api/dashboard/list/${card.list_id}/cards/${card.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          position: card.position,
          list_id: card.list_id,
        }),
      })
    )

    await Promise.all(updatePromises)
    console.log("✅ Positions mises à jour avec succès")
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour des positions:", error)
  }
}

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
      try {
        const res = await fetch(`/api/dashboard/board/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
        if (!res.ok) {
          // keep defaults and stop
          setLoading(false)
          return
        }
        const data = await res.json()
        if (!mounted) return
        // API returns boardsData and lists
        const bd = data.boardsData && data.boardsData[String(id)]
        if (bd) {
          setBoard({ id: Number(id), title: bd.name ?? bd.title ?? `Board ${id}`, color: bd.color })
        } else if (data.board) {
          setBoard({ id: Number(id), title: data.board.title, color: data.board.color })
        }

        const apiLists = Array.isArray(data.lists) ? data.lists : data.lists ?? []
        const mappedLists: ListType[] = apiLists.map((l: any, idx: number) => ({
          id: Number(l.id),
          board_id: Number(id),
          title: l.title,
          position: l.position ?? idx,
        }))
        setLists(mappedLists)

        // flatten cards
        const mappedCards: CardType[] = []
        apiLists.forEach((l: any) => {
          ;(l.cards || []).forEach((c: any, idx: number) => {
            mappedCards.push({
              id: Number(c.id),
              list_id: Number(l.id),
              label_id: c.label_id ? Number(c.label_id) : null,
              title: c.title,
              description: c.description || "",
              start_date: c.start_date ? new Date(c.start_date).toISOString() : new Date().toISOString(),
              due_date: c.due_date ? new Date(c.due_date).toISOString() : new Date().toISOString(),
              position: c.position ?? idx,
            })
          })
        })
        setCards(mappedCards)
      } catch (err) {
        console.error(err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [id])

  if (!board) {
    return <div className="flex items-center justify-center">Chargement</div>
  }

  return (
    <div className="flex h-screen flex-col">
    <div className={`${board.color} p-4`}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white">{board.title}</h1>
        </div>
        <Link href={`/dashboard/board/${id}/table`}>
          <Button variant="secondary">Vue Tableur</Button>
        </Link>
      </div>
    </div>
      <div className="flex-1 overflow-x-auto bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={lists.map((list) => `list-${list.id}`)} strategy={horizontalListSortingStrategy}>
            <div className="flex gap-4">
              {lists.map((list) => {
                const listCards = getCardsForList(list.id)

                return (
                  <div key={list.id} className="w-72 flex-shrink-0">
                    {addingCardListId === list.id ? (
                      <Card className="bg-background">
                        <div className="p-3">
                          <div className="mb-3 flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                            <h2 className="font-semibold text-foreground">{list.title}</h2>
                          </div>

                          <div className="min-h-[100px]">
                            <SortableContext
                              items={listCards.map((c) => `card-${c.id}`)}
                              strategy={verticalListSortingStrategy}
                            >
                              <div className="space-y-2">
                                {listCards.map((card) => {
                                  const cardLabel = labels.find((l) => l.id === card.label_id)
                                  return (
                                    <SortableCard
                                      key={card.id}
                                      card={card}
                                      label={cardLabel}
                                      onClick={() => handleCardClick(card)}
                                    />
                                  )
                                })}
                              </div>
                            </SortableContext>

                            <div className="mt-2 space-y-2">
                              <Textarea
                                placeholder="Saisir un titre pour cette carte..."
                                value={newCardTitle}
                                onChange={(e) => setNewCardTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSaveNewCard()
                                  } else if (e.key === "Escape") {
                                    setAddingCardListId(null)
                                    setNewCardTitle("")
                                  }
                                }}
                                autoFocus
                                className="resize-none"
                                rows={2}
                              />
                              <div className="flex gap-2">
                                <Button onClick={handleSaveNewCard} size="sm">
                                  Ajouter
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setAddingCardListId(null)
                                    setNewCardTitle("")
                                  }}
                                >
                                  Annuler
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ) : (
                      <SortableList
                        list={list}
                        cards={listCards}
                        labels={labels}
                        onCardClick={handleCardClick}
                        onAddCard={handleAddCard}
                      />
                    )}
                  </div>
                )
              })}

              <div className="w-72 flex-shrink-0">
                {isAddingList ? (
                  <Card className="bg-white p-3">
                    <Input
                      placeholder="Titre de la liste"
                      value={newListTitle}
                      onChange={(e) => setNewListTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleAddList()
                        } else if (e.key === "Escape") {
                          setIsAddingList(false)
                          setNewListTitle("")
                        }
                      }}
                      autoFocus
                      className="mb-2"
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleAddList} size="sm">
                        Ajouter
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsAddingList(false)
                          setNewListTitle("")
                        }}
                      >
                        Annuler
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 bg-white/50 hover:bg-white/80"
                    onClick={() => setIsAddingList(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter une liste
                  </Button>
                )}
              </div>
            </div>
          </SortableContext>

          <DragOverlay>
            {activeList ? (
              <div className="w-72">
                <Card className="cursor-grabbing bg-background shadow-lg">
                  <div className="p-3">
                    <div className="mb-3 flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <h2 className="font-semibold text-foreground">{activeList.title}</h2>
                    </div>
                    <div className="space-y-2">
                      {getCardsForList(activeList.id).map((card) => {
                        const cardLabel = labels.find((l) => l.id === card.label_id)
                        return (
                          <Card key={card.id} className="p-3">
                            <h3 className="mb-1 font-medium text-foreground">{card.title}</h3>
                            {cardLabel && (
                              <Badge
                                variant="secondary"
                                className="mb-2"
                                style={{ backgroundColor: cardLabel.color, color: "white" }}
                              >
                                {cardLabel.name}
                              </Badge>
                            )}
                            <p className="text-sm text-muted-foreground">{card.description}</p>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                </Card>
              </div>
            ) : activeCard ? (
              <Card className="w-72 cursor-grabbing p-3 shadow-lg">
                <h3 className="mb-1 font-medium text-foreground">{activeCard.title}</h3>
                <p className="text-sm text-muted-foreground">{activeCard.description}</p>
              </Card>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Modifier la carte</DialogTitle>
          </DialogHeader>
          {editedCard && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <UILabel htmlFor="title">Titre</UILabel>
                <Input
                  id="title"
                  value={editedCard.title}
                  onChange={(e) => setEditedCard({ ...editedCard, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <UILabel htmlFor="description">Description</UILabel>
                <Textarea
                  id="description"
                  value={editedCard.description}
                  onChange={(e) => setEditedCard({ ...editedCard, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <UILabel htmlFor="label">Label</UILabel>
                <Select
                  value={editedCard.label_id?.toString() || "0"}
                  onValueChange={(value) =>
                    setEditedCard({ ...editedCard, label_id: value === "0" ? null : Number.parseInt(value) })
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
                          <div className="h-3 w-3 rounded" style={{ backgroundColor: label.color }} />
                          {label.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <UILabel htmlFor="startDate">Date de début</UILabel>
                <Input
                  id="startDate"
                  type="date"
                  value={editedCard.start_date ? new Date(editedCard.start_date).toISOString().split("T")[0] : ""}
                  onChange={(e) =>
                    setEditedCard({
                      ...editedCard,
                      start_date: e.target.value ? new Date(e.target.value).toISOString() : "",
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <UILabel htmlFor="dueDate">Date d'échéance</UILabel>
                <Input
                  id="dueDate"
                  type="date"
                  value={editedCard.due_date ? new Date(editedCard.due_date).toISOString().split("T")[0] : ""}
                  onChange={(e) =>
                    setEditedCard({
                      ...editedCard,
                      due_date: e.target.value ? new Date(e.target.value).toISOString() : "",
                    })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveCard}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
