"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Plus, MoreHorizontal, GripVertical, Tag, User, Calendar } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

const boardsData = {
  "1": { name: "Project Alpha", color: "bg-blue-500", tasks: 12 },
  "2": { name: "Marketing Campaign", color: "bg-green-500", tasks: 8 },
  "3": { name: "Design System", color: "bg-purple-500", tasks: 15 },
}

type CardType = {
  id: string
  title: string
  description: string
  label?: string
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
      {
        id: "card-1",
        title: "Créer la maquette",
        description: "Design de la page d'accueil",
        label: "Design",
      },
      {
        id: "card-2",
        title: "Rédiger le contenu",
        description: "Textes pour les sections",
        label: "Contenu",
      },
    ],
  },
  {
    id: "2",
    title: "En cours",
    cards: [
      {
        id: "card-3",
        title: "Développer le header",
        description: "Composant React",
        label: "Dev",
      },
    ],
  },
  {
    id: "3",
    title: "Terminé",
    cards: [
      { id: "card-4", title: "Setup du projet", description: "Configuration initiale", label: "Setup" },
      { id: "card-5", title: "Installation des dépendances", description: "npm install", member: "Alice" },
    ],
  },
]

const LABELS = ["Design", "Dev", "Contenu", "Bug", "Feature", "Urgent"]

function SortableCard({ card, onClick }: { card: CardType; onClick: () => void }) {
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
      onClick={onClick}
      className="cursor-grab p-3 transition-shadow hover:shadow-md active:cursor-grabbing"
    >
      <h3 className="mb-2 font-medium text-foreground">{card.title}</h3>

      <div className="mb-2 flex flex-wrap gap-2">
        {card.label && (
          <Badge variant="secondary" className="flex items-center gap-1 text-xs">
            <Tag className="h-3 w-3" />
            {card.label}
          </Badge>
        )}
      </div>

      {card.description && <p className="text-sm text-muted-foreground">{card.description}</p>}
    </Card>
  )
}

function SortableList({ list, onCardClick }: { list: ListType; onCardClick: (card: CardType) => void }) {
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
      <DroppableList list={list} dragHandleProps={{ ...attributes, ...listeners }} onCardClick={onCardClick} />
    </div>
  )
}

function DroppableList({
  list,
  dragHandleProps,
  onCardClick,
}: { list: ListType; dragHandleProps?: any; onCardClick: (card: CardType) => void }) {
  const { setNodeRef } = useDroppable({
    id: list.id,
    data: { type: "list" },
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
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        <div ref={setNodeRef} className="min-h-[100px]">
          <SortableContext items={list.cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {list.cards.map((card) => (
                <SortableCard key={card.id} card={card} onClick={() => onCardClick(card)} />
              ))}
            </div>
          </SortableContext>
        </div>

        <Button variant="ghost" className="mt-2 w-full justify-start gap-2 text-muted-foreground hover:bg-accent">
          <Plus className="h-4 w-4" />
          Ajouter une carte
        </Button>
      </div>
    </Card>
  )
}

export default function BoardPage({ params }: { params: { id: string } }) {
  const { id } = params
  const board = boardsData[id as keyof typeof boardsData]

  const [lists, setLists] = useState<ListType[]>(initialListsData)
  const [activeCard, setActiveCard] = useState<CardType | null>(null)
  const [activeList, setActiveList] = useState<ListType | null>(null)
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editedCard, setEditedCard] = useState<CardType | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  function handleCardClick(card: CardType) {
    setSelectedCard(card)
    setEditedCard({ ...card })
    setIsDialogOpen(true)
  }

  function handleSaveCard() {
    if (!editedCard) return

    setLists(
      lists.map((list) => ({
        ...list,
        cards: list.cards.map((card) => (card.id === editedCard.id ? editedCard : card)),
      })),
    )

    setIsDialogOpen(false)
    setSelectedCard(null)
    setEditedCard(null)
  }

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
                <SortableList key={list.id} list={list} onCardClick={handleCardClick} />
              ))}

              <div className="w-72 flex-shrink-0">
                <Button variant="ghost" className="w-full justify-start gap-2 bg-white/50 hover:bg-white/80">
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Modifier la carte</DialogTitle>
          </DialogHeader>
          {editedCard && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  value={editedCard.title}
                  onChange={(e) => setEditedCard({ ...editedCard, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editedCard.description}
                  onChange={(e) => setEditedCard({ ...editedCard, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="label">Label</Label>
                <Select
                  value={editedCard.label || "Aucun"}
                  onValueChange={(value) => setEditedCard({ ...editedCard, label: value })}
                >
                  <SelectTrigger id="label">
                    <SelectValue placeholder="Sélectionner un label" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aucun">Aucun</SelectItem>
                    {LABELS.map((label) => (
                      <SelectItem key={label} value={label}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
