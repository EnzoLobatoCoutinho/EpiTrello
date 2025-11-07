"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Plus, MoreHorizontal, GripVertical, Tag, Calendar } from "lucide-react"
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
import { Label as UILabel } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

const boardsData = {
  "1": { id: 1, workspace_id: 1, title: "Project Alpha", color: "bg-blue-500" },
  "2": { id: 2, workspace_id: 1, title: "Marketing Campaign", color: "bg-green-500" },
  "3": { id: 3, workspace_id: 1, title: "Design System", color: "bg-purple-500" },
}

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
}

type ListType = {
  id: number
  board_id: number
  title: string
  position: number
  cards: CardType[]
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

const initialListsData: Record<string, ListType[]> = {
  "1": [
    {
      id: 1,
      board_id: 1,
      title: "À faire",
      position: 0,
      cards: [
        {
          id: 1,
          list_id: 1,
          label_id: 1,
          title: "Créer la maquette",
          description: "Design de la page d'accueil",
          start_date: "2025-01-05T00:00:00.000Z",
          due_date: "2025-01-15T00:00:00.000Z",
        },
        {
          id: 2,
          list_id: 1,
          label_id: 3,
          title: "Rédiger le contenu",
          description: "Textes pour les sections",
          start_date: "2025-01-06T00:00:00.000Z",
          due_date: "2025-01-20T00:00:00.000Z",
        },
      ],
    },
    {
      id: 2,
      board_id: 1,
      title: "En cours",
      position: 1,
      cards: [
        {
          id: 3,
          list_id: 2,
          label_id: 2,
          title: "Développer le header",
          description: "Composant React",
          start_date: "2025-01-07T00:00:00.000Z",
          due_date: "2025-01-10T00:00:00.000Z",
        },
      ],
    },
    {
      id: 3,
      board_id: 1,
      title: "Terminé",
      position: 2,
      cards: [
        {
          id: 4,
          list_id: 3,
          label_id: null,
          title: "Setup du projet",
          description: "Configuration initiale",
          start_date: "2025-01-01T00:00:00.000Z",
          due_date: "2025-01-03T00:00:00.000Z",
        },
        {
          id: 5,
          list_id: 3,
          label_id: null,
          title: "Installation des dépendances",
          description: "npm install",
          start_date: "2025-01-02T00:00:00.000Z",
          due_date: "2025-01-03T00:00:00.000Z",
        },
      ],
    },
  ],
}

function SortableCard({ card, label, onClick }: { card: CardType; label: LabelType | undefined; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id.toString(),
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
  labels,
  dragHandleProps,
  onCardClick,
  onAddCard,
}: {
  list: ListType
  labels: LabelType[]
  dragHandleProps?: any
  onCardClick: (card: CardType) => void
  onAddCard: () => void
}) {
  const { setNodeRef } = useDroppable({
    id: list.id.toString(),
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
          <SortableContext items={list.cards.map((c) => c.id.toString())} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {list.cards.map((card) => {
                const cardLabel = labels.find((l) => l.id === card.label_id)
                return <SortableCard key={card.id} card={card} label={cardLabel} onClick={() => onCardClick(card)} />
              })}
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
  labels,
  onCardClick,
  onAddCard,
}: {
  list: ListType
  labels: LabelType[]
  onCardClick: (card: CardType) => void
  onAddCard: (listId: number) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: list.id.toString(),
    data: { type: "list" },
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
  const board = boardsData[id as keyof typeof boardsData]
  const labels = boardLabels[id] || []

  const [lists, setLists] = useState<ListType[]>(initialListsData[id] || [])
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
      const list = lists.find((list) => list.id.toString() === active.id)
      if (list) {
        setActiveList(list)
      }
    } else {
      const activeList = lists.find((list) => list.cards.some((card) => card.id.toString() === active.id))
      const card = activeList?.cards.find((card) => card.id.toString() === active.id)
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

      const activeIndex = lists.findIndex((list) => list.id.toString() === activeListId)
      const overIndex = lists.findIndex((list) => list.id.toString() === overListId)

      if (activeIndex !== overIndex) {
        const newLists = [...lists]
        const [movedList] = newLists.splice(activeIndex, 1)
        newLists.splice(overIndex, 0, movedList)

        const updatedLists = newLists.map((list, index) => ({ ...list, position: index }))
        setLists(updatedLists)
      }
      return
    }

    const activeCardId = active.id as string
    const sourceList = lists.find((list) => list.cards.some((card) => card.id.toString() === activeCardId))

    if (!sourceList) return

    let destList = lists.find((list) => list.id.toString() === over.id)

    if (!destList) {
      destList = lists.find((list) => list.cards.some((card) => card.id.toString() === over.id))
    }

    if (!destList) return

    const sourceCardIndex = sourceList.cards.findIndex((card) => card.id.toString() === activeCardId)
    const overCardId = over.id as string
    const destCardIndex = destList.cards.findIndex((card) => card.id.toString() === overCardId)

    if (sourceList.id === destList.id) {
      const newCards = [...sourceList.cards]
      const [movedCard] = newCards.splice(sourceCardIndex, 1)
      newCards.splice(destCardIndex >= 0 ? destCardIndex : newCards.length, 0, movedCard)

      setLists(lists.map((list) => (list.id === sourceList.id ? { ...list, cards: newCards } : list)))
    } else {
      const sourceCards = [...sourceList.cards]
      const destCards = [...destList.cards]
      const [movedCard] = sourceCards.splice(sourceCardIndex, 1)
      movedCard.list_id = destList.id
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

  function handleAddList() {
    if (!newListTitle.trim()) return

    const newList: ListType = {
      id: Date.now(),
      board_id: board.id,
      title: newListTitle,
      position: lists.length,
      cards: [],
    }

    setLists([...lists, newList])
    setNewListTitle("")
    setIsAddingList(false)
  }

  function handleAddCard(listId: number) {
    setAddingCardListId(listId)
  }

  function handleSaveNewCard() {
    if (!newCardTitle.trim() || !addingCardListId) return

    const now = new Date().toISOString()
    const newCard: CardType = {
      id: Date.now(),
      list_id: addingCardListId,
      label_id: null,
      title: newCardTitle,
      description: "",
      start_date: now,
      due_date: now,
    }

    setLists(
      lists.map((list) => {
        if (list.id === addingCardListId) {
          return { ...list, cards: [...list.cards, newCard] }
        }
        return list
      }),
    )

    setNewCardTitle("")
    setAddingCardListId(null)
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
          <h1 className="text-2xl font-bold text-white">{board.title}</h1>
        </div>
      </div>
      <div className="flex-1 overflow-x-auto bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={lists.map((list) => list.id.toString())} strategy={horizontalListSortingStrategy}>
            <div className="flex gap-4">
              {lists.map((list) => (
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
                            items={list.cards.map((c) => c.id.toString())}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="space-y-2">
                              {list.cards.map((card) => {
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
                    <SortableList list={list} labels={labels} onCardClick={handleCardClick} onAddCard={handleAddCard} />
                  )}
                </div>
              ))}

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
                      {activeList.cards.map((card) => {
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
