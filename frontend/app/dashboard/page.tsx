"use client"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const [boards, setBoards] = useState<
    Array<{
      id: number
      name: string
      color: string
      tasks: number
      workspaceId?: number | null
      workspaceName?: string | null
    }>
  >([])
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  async function handleCreateBoard() {
    console.log("Creating new board...")
    const title = window.prompt("Titre du nouveau board :")
    if (!title || !title.trim()) return
    const token = localStorage.getItem("token")
    if (!token) {
      router.replace("/")
      return
    }
    try {
      const res = await fetch("/api/dashboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: title.trim() }),
      })
      const data = await res.json()
      if (res.ok && data.board) {
        const created = {
          id: data.board.id,
          name: data.board.title,
          color: "bg-blue-500",
          tasks: 0,
          workspaceId: data.board.workspace_id ?? null,
        }
        setBoards(prev => [created, ...prev])
      } else {
        console.error("Create board failed:", data)
        alert(data?.error || "Erreur lors de la création du board")
      }
    } catch (err) {
      console.error(err)
      alert("Erreur réseau")
    }
  }

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

    async function fetchBoards() {
      const token = localStorage.getItem("token")
      if (!token) return
      try {
        const res = await fetch("/api/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          console.error("Fetch failed:", res.status)
          return
        }
        const data = await res.json()
        console.log("Fetched boards:", data)
        if (Array.isArray(data?.boards)) {
          const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-yellow-500", "bg-red-500"]
          const fetchedBoards = data.boards.map((b: any, index: number) => ({
            id: b.id,
            name: b.title ?? "Untitled",
            color: colors[index % colors.length],
            tasks: b.cardsCount ?? b.listsCount ?? 0,
            workspaceId: b.workspaceId ?? null,
            workspaceName: b.workspaceName ?? null,
          }))
          setBoards(fetchedBoards)
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchBoards()
  }, [router])

  const activeWorkspaceId = useMemo(() => {
    const boardWithWorkspace = boards.find((b) => b.workspaceId)
    return boardWithWorkspace?.workspaceId ?? null
  }, [boards])

  if (checking) return null

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            {boards[0]?.workspaceName ? `Workspace : ${boards[0].workspaceName}` : "Welcome back to Trello"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleCreateBoard} className="gap-2 bg-primary text-primary-foreground">
             <Plus className="h-4 w-4" />
             Créer un board
           </Button>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold text-foreground">Mes Boards</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {boards.map((board) => (
            <Card
              key={board.id}
              onClick={() => router.push(`dashboard/board/${board.id}`)}
              role="button"
              className={`group cursor-pointer overflow-hidden transition-all hover:shadow-lg ${board.color}`}
            >
              <div className={`h-24 ${board.color} transition-opacity group-hover:opacity-90`} />
              <div className="p-4 bg-white">
                <h3 className="mb-2 font-semibold text-foreground">{board.name}</h3>
              </div>
            </Card>
          ))}

          <Card onClick={handleCreateBoard} className="group flex cursor-pointer items-center justify-center border-2 border-dashed transition-all hover:border-primary hover:bg-accent">
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