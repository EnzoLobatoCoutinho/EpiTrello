"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Edit, Trash2, Plus, GripVertical } from "lucide-react"
import Link from "next/link"
import { useState, Fragment, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label as UILabel } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragOverEvent,
} from "@dnd-kit/core"
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"


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

type BoardType = {
  id: number
  workspace_id?: number
  title: string
  color?: string
}

function SortableRow({
  card,
  label,
  getListTitle,
  onEdit,
  onDelete,
}: {
  card: CardType
  label: LabelType | undefined
  getListTitle: (id: number) => string
  onEdit: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id.toString(),
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <TableRow ref={setNodeRef} style={style} className={isDragging ? "relative z-50" : ""}>
      <TableCell className="w-[40px] p-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="h-5 w-5" />
        </div>
      </TableCell>
      <TableCell className="font-medium">{card.title}</TableCell>
      <TableCell>{getListTitle(card.list_id)}</TableCell>
      <TableCell>
        {label ? (
          <Badge variant="secondary" style={{ backgroundColor: label.color, color: "white" }}>
            {label.name}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell className="max-w-[300px] truncate text-sm text-muted-foreground">{card.description || "-"}</TableCell>
      <TableCell className="text-sm">
        {card.start_date ? new Date(card.start_date).toLocaleDateString("fr-FR") : "-"}
      </TableCell>
      <TableCell className="text-sm">
        {card.due_date ? new Date(card.due_date).toLocaleDateString("fr-FR") : "-"}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8">
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-8 w-8 text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export default function TablePage({ params }: { params: { id: string } }) {
  const { id } = params
  const [board, setBoard] = useState<BoardType | null>(null)
  const [labels, setLabels] = useState<LabelType[]>([])

  const [lists, setLists] = useState<ListType[]>([])
  const [cards, setCards] = useState<CardType[]>([])
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editedCard, setEditedCard] = useState<CardType | null>(null)
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [isAddingList, setIsAddingList] = useState(false)
  const [newListTitle, setNewListTitle] = useState("")
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  function getListTitle(listId: number): string {
    return lists.find((list) => list.id === listId)?.title || "N/A"
  }

  function getLabelById(labelId: number | null): LabelType | undefined {
    if (!labelId) return undefined
    return labels.find((label) => label.id === labelId)
  }

  function handleEditCard(card: CardType) {
    setSelectedCard(card)
    setEditedCard({ ...card })
    setIsDialogOpen(true)
  }

  async function handleSaveCard() {
    if (!editedCard) return

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (!token) {
      alert("Action non autorisée : vous devez être connecté pour modifier une carte.")
      return
    }

    try {
      const res = await fetch(`/api/dashboard/list/${editedCard.list_id}/cards/${editedCard.id}`, {
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
          position: editedCard.position,
        }),
      })

      if (!res.ok) {
        const errorText = await res.text().catch(() => "")
        console.error("Échec mise à jour carte :", res.status, res.statusText, errorText)
        return
      }
      const updated = await res.json()
      setCards((prev) => prev.map((c) => (c.id === Number(updated.id) ? { ...c, ...updated } : c)))
    } catch (err) {
      console.error(err)
    } finally {
      setIsDialogOpen(false)
      setSelectedCard(null)
      setEditedCard(null)
    }
  }

  function handleDeleteCard(cardId: number) {
    (async () => {
      if (!confirm("Êtes-vous sûr de vouloir supprimer cette carte ?")) return

      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
      if (!token) {
        alert("Action non autorisée : vous devez être connecté pour supprimer une carte.")
        return
      }

      const card = cards.find((c) => c.id === cardId)
      const listId = card?.list_id
      if (!listId) {
        console.error("Impossible de trouver la liste de la carte à supprimer")
        return
      }

      try {
        const res = await fetch(`/api/dashboard/list/${listId}/cards/${cardId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          const text = await res.text().catch(() => "")
          console.error("Échec suppression carte:", res.status, res.statusText, text)
          return
        }
        setCards((prev) => prev.filter((card) => card.id !== cardId))
      } catch (err) {
        console.error("Erreur lors de la suppression de la carte:", err)
      }
    })()
  }

  function handleAddCard(listId?: number) {
    setIsAddingCard(true)
    const now = new Date().toISOString()
    const targetListId = listId ?? lists[0]?.id ?? 1
    const newCard: CardType = {
      id: Date.now(),
      list_id: targetListId,
      label_id: null,
      title: "",
      description: "",
      start_date: now,
      due_date: now,
      position: cards.filter((c) => c.list_id === targetListId).length,
    }
    setEditedCard(newCard)
    setIsDialogOpen(true)
  }

  async function handleSaveNewCard() {
    if (!editedCard) return

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (!token) {
      alert("Action non autorisée : vous devez être connecté pour créer une carte.")
      return
    }

    try {
      const res = await fetch(`/api/dashboard/list/${editedCard.list_id}/cards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editedCard.title || "Nouvelle carte",
          description: editedCard.description || "",
          label_id: editedCard.label_id,
          start_date: editedCard.start_date,
          due_date: editedCard.due_date,
        }),
      })

      if (!res.ok) {
        const errorText = await res.text().catch(() => "")
        console.error("Échec création carte :", res.status, res.statusText, errorText)
        return
      }

      const created = await res.json()
      const normalized: CardType = {
        id: Number(created.id),
        list_id: Number(created.list_id ?? editedCard.list_id),
        label_id: created.label_id === null ? null : Number(created.label_id),
        title: created.title,
        description: created.description || "",
        start_date: created.start_date ? new Date(created.start_date).toISOString() : "",
        due_date: created.due_date ? new Date(created.due_date).toISOString() : "",
        position: created.position ?? cards.length,
      }
      setCards((s) => [...s, normalized])
    } catch (err) {
      console.error(err)
    } finally {
      setIsDialogOpen(false)
      setEditedCard(null)
      setIsAddingCard(false)
    }
  }

  const updateListPositions = async (movedLists: { id: number; position: number }[]) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (!token) return

    try {
      const updatePromises = movedLists.map((list) =>
        fetch(`/api/dashboard/board/${id}/lists/${list.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            position: list.position,
          }),
        }),
      )
      console.log("Mise à jour des positions des listes:", movedLists)
      await Promise.all(updatePromises)
      console.log("Positions des listes mises à jour avec succès")
    } catch (error) {
      console.error("Erreur lors de la mise à jour des positions des listes:", error)
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

  

  const updateCardPositions = async (movedCards: { id: number; position: number; list_id: number }[]) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (!token) return

    try {
      const updatePromises = movedCards.map((card) =>
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
        }),
      )
      console.log("Mise à jour des positions des cartes:", movedCards)

      await Promise.all(updatePromises)
      console.log("Positions mises à jour avec succès")
    } catch (error) {
      console.error("Erreur lors de la mise à jour des positions:", error)
    }
  }

  useEffect(() => {
    let mounted = true
    async function load() {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
      try {
        const res = await fetch(`/api/dashboard/board/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
        if (!res.ok) return
        const data = await res.json()
        if (!mounted) return

        const bd = data.boardsData && data.boardsData[String(id)]
        if (bd) {
          setBoard({ id: Number(id), title: bd.name ?? bd.title ?? `Board ${id}`, color: bd.color })
        } else if (data.board) {
          setBoard({ id: Number(id), title: data.board.title, color: data.board.color })
        } else {
          try {
            const apiBoard = data
            setBoard({
              id: Number(apiBoard.id ?? id),
              title: apiBoard.title ?? `Board ${id}`,
              color: apiBoard.color ?? "bg-gray-500",
              workspace_id: apiBoard.workspace_id ? Number(apiBoard.workspace_id) : undefined,
            })
          } catch (e) {
          }
        }

        const apiLists = Array.isArray(data.lists) ? data.lists : data.lists ?? []
        const mappedLists: ListType[] = apiLists.map((l: any, idx: number) => ({
          id: Number(l.id),
          board_id: Number(id),
          title: l.title,
          position: l.position ?? idx,
        }))
        setLists(mappedLists)

        // Map labels returned by the API so table can look them up
        const apiLabels = Array.isArray(data.labels) ? data.labels : []
        const mappedLabels: LabelType[] = apiLabels.map((label: any) => ({
          id: Number(label.id),
          board_id: Number(label.board_id),
          name: label.name,
          color: label.color,
        }))
        setLabels(mappedLabels)

        const mappedCards: CardType[] = []
        apiLists.forEach((l: any) => {
          ;(l.cards || []).forEach((c: any, idx: number) => {
            mappedCards.push({
              id: Number(c.id),
              list_id: Number(l.id),
              label_id: c.label ? Number(c.label.id) : c.label_id ? Number(c.label_id) : null,
              title: c.title,
              description: c.description || "",
              start_date: c.start_date ? new Date(c.start_date).toISOString() : "",
              due_date: c.due_date ? new Date(c.due_date).toISOString() : "",
              position: c.position ?? idx,
            })
          })
        })
        setCards(mappedCards)
      } catch (err) {
        console.error(err)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [id])

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const activeCardId = Number(active.id)
    const overCardId = Number(over.id)

    const activeCard = cards.find((c) => c.id === activeCardId)
    const overCard = cards.find((c) => c.id === overCardId)

    if (!activeCard || !overCard) return

    if (activeCard.list_id !== overCard.list_id) {
      setCards((prevCards) => {
        const updatedCards = prevCards.map((card) => {
          if (card.id === activeCardId) {
            return { ...card, list_id: overCard.list_id }
          }
          return card
        })
        return updatedCards
      })
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id) return

    const oldIndex = cards.findIndex((c) => c.id.toString() === active.id)
    const newIndex = cards.findIndex((c) => c.id.toString() === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const newCards = [...cards]
    const [movedCard] = newCards.splice(oldIndex, 1)
    newCards.splice(newIndex, 0, movedCard)

    const cardsGroupedByList = new Map<number, CardType[]>()

    newCards.forEach((card) => {
      if (!cardsGroupedByList.has(card.list_id)) {
        cardsGroupedByList.set(card.list_id, [])
      }
      cardsGroupedByList.get(card.list_id)!.push(card)
    })

    const updatedCards: CardType[] = []
    cardsGroupedByList.forEach((listCards) => {
      listCards.forEach((card, index) => {
        updatedCards.push({ ...card, position: index })
      })
    })

    setCards(updatedCards)
    try {
      const movedCards = updatedCards
        .map((c) => {
          const orig = cards.find((o) => o.id === c.id)
          return orig && (orig.position !== c.position || orig.list_id !== c.list_id)
            ? { id: c.id, position: c.position, list_id: c.list_id }
            : null
        })
        .filter((x): x is { id: number; position: number; list_id: number } => x !== null)

      if (movedCards.length > 0) {
        await updateCardPositions(movedCards)
      }
    } catch (err) {
      console.error("Erreur lors de l'envoi des positions modifiées:", err)
    }
  }

  if (!board) {
    return <div>Board not found</div>
  }

  const activeCard = activeId ? cards.find((c) => c.id.toString() === activeId) : null

  const allCardIds = cards.map((c) => c.id.toString())

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-screen flex-col">
        {/* Header */}
        <div className={`${board.color} p-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-white">{board.title} - Vue Tableur</h1>
            </div>
            <div className="flex gap-2">
              <Link href={`/dashboard/board/${id}`}>
                <Button variant="secondary">Vue Kanban</Button>
              </Link>
              <Button variant="secondary" onClick={() => handleAddCard()}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter une carte
              </Button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto bg-background p-6">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead className="w-[250px]">Titre</TableHead>
                  <TableHead className="w-[150px]">Liste</TableHead>
                  <TableHead className="w-[120px]">Label</TableHead>
                  <TableHead className="w-[300px]">Description</TableHead>
                  <TableHead className="w-[120px]">Date début</TableHead>
                  <TableHead className="w-[120px]">Date échéance</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cards.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      Aucune carte. Cliquez sur "Ajouter une carte" pour commencer.
                    </TableCell>
                  </TableRow>
                ) : (
                  <SortableContext items={allCardIds} strategy={verticalListSortingStrategy}>
                    {lists.map((list, listIndex) => {
                      const listCards = cards
                        .filter((card) => card.list_id === list.id)
                        .sort((a, b) => a.position - b.position)

                      if (listCards.length === 0) return null

                      return (
                        <Fragment key={list.id}>
                          {listIndex > 0 && (
                            <TableRow className="bg-muted/50">
                              <TableCell colSpan={8} className="h-2 p-0"></TableCell>
                            </TableRow>
                          )}
                          <TableRow className="bg-muted/30 hover:bg-muted/30">
                            <TableCell colSpan={8} className="font-semibold">
                              {list.title} ({listCards.length})
                            </TableCell>
                          </TableRow>
                          {listCards.map((card) => {
                            const label = getLabelById(card.label_id)
                            return (
                              <SortableRow
                                key={card.id}
                                card={card}
                                label={label}
                                getListTitle={getListTitle}
                                onEdit={() => handleEditCard(card)}
                                onDelete={() => handleDeleteCard(card.id)}
                              />
                            )
                          })}
                        </Fragment>
                      )
                    })}
                  </SortableContext>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>

        <DragOverlay>
          {activeCard ? (
            <div className="rounded-lg border bg-card p-4 shadow-lg">
              <p className="font-medium">{activeCard.title}</p>
            </div>
          ) : null}
        </DragOverlay>

        {/* Edit/Add Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{isAddingCard ? "Ajouter une carte" : "Modifier la carte"}</DialogTitle>
            </DialogHeader>
            {editedCard && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <UILabel htmlFor="title">Titre *</UILabel>
                  <Input
                    id="title"
                    value={editedCard.title}
                    onChange={(e) => setEditedCard({ ...editedCard, title: e.target.value })}
                    placeholder="Titre de la carte"
                  />
                </div>

                <div className="space-y-2">
                  <UILabel htmlFor="list">Liste</UILabel>
                  <Select
                    value={editedCard.list_id.toString()}
                    onValueChange={(value) => setEditedCard({ ...editedCard, list_id: Number.parseInt(value) })}
                  >
                    <SelectTrigger id="list">
                      <SelectValue placeholder="Sélectionner une liste" />
                    </SelectTrigger>
                    <SelectContent>
                      {lists.map((list) => (
                        <SelectItem key={list.id} value={list.id.toString()}>
                          {list.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <UILabel htmlFor="label">Label</UILabel>
                  <Select
                    value={editedCard.label_id?.toString() || "0"}
                    onValueChange={(value) =>
                      setEditedCard({
                        ...editedCard,
                        label_id: value === "0" ? null : Number.parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger id="label">
                      <SelectValue placeholder="Sélectionner un label" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Aucun</SelectItem>
                      {labels.map((label: LabelType) => (
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
                  <UILabel htmlFor="description">Description</UILabel>
                  <Textarea
                    id="description"
                    value={editedCard.description}
                    onChange={(e) => setEditedCard({ ...editedCard, description: e.target.value })}
                    rows={3}
                    placeholder="Ajouter une description..."
                  />
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
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false)
                  setIsAddingCard(false)
                }}
              >
                Annuler
              </Button>
              <Button onClick={isAddingCard ? handleSaveNewCard : handleSaveCard}>
                {isAddingCard ? "Créer" : "Enregistrer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DndContext>
  )
}
