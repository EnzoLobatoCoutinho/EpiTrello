"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const [isEditingName, setIsEditingName] = useState(false)
  const [isEditingPassword, setIsEditingPassword] = useState(false)
  const [name, setName] = useState("Chargement...")
  const [email, setEmail] = useState("Chargement...")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [result, setResult] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function fetchProfile() {
      const token = localStorage.getItem("token")
      if (!token) return
      try {
        const res = await fetch("/api/user", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (res.ok && data.user) {
          setName(data.user.username)
          setEmail(data.user.email)
        } else {
          console.warn("Profile fetch:", data)
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchProfile()
  }, [])

  async function handleSaveName() {
    const token = localStorage.getItem("token")
    if (!token) return setResult("Non authentifié")
    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult("Nom mis à jour.")
        setIsEditingName(false)
      } else {
        setResult(data?.error || "Erreur")
      }
    } catch (err) {
      setResult("Erreur réseau")
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) return setResult("Les mots de passe ne correspondent pas")
    const token = localStorage.getItem("token")
    if (!token) return setResult("Non authentifié")
    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult("Mot de passe mis à jour.")
        setIsEditingPassword(false)
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        setResult(data?.error || "Erreur")
      }
    } catch {
      setResult("Erreur réseau")
    }
  }

  async function handleDelete() {
    if (!confirm("Supprimer votre compte ? Cette action est irréversible.")) return
    const token = localStorage.getItem("token")
    if (!token) return setResult("Non authentifié")
    try {
      const res = await fetch("/api/user", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        localStorage.removeItem("token")
        router.push("/")
      } else {
        const data = await res.json()
        setResult(data?.error || "Erreur suppression")
      }
    } catch {
      setResult("Erreur réseau")
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Button variant="ghost" className="gap-2" asChild>
          <a href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Retour au Dashboard
          </a>
        </Button>
      </div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Paramètres</h1>
        <p className="text-muted-foreground">Gérer les paramètres de votre compte</p>
      </div>

      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="p-6">
          <h2 className="mb-6 text-xl font-semibold text-foreground">Informations sur le profil</h2>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nom d'utilisateur</Label>
              {isEditingName ? (
                <div className="flex gap-2">
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleSaveName} className="bg-primary text-primary-foreground">
                    Enregistrer
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditingName(false)}>
                    Annuler
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-3">
                  <span className="text-foreground">{name}</span>
                  <Button variant="ghost" size="sm" onClick={() => setIsEditingName(true)}>
                    Modifier
                  </Button>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-3">
                <span className="text-foreground">{email}</span>
                <span className="text-xs text-muted-foreground">Impossible à modifier</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-6 text-xl font-semibold text-foreground">Mot de passe</h2>

          {isEditingPassword ? (
            <form className="space-y-4" onSubmit={handleChangePassword}>
              <div className="space-y-2">
                <Label htmlFor="current-password">Mot de passe actuel</Label>
                <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Entrez le mot de passe actuel" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">Nouveau mot de passe</Label>
                <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Entrez le nouveau mot de passe" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmer le nouveau mot de passe</Label>
                <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirmer le nouveau mot de passe" />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="bg-primary text-primary-foreground">
                  Mettre à jour le mot de passe
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsEditingPassword(false)}>
                  Annuler
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-3">
              <span className="text-foreground">••••••••</span>
              <Button variant="ghost" size="sm" onClick={() => setIsEditingPassword(true)}>
                Changer le mot de passe
              </Button>
            </div>
          )}
        </Card>

        <Separator />
        <Card className="border-destructive/50 p-6">
          <h2 className="mb-4 text-xl font-semibold text-destructive">Danger Zone</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Une fois votre compte supprimé, il n'y a pas de retour en arrière. Veuillez en être certain.
          </p>
          <Button variant="destructive" onClick={handleDelete}>Supprimer le compte</Button>
        </Card>

        {result && <div className="mt-4 text-sm text-muted-foreground">{result}</div>}
      </div>
    </div>
  )
}