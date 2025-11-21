"use client"
import React, { useEffect, useState } from 'react'
import InviteMemberInline from './invite-member-inline'

type Member = {
  id: number
  role: string
  created_at: string
  user: { id: number; email: string; username?: string }
}

export default function WorkspaceMembers({ workspaceId }: { workspaceId: number }) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const res = await fetch(`/api/workspace/${workspaceId}/members`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
  const data = await tryParseJSON(res)
  if (!res.ok) throw new Error((data && data.error) || 'Erreur')
      setMembers(data.members || [])
    } catch (err: any) {
      setError(err.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (workspaceId) load() }, [workspaceId])

  async function changeRole(memberId: number, role: string) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    try {
      const res = await fetch(`/api/workspace/${workspaceId}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ memberId, role }),
      })
      const data = await tryParseJSON(res)
      if (!res.ok) throw new Error((data && data.error) || 'Erreur')
      setMembers((s) => s.map(m => m.id === data.member.id ? { ...m, role: data.member.role } : m))
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Erreur')
    }
  }

  async function removeMember(memberId: number) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    try {
      const res = await fetch(`/api/workspace/${workspaceId}/members?memberId=${memberId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      const data = await tryParseJSON(res)
      if (!res.ok) throw new Error((data && data.error) || 'Erreur')
      setMembers((s) => s.filter(m => m.id !== memberId))
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Erreur')
    }
  }

  return (
    <div className="rounded bg-white/70 p-3 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Membres du workspace</h3>
        <InviteMemberInline workspaceId={workspaceId} />
      </div>
      {loading && <div>Chargement…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {!loading && members.length === 0 && <div className="text-sm text-muted-foreground">Aucun membre</div>}
      <ul className="space-y-2">
        {members.map(m => (
          <li key={m.id} className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium">{m.user.username ?? m.user.email}</div>
              <div className="text-xs text-muted-foreground">{m.user.email}</div>
            </div>
            <div className="flex items-center gap-2">
              <select value={m.role} onChange={e => changeRole(m.id, e.target.value)} className="rounded border px-2 py-1 text-sm">
                <option value="OWNER">Owner</option>
                <option value="ADMIN">Admin</option>
                <option value="MEMBER">Member</option>
              </select>
              <button onClick={() => removeMember(m.id)} className="text-sm text-red-600">Supprimer</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
