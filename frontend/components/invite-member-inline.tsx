"use client"
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

export default function InviteMemberInline({ workspaceId }: { workspaceId: number }) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('MEMBER')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleInvite(e?: React.FormEvent) {
    e?.preventDefault()
    setMessage(null)
    if (!email) {
      setMessage('Email requis')
      return
    }
    setLoading(true)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const res = await fetch(`/api/workspace/${workspaceId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ email, role }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage(data.error || 'Erreur')
      } else {
        setMessage('Membre ajouté: ' + (data.user?.email ?? 'ok'))
        setEmail('')
        setOpen(false)
      }
    } catch (err: any) {
      setMessage(err.message || 'Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Ajouter un membre
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un membre au workspace</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="block text-sm">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" />
            </div>
            <div className="space-y-1">
              <label className="block text-sm">Rôle</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded border px-2 py-1">
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
                <option value="OWNER">Owner</option>
              </select>
            </div>
            {message && <div className="text-sm text-red-600">{message}</div>}
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} type="button">Annuler</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Envoi…' : 'Ajouter'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
