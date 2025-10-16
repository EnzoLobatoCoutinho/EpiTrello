"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const [boards, setBoards] = useState([
    { id: 1, name: "Project Alpha", color: "bg-blue-500", tasks: 12 },
    { id: 2, name: "Marketing Campaign", color: "bg-green-500", tasks: 8 },
    { id: 3, name: "Design System", color: "bg-purple-500", tasks: 15 },
  ])
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function verify() {
      const token = localStorage.getItem("token")
      if (!token) {
        router.replace("/")
        return
      }

      try {
        const res = await fetch("/api/user", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          router.replace("/")
          return
        }
      } catch (err) {
        router.replace("/")
        return
      } finally {
        setChecking(false)
      }
    }
    verify()
  }, [router])

  if (checking) return null

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back to Trello</p>
        </div>
        <Button className="gap-2 bg-primary text-primary-foreground">
          <Plus className="h-4 w-4" />
          Créer un board
        </Button>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold text-foreground">Mes Boards</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {boards.map((board) => (
            <Card key={board.id} className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg">
              <div className={`h-24 ${board.color} transition-opacity group-hover:opacity-90`} />
              <div className="p-4">
                <h3 className="mb-2 font-semibold text-foreground">{board.name}</h3>
                <p className="text-sm text-muted-foreground">{board.tasks} tâches</p>
              </div>
            </Card>
          ))}

          <Card className="group flex cursor-pointer items-center justify-center border-2 border-dashed transition-all hover:border-primary hover:bg-accent">
            <div className="p-8 text-center">
              <Plus className="mx-auto mb-2 h-8 w-8 text-muted-foreground transition-colors group-hover:text-primary" />
              <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground">Nouveau board</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}