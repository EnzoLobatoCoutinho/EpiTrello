"use client"
import React, { useEffect, useState } from 'react'

import InviteMember from './invite-member'

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/users', { headers: { 'Content-Type': 'application/json' } })
      if (!res.ok) throw new Error((await res.json()).error || 'Erreur')
      const data = await res.json()
      setUsers(data.users || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div>
      <h2>Gestion des utilisateurs (Admin)</h2>
      <InviteMember />
      {loading && <p>Chargement…</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <table>
        <thead>
          <tr><th>ID</th><th>Email</th><th>Username</th><th>Admin</th><th>Active</th></tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.email}</td>
              <td>{u.username}</td>
              <td>{String(u.is_admin)}</td>
              <td>{String(u.is_active)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
