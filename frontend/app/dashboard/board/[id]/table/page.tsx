"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Edit, Trash2, Plus } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label as UILabel } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

export default function TablePage({ params }: { params: { id: string } }) {
  const { id } = params
  const [board, setBoard] = useState<{ id: number; title: string; color?: string } | null>(null)
  const labels = boardLabels[id] || []
  const [lists, setLists] = useState<ListType[]>([])
  const [cards, setCards] = useState<CardType[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editedCard, setEditedCard] = useState<CardType | null>(null)
  const [isAddingCard, setIsAddingCard] = useState(false)

  // Charger les données depuis l'API
  useEffect(() => {
    let mounted = true
    async function loadData() {
      setLoading(true)
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
      
      try {
        const res = await fetch(`/api/dashboard/board/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
        
        if (!res.ok) {
          console.error("Erreur lors du chargement du board")
          setLoading(false)
          return
        }
        
        const data = await res.json()
        if (!mounted) return

        // Charger les infos du board
        const bd = data.boardsData && data.boardsData[String(id)]
        if (bd) {
          setBoard({ 
            id: Number(id), 
            title: bd.name ?? bd.title ?? `Board ${id}`, 
            color: bd.color || "bg-blue-500" 
          })
        } else if (data.board) {
          setBoard({ 
            id: Number(id), 
            title: data.board.title, 
            color: data.board.color || "bg-blue-500" 
          })
        }

        // Charger les listes
        const apiLists = Array.isArray(data.lists) ? data.lists : []
        const mappedLists: ListType[] = apiLists.map((l: any, idx: number) => ({
          id: Number(l.id),
          board_id: Number(id),
          title: l.title,
          position: l.position ?? idx,
        }))
        setLists(mappedLists)

        // Charger toutes les cartes
        const allCards: CardType[] = []
        apiLists.forEach((l: any) => {
          (l.cards || []).forEach((c: any, idx: number) => {
            allCards.push({
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
        setCards(allCards)
      } catch (err) {
        console.error("Erreur:", err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    
    loadData()
    return () => {
      mounted = false
    }
  }, [id])

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
    setIsAddingCard(false)
    setIsDialogOpen(true)
  }

  async function handleSaveCard() {
    if (!editedCard) return

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    
    try {
      if (!token) {
        setCards(cards.map((card) => (card.id === editedCard.id ? editedCard : card)))
        setIsDialogOpen(false)
        return
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
      })

      if (!response.ok) {
        console.error("Erreur lors de la mise à jour de la carte")
        setCards(cards.map((card) => (card.id === editedCard.id ? editedCard : card)))
        setIsDialogOpen(false)
        return
      }

      const updatedCard = await response.json()
      
      setCards(cards.map((card) => 
        card.id === updatedCard.id 
          ? {
              ...card,
              title: updatedCard.title,
              description: updatedCard.description || "",
              label_id: updatedCard.label_id,
              start_date: updatedCard.start_date ? new Date(updatedCard.start_date).toISOString() : card.start_date,
              due_date: updatedCard.due_date ? new Date(updatedCard.due_date).toISOString() : card.due_date,
              list_id: updatedCard.list_id || card.list_id,
            }
          : card
      ))
      
      console.log("✅ Carte mise à jour avec succès")
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Erreur réseau:", error)
      setCards(cards.map((card) => (card.id === editedCard.id ? editedCard : card)))
      setIsDialogOpen(false)
    }
  }

  async function handleDeleteCard(cardId: number) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette carte ?")) return

    const card = cards.find(c => c.id === cardId)
    if (!card) return

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    
    try {
      if (!token) {
        setCards(cards.filter((c) => c.id !== cardId))
        return
      }

      const response = await fetch(`/api/dashboard/list/${card.list_id}/cards/${cardId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        console.error("Erreur lors de la suppression de la carte")
      }

      setCards(cards.filter((c) => c.id !== cardId))
      console.log("✅ Carte supprimée avec succès")
    } catch (error) {
      console.error("Erreur réseau:", error)
      setCards(cards.filter((c) => c.id !== cardId))
    }
  }

  function handleAddCard() {
    setIsAddingCard(true)
    const now = new Date().toISOString()
    const newCard: CardType = {
      id: Date.now(),
      list_id: lists[0]?.id || 1,
      label_id: null,
      title: "",
      description: "",
      start_date: now,
      due_date: now,
      position: cards.length,
    }
    setEditedCard(newCard)
    setIsDialogOpen(true)
  }

  async function handleSaveNewCard() {
    if (!editedCard || !editedCard.title.trim()) {
      alert("Le titre de la carte est obligatoire")
      return
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    
    try {
      if (!token) {
        setCards([...cards, editedCard])
        setIsDialogOpen(false)
        setIsAddingCard(false)
        return
      }

      const response = await fetch(`/api/dashboard/list/${editedCard.list_id}/cards`, {
        method: "POST",
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
        }),
      })

      if (!response.ok) {
        console.error("Erreur lors de la création de la carte")
        setCards([...cards, editedCard])
        setIsDialogOpen(false)
        setIsAddingCard(false)
        return
      }

      const data = await response.json()
      
      const newCard: CardType = {
        id: Number(data.id),
        list_id: Number(data.list_id || editedCard.list_id),
        label_id: data.label_id ? Number(data.label_id) : null,
        title: data.title,
        description: data.description || "",
        start_date: data.start_date ? new Date(data.start_date).toISOString() : editedCard.start_date,
        due_date: data.due_date ? new Date(data.due_date).toISOString() : editedCard.due_date,
        position: data.position ?? cards.length,
      }
      
      setCards([...cards, newCard])
      console.log("✅ Carte créée avec succès")
      setIsDialogOpen(false)
      setIsAddingCard(false)
    } catch (error) {
      console.error("Erreur réseau:", error)
      setCards([...cards, editedCard])
      setIsDialogOpen(false)
      setIsAddingCard(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg text-muted-foreground">Chargement...</p>
      </div>
    )
  }

  if (!board) {
    return <div>Board not found</div>
  }

  return (
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
            <Button variant="secondary" onClick={handleAddCard}>
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
                  <TableCell colSpan={7} className="h-24 text-center">
                    Aucune carte. Cliquez sur "Ajouter une carte" pour commencer.
                  </TableCell>
                </TableRow>
              ) : (
                cards.map((card) => {
                  const label = getLabelById(card.label_id)
                  return (
                    <TableRow key={card.id}>
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
                      <TableCell className="max-w-[300px] truncate text-sm text-muted-foreground">
                        {card.description || "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {card.start_date ? new Date(card.start_date).toLocaleDateString("fr-FR") : "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {card.due_date ? new Date(card.due_date).toLocaleDateString("fr-FR") : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditCard(card)} className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteCard(card.id)}
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

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
  )
}