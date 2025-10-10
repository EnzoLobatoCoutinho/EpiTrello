"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export default function RegisterPage() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      })

      const data = await res.json()
      if (!res.ok) {
        setResult(`${data.error || "Erreur inconnue"}`)
      } else {
        setResult(`Utilisateur créé avec succès`)
        window.location.href = "/login"
      }
    } catch (err) {
      setResult("Erreur de requête (API inaccessible)")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <a href="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-primary">
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="7" height="9" rx="1" fill="white" />
                <rect x="14" y="3" width="7" height="5" rx="1" fill="white" />
                <rect x="3" y="16" width="7" height="5" rx="1" fill="white" />
                <rect x="14" y="12" width="7" height="9" rx="1" fill="white" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-foreground">Trello</span>
          </a>
        </div>

        <div className="rounded-lg border bg-white p-8 shadow-sm">
          <h1 className="mb-6 text-center text-2xl font-semibold text-foreground">
            S'inscrire
          </h1>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="username">Nom d'utilisateur</Label>
              <Input
                id="username"
                type="text"
                placeholder="Entrez votre nom d'utilisateur"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Entrez votre email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="Créer un mot de passe"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={loading}
            >
              {loading ? "Création..." : "S'inscrire"}
            </Button>
          </form>

          {result && (
            <>
              <Separator className="my-4" />
              <pre className="rounded bg-slate-100 p-3 text-xs overflow-auto text-slate-700">
                {result}
              </pre>
            </>
          )}
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Vous avez déjà un compte ?{" "}
          <a href="/login" className="text-primary hover:underline">
            Se connecter
          </a>
        </div>
      </div>
    </div>
  )
}
