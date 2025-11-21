"use client"

import { useEffect, useMemo, useState } from "react"
import { Users, ShieldCheck, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

type MemberRole = "OWNER" | "ADMIN" | "MEMBER"

type WorkspaceMemberWithUser = {
  id: number
  role: MemberRole
  workspace_id: number
  created_at: string
  user: {
    id: number
    email: string
    username?: string | null
    name?: string | null
    avatar_url?: string | null
  }
}

function getAuthHeaders() {
  if (typeof window === "undefined") return {}
  const token = localStorage.getItem("token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const roleLabels: Record<MemberRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
}

const roleColors: Record<MemberRole, string> = {
  OWNER: "bg-purple-100 text-purple-800",
  ADMIN: "bg-amber-100 text-amber-800",
  MEMBER: "bg-slate-100 text-slate-800",
}

export default function WorkspaceMembersButton({ workspaceId }: { workspaceId: number }) {
  const [open, setOpen] = useState(false)
  const [members, setMembers] = useState<WorkspaceMemberWithUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<MemberRole>("MEMBER")
  const [inviteLoading, setInviteLoading] = useState(false)
  const [roleChangingId, setRoleChangingId] = useState<number | null>(null)
  const [removingId, setRemovingId] = useState<number | null>(null)

  async function tryParseJSON(response: Response) {
    if (!response) return null
    const contentType = response.headers.get("content-type") || ""
    if (contentType.includes("application/json")) {
      try {
        return await response.json()
      } catch (err) {
        return null
      }
    }
    return null
  }

  async function loadMembers() {
    setLoading(true)
    setError(null)
    setStatusMessage(null)
    try {
      const res = await fetch(`/api/workspace/${workspaceId}/members`, {
        headers: { ...getAuthHeaders() },
      })
      const data = await tryParseJSON(res)
      if (!res.ok) {
        throw new Error(data?.error || "Impossible de charger les membres")
      }
      setMembers(data.members || [])
    } catch (err: any) {
      setError(err?.message || "Erreur réseau")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadMembers()
    }
  }, [open])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setStatusMessage(null)
    setError(null)
    if (!inviteEmail.trim()) {
      setError("Email requis")
      return
    }
    setInviteLoading(true)
    try {
      const res = await fetch(`/api/workspace/${workspaceId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      })
      const data = await tryParseJSON(res)
      if (!res.ok) {
        throw new Error(data?.error || "Impossible d'ajouter le membre")
      }
      const normalized: WorkspaceMemberWithUser = {
        id: data.member.id,
        role: data.member.role,
        workspace_id: data.member.workspace_id,
        created_at: data.member.created_at,
        user: data.user,
      }
      setMembers((prev) => [...prev, normalized])
      setInviteEmail("")
      setStatusMessage(`Membre ${data.user.email} ajouté`)
    } catch (err: any) {
      setError(err?.message || "Erreur réseau")
    } finally {
      setInviteLoading(false)
    }
  }

  async function handleRoleChange(memberId: number, newRole: MemberRole) {
    const member = members.find((m) => m.id === memberId)
    if (!member || member.role === newRole) return
    setRoleChangingId(memberId)
    setStatusMessage(null)
    setError(null)
    try {
      const res = await fetch(`/api/workspace/${workspaceId}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ memberId, role: newRole }),
      })
      const data = await tryParseJSON(res)
      if (!res.ok) {
        throw new Error(data?.error || "Impossible de mettre à jour le rôle")
      }
      setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)))
      setStatusMessage("Rôle mis à jour")
    } catch (err: any) {
      setError(err?.message || "Erreur réseau")
    } finally {
      setRoleChangingId(null)
    }
  }

  async function handleRemove(memberId: number) {
    setRemovingId(memberId)
    setStatusMessage(null)
    setError(null)
    try {
      const res = await fetch(`/api/workspace/${workspaceId}/members?memberId=${memberId}`, {
        method: "DELETE",
        headers: { ...getAuthHeaders() },
      })
      const data = await tryParseJSON(res)
      if (!res.ok) {
        throw new Error(data?.error || "Impossible de supprimer le membre")
      }
      setMembers((prev) => prev.filter((m) => m.id !== memberId))
      setStatusMessage("Membre supprimé")
    } catch (err: any) {
      setError(err?.message || "Erreur réseau")
    } finally {
      setRemovingId(null)
    }
  }

  const ownersCount = useMemo(() => members.filter((m) => m.role === "OWNER").length, [members])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <Users className="h-4 w-4" />
          Gérer les membres
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Membres du workspace</DialogTitle>
          <DialogDescription>Invitez, changez les rôles ou retirez des membres.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleInvite} className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="Email du membre"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              type="email"
              className="flex-1"
            />
            <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as MemberRole)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">Member</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="OWNER">Owner</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" disabled={inviteLoading}>
              {inviteLoading ? "Ajout..." : "Ajouter"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Seuls les admins/owners peuvent modifier les membres.</p>
        </form>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {statusMessage && <p className="text-sm text-emerald-600">{statusMessage}</p>}

        <div className="rounded-lg border">
          {loading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Chargement des membres…</div>
          ) : members.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Aucun membre trouvé.</div>
          ) : (
            <div className="max-h-80 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/40 text-left">
                  <tr>
                    <th className="px-4 py-2 font-medium">Utilisateur</th>
                    <th className="px-4 py-2 font-medium">Email</th>
                    <th className="px-4 py-2 font-medium">Rôle</th>
                    <th className="px-4 py-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id} className="border-t">
                      <td className="px-4 py-2">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{member.user.username || member.user.name || "—"}</span>
                          <span className="text-xs text-muted-foreground">ID {member.user.id}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2">{member.user.email}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <Badge className={roleColors[member.role]} variant="outline">
                            {roleLabels[member.role]}
                          </Badge>
                          <Select
                            value={member.role}
                            onValueChange={(value) => handleRoleChange(member.id, value as MemberRole)}
                            disabled={roleChangingId === member.id || member.role === "OWNER"}
                          >
                            <SelectTrigger size="sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MEMBER">Member</SelectItem>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                              <SelectItem value="OWNER">Owner</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right">
                        {member.role === "OWNER" && ownersCount === 1 ? (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Owner
                          </span>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleRemove(member.id)}
                            disabled={removingId === member.id}
                          >
                            <Trash2 className="h-4 w-4" />
                            {removingId === member.id ? "Suppression…" : "Retirer"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

