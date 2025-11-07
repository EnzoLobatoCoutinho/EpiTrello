"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Plus, MoreHorizontal } from "lucide-react"
import Link from "next/link"
import { use } from "react"

const boardsData = {
  "1": { name: "Project Alpha", color: "bg-blue-500", tasks: 12 },
  "2": { name: "Marketing Campaign", color: "bg-green-500", tasks: 8 },
  "3": { name: "Design System", color: "bg-purple-500", tasks: 15 },
}

const listsData = [
  {
    id: 1,
    title: "À faire",
    cards: [
      { id: 1, title: "Créer la maquette", description: "Design de la page d'accueil" },
      { id: 2, title: "Rédiger le contenu", description: "Textes pour les sections" },
    ],
  },
  {
    id: 2,
    title: "En cours",
    cards: [{ id: 3, title: "Développer le header", description: "Composant React" }],
  },
  {
    id: 3,
    title: "Terminé",
    cards: [
      { id: 4, title: "Setup du projet", description: "Configuration initiale" },
      { id: 5, title: "Installation des dépendances", description: "npm install" },
    ],
  },
]

export default function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const board = boardsData[id as keyof typeof boardsData]

  if (!board) {
    return <div>Board not found</div>
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
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

      {/* Board Content */}
      <div className="flex-1 overflow-x-auto bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="flex gap-4">
          {listsData.map((list) => (
            <div key={list.id} className="w-72 flex-shrink-0">
              <Card className="bg-background">
                <div className="p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="font-semibold text-foreground">{list.title}</h2>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {list.cards.map((card) => (
                      <Card key={card.id} className="cursor-pointer p-3 transition-shadow hover:shadow-md">
                        <h3 className="mb-1 font-medium text-foreground">{card.title}</h3>
                        <p className="text-sm text-muted-foreground">{card.description}</p>
                      </Card>
                    ))}
                  </div>

                  <Button
                    variant="ghost"
                    className="mt-2 w-full justify-start gap-2 text-muted-foreground hover:bg-accent"
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter une carte
                  </Button>
                </div>
              </Card>
            </div>
          ))}

          {/* Add List Button */}
          <div className="w-72 flex-shrink-0">
            <Button variant="ghost" className="w-full justify-start gap-2 bg-white/50 hover:bg-white/80">
              <Plus className="h-4 w-4" />
              Ajouter une liste
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
