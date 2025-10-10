"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useState } from "react"

export default function SettingsPage() {
  const [isEditingName, setIsEditingName] = useState(false)
  const [isEditingPassword, setIsEditingPassword] = useState(false)
  const [name, setName] = useState("John Doe")
  const [email] = useState("john.doe@example.com")

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Paramètres</h1>
        <p className="text-muted-foreground">Gérer les paramètres de votre compte</p>
      </div>

      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="p-6">
          <h2 className="mb-6 text-xl font-semibold text-foreground">Informations sur le profil</h2>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nom complet</Label>
              {isEditingName ? (
                <div className="flex gap-2">
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={() => setIsEditingName(false)} className="bg-primary text-primary-foreground">
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
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Mot de passe actuel</Label>
                <Input id="current-password" type="password" placeholder="Entrez le mot de passe actuel" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">Nouveau mot de passe</Label>
                <Input id="new-password" type="password" placeholder="Entrez le nouveau mot de passe" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmer le nouveau mot de passe</Label>
                <Input id="confirm-password" type="password" placeholder="Confirmer le nouveau mot de passe" />
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
          <Button variant="destructive">Supprimer le compte</Button>
        </Card>
      </div>
    </div>
  )
}
