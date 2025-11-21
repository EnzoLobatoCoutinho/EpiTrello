"use client"
import React, { useState } from 'react'

export default function InviteMember() {
  const [workspaceId, setWorkspaceId] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('MEMBER')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    if (!workspaceId || !email) {
      setMessage('Workspace ID et email requis')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/workspace/${encodeURIComponent(workspaceId)}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage(data.error || 'Erreur')
      } else {
        setMessage('Membre ajouté: ' + (data.user?.email ?? 'ok'))
        setEmail('')
      }
    } catch (err: any) {
      setMessage(err.message || 'Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleInvite} style={{ marginBottom: 16 }}>
      <h3>Ajouter membre par email</h3>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input placeholder="Workspace ID" value={workspaceId} onChange={e => setWorkspaceId(e.target.value)} />
        <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <select value={role} onChange={e => setRole(e.target.value)}>
          <option value="MEMBER">Member</option>
          <option value="ADMIN">Admin</option>
          <option value="OWNER">Owner</option>
        </select>
        <button type="submit" disabled={loading}>{loading ? 'Envoi…' : 'Ajouter'}</button>
      </div>
      {message && <p>{message}</p>}
    </form>
  )
}
