"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Plus, MoreHorizontal, GripVertical } from "lucide-react"
import Link from "next/link"
import { useState, useEffect, useCallback, useRef } from "react"
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
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

type CardType = {
  id: string
  title: string
  description: string
}

type ListType = {
  id: string
  title: string
  cards: CardType[]
}

const initialListsData: ListType[] = [
  {
    id: "1",
    title: "À faire",
    cards: [
      { id: "card-1", title: "Créer la maquette", description: "Design de la page d'accueil" },
      { id: "card-2", title: "Rédiger le contenu", description: "Textes pour les sections" },
    ],
  },
  {
    id: "2",
    title: "En cours",
    cards: [{ id: "card-3", title: "Développer le header", description: "Composant React" }],
  },
  {
    id: "3",
    title: "Terminé",
    cards: [
      { id: "card-4", title: "Setup du projet", description: "Configuration initiale" },
      { id: "card-5", title: "Installation des dépendances", description: "npm install" },
    ],
  },
]

function SortableCard({ card }: { card: CardType }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
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
      className="cursor-grab p-3 transition-shadow hover:shadow-md active:cursor-grabbing"
    >
      <h3 className="mb-1 font-medium text-foreground">{card.title}</h3>
      <p className="text-sm text-muted-foreground">{card.description}</p>
    </Card>
  )
}

function SortableList({ list, onUpdateTitle, onAddCard }: { list: ListType; onUpdateTitle?: (id: string, title: string) => void; onAddCard?: (listId: string, card: CardType) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: list.id,
    data: { type: "list" },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="w-72 flex-shrink-0">
  <DroppableList list={list} dragHandleProps={{ ...attributes, ...listeners }} onUpdateTitle={onUpdateTitle} onAddCard={onAddCard} />
    </div>
  )
}

function DroppableList({ list, dragHandleProps, onUpdateTitle, onAddCard }: { list: ListType; dragHandleProps?: any; onUpdateTitle?: (id: string, title: string) => void; onAddCard?: (listId: string, card: CardType) => void }) {
  const { setNodeRef } = useDroppable({
    id: list.id,
    data: { type: "list" },
  })

  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(list.title)
  const inputRef = useRef<HTMLInputElement | null>(null)
  useEffect(() => setTitle(list.title), [list.title])

  useEffect(() => {
    if (isEditing) inputRef.current?.focus()
  }, [isEditing])

  const commit = () => {
    const trimmed = title.trim()
    if (!trimmed) {
      setTitle(list.title)
      setIsEditing(false)
      return
    }
    if (trimmed !== list.title) {
      onUpdateTitle?.(list.id, trimmed)
    }
    setIsEditing(false)
  }

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      commit()
    } else if (e.key === "Escape") {
      setTitle(list.title)
      setIsEditing(false)
    }
  }

  return (
    <Card className="bg-background">
      <div className="p-3">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            {isEditing ? (
              <input
                ref={inputRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={commit}
                onKeyDown={onKeyDown}
                className="w-full rounded border border-input bg-transparent px-2 py-1 text-foreground"
              />
            ) : (
              <h2 className="font-semibold text-foreground cursor-text" onClick={() => setIsEditing(true)}>{list.title}</h2>
            )}
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        <div ref={setNodeRef} className="min-h-[100px]">
          <SortableContext items={list.cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {list.cards.map((card) => (
                <SortableCard key={card.id} card={card} />
              ))}
            </div>
          </SortableContext>
        </div>

        <div className="mt-2">
          <AddCardInline
            onAdd={(title, description) => {
              const newCard: CardType = { id: String(Date.now()), title, description }
              onAddCard?.(list.id, newCard)
            }}
          />
        </div>
      </div>
    </Card>
  )
}

function AddCardInline({ onAdd }: { onAdd: (title: string, description: string) => void }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const ref = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (open) ref.current?.focus()
  }, [open])

  const submit = () => {
    const t = title.trim()
    if (!t) return
    onAdd(t, description.trim())
    setTitle("")
    setDescription("")
    setOpen(false)
  }

  if (!open)
    return (
      <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:bg-accent" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Ajouter une carte
      </Button>
    )

  return (
    <div className="space-y-2">
      <input ref={ref} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre de la carte" className="w-full rounded border px-2 py-1" />
      <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optionnelle)" className="w-full rounded border px-2 py-1" />
      <div className="flex gap-2">
        <Button onClick={submit}>Ajouter</Button>
        <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
      </div>
    </div>
  )
}

export default function BoardPage({ params }: { params: { id: string } }) {
  const { id } = params
  const [board, setBoard] = useState<{ name: string; color: string; tasks: number } | null>(null)

  const [lists, setLists] = useState<ListType[]>(initialListsData)
  const [loading, setLoading] = useState(true)
  const [activeCard, setActiveCard] = useState<CardType | null>(null)
  const [activeList, setActiveList] = useState<ListType | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
        const headers: Record<string, string> = { "Content-Type": "application/json" }
        if (token) headers["Authorization"] = `Bearer ${token}`

        const res = await fetch(`/api/dashboard/board/${id}`, { headers })
        if (!res.ok) {
          setLoading(false)
          return
        }

        const data = await res.json()
        const boardKey = data?.boardsData ? Object.keys(data.boardsData)[0] : null
        const boardData = boardKey ? data.boardsData[boardKey] : null

        if (!mounted) return
        if (boardData) setBoard(boardData)
        if (Array.isArray(data.lists)) setLists(data.lists)
      } catch (e) {
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [id])

  const addList = useCallback(() => {
    const tempId = String(Date.now())
    const newList: ListType = { id: tempId, title: "Nouvelle liste", cards: [] }
    setLists((prev) => [...prev, newList])

    ;(async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
        const headers: Record<string, string> = { "Content-Type": "application/json" }
        if (token) headers["Authorization"] = `Bearer ${token}`

        const res = await fetch(`/api/dashboard/board/${id}/lists`, { method: "POST", headers, body: JSON.stringify({ title: newList.title }) })
        if (!res.ok) throw new Error("Failed to create list")
        const created = await res.json()
        setLists((prev) => prev.map((l) => (l.id === tempId ? { ...l, id: String(created.id) } : l)))
      } catch (e) {
        console.error(e)
        setLists((prev) => prev.filter((l) => l.id !== tempId))
      }
    })()
  }, [id])

  const updateListTitle = useCallback((id: string, newTitle: string) => {
    const previous = lists.find((l) => l.id === id)
    setLists((prev) => prev.map((l) => (l.id === id ? { ...l, title: newTitle } : l)))

    ;(async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
        const headers: Record<string, string> = { "Content-Type": "application/json" }
        if (token) headers["Authorization"] = `Bearer ${token}`

        const res = await fetch(`/api/dashboard/list/${id}`, { method: "PATCH", headers, body: JSON.stringify({ title: newTitle }) })
        if (!res.ok) throw new Error("Failed to update list title")
      } catch (e) {
        console.error(e)
        if (previous) setLists((prev) => prev.map((l) => (l.id === id ? previous : l)))
      }
    })()
  }, [lists])

  const addCard = useCallback((listId: string, card: CardType) => {
    setLists((prev) => prev.map((l) => (l.id === listId ? { ...l, cards: [...l.cards, card] } : l)))

    const tempCardId = card.id

    ;(async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
        const headers: Record<string, string> = { "Content-Type": "application/json" }
        if (token) headers["Authorization"] = `Bearer ${token}`

        const res = await fetch(`/api/dashboard/list/${listId}/cards`, {
          method: "POST",
          headers,
          body: JSON.stringify({ title: card.title, description: card.description }),
        })
        if (!res.ok) throw new Error("Failed to create card")
        const created = await res.json()
        setLists((prev) => prev.map((l) => (l.id === listId ? { ...l, cards: l.cards.map((c) => (c.id === tempCardId ? { ...c, id: String(created.id) } : c)) } : l)))
      } catch (e) {
        console.error(e)
        setLists((prev) => prev.map((l) => (l.id === listId ? { ...l, cards: l.cards.filter((c) => c.id !== tempCardId) } : l)))
      }
    })()
  }, [id])

  function handleDragStart(event: DragStartEvent) {
    const { active } = event

    if (active.data.current?.type === "list") {
      const list = lists.find((list) => list.id === active.id)
      if (list) {
        setActiveList(list)
      }
    } else {
      const activeList = lists.find((list) => list.cards.some((card) => card.id === active.id))
      const card = activeList?.cards.find((card) => card.id === active.id)
      if (card) {
        setActiveCard(card)
      }
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveCard(null)
    setActiveList(null)

    if (!over) return

    if (active.data.current?.type === "list") {
      const activeListId = active.id as string
      const overListId = over.id as string

      const activeIndex = lists.findIndex((list) => list.id === activeListId)
      const overIndex = lists.findIndex((list) => list.id === overListId)

      if (activeIndex !== overIndex) {
        const newLists = [...lists]
        const [movedList] = newLists.splice(activeIndex, 1)
        newLists.splice(overIndex, 0, movedList)
        setLists(newLists)
      }
      return
    }

    const activeCardId = active.id as string
    const sourceList = lists.find((list) => list.cards.some((card) => card.id === activeCardId))

    if (!sourceList) return

    let destList = lists.find((list) => list.id === over.id)

    if (!destList) {
      destList = lists.find((list) => list.cards.some((card) => card.id === over.id))
    }

    if (!destList) return

    const sourceCardIndex = sourceList.cards.findIndex((card) => card.id === activeCardId)
    const overCardId = over.id as string
    const destCardIndex = destList.cards.findIndex((card) => card.id === overCardId)

    if (sourceList.id === destList.id) {
      const newCards = [...sourceList.cards]
      const [movedCard] = newCards.splice(sourceCardIndex, 1)
      newCards.splice(destCardIndex >= 0 ? destCardIndex : newCards.length, 0, movedCard)

      setLists(lists.map((list) => (list.id === sourceList.id ? { ...list, cards: newCards } : list)))
    } else {
      const sourceCards = [...sourceList.cards]
      const destCards = [...destList.cards]
      const [movedCard] = sourceCards.splice(sourceCardIndex, 1)
      destCards.splice(destCardIndex >= 0 ? destCardIndex : destCards.length, 0, movedCard)

      setLists(
        lists.map((list) => {
          if (list.id === sourceList.id) return { ...list, cards: sourceCards }
          if (list.id === destList.id) return { ...list, cards: destCards }
          return list
        }),
      )
    }
  }

  if (!board) {
    return <div>Board not found</div>
  }

  return (
    <div className="flex h-screen flex-col">
      <div className={`${board.color} p-4`}>
        <div className="mb-4 flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white">{board.name}</h1>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={lists.map((list) => list.id)} strategy={horizontalListSortingStrategy}>
            <div className="flex gap-4">
              {lists.map((list) => (
                <SortableList key={list.id} list={list} onUpdateTitle={updateListTitle} onAddCard={addCard} />
              ))}
              <div className="w-72 flex-shrink-0">
                <Button
                  variant="ghost"
                  onClick={addList}
                  className="w-full justify-start gap-2 bg-white/50 hover:bg-white/80"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter une liste
                </Button>
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
                      {activeList.cards.map((card) => (
                        <Card key={card.id} className="p-3">
                          <h3 className="mb-1 font-medium text-foreground">{card.title}</h3>
                          <p className="text-sm text-muted-foreground">{card.description}</p>
                        </Card>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            ) : activeCard ? (
              <Card className="cursor-grabbing p-3 shadow-lg">
                <h3 className="mb-1 font-medium text-foreground">{activeCard.title}</h3>
                <p className="text-sm text-muted-foreground">{activeCard.description}</p>
              </Card>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}
