"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
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
        // optionally read user: const data = await res.json()
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Tableau de bord</h1>
        <p className="text-muted-foreground">Bienvenue sur Trello</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="mb-2 text-lg font-semibold text-foreground">Mes tableaux</h3>
          <p className="text-3xl font-bold text-primary">0</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h3 className="mb-2 text-lg font-semibold text-foreground">Tâches</h3>
          <p className="text-3xl font-bold text-primary">0</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h3 className="mb-2 text-lg font-semibold text-foreground">Terminées</h3>
          <p className="text-3xl font-bold text-primary">0</p>
        </div>
      </div>
    </div>
  )
}