'use client'

import { useEffect, useState } from 'react'
import { api } from '@/components/ApiClient'
import { CrudTable, type Column } from '@/components/CrudTable'

type City = {
  id: number
  name: string
  createdAt: string
  _count?: { users: number; drones: number }
}

export default function CityManager() {
  const [rows, setRows] = useState<City[]>([])
  const [name, setName] = useState('')
  const [editing, setEditing] = useState<City | null>(null)
  const [error, setError] = useState('')

  const load = async () => {
    const data = await api<City[]>('/api/cities?all=1')
    setRows(data)
  }

  useEffect(() => {
    load().catch((err) => setError(err.message))
  }, [])

  async function save(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    try {
      await api(editing ? `/api/cities/${editing.id}` : '/api/cities', {
        method: editing ? 'PUT' : 'POST',
        body: JSON.stringify({ name }),
      })
      setName('')
      setEditing(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    }
  }

  const columns: Column<City>[] = [
    { key: 'name', header: 'City', render: (row) => <strong>{row.name}</strong> },
    { key: 'users', header: 'Users', render: (row) => row._count?.users ?? 0 },
    { key: 'drones', header: 'Drones', render: (row) => row._count?.drones ?? 0 },
    { key: 'createdAt', header: 'Created', render: (row) => new Date(row.createdAt).toLocaleDateString() },
  ]

  return (
    <div className="grid">
      <div className="card">
        <div className="card-header">
          <div>
            <h3>{editing ? 'Update city' : 'Create city'}</h3>
            <div className="muted">Admins can manage cities. Super admins have full access.</div>
          </div>
        </div>
        <form onSubmit={save} className="form-grid" style={{ gridTemplateColumns: '1fr auto auto' }}>
          <div className="form-field">
            <label>City name</label>
            <input className="input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Example: Damascus" />
          </div>
          <button className="btn">{editing ? 'Save changes' : 'Add city'}</button>
          {editing && (
            <button
              type="button"
              className="btn secondary"
              onClick={() => {
                setEditing(null)
                setName('')
              }}
            >
              Cancel
            </button>
          )}
        </form>
        {error && <p className="badge danger" style={{ marginTop: 12 }}>{error}</p>}
      </div>

      <div className="card">
        <CrudTable
          rows={rows}
          columns={columns}
          searchPlaceholder="Search by city, users count, drones count..."
          onEdit={(row) => {
            setEditing(row)
            setName(row.name)
          }}
          onDelete={async (row) => {
            if (!confirm(`Delete ${row.name}?`)) return
            try {
              await api(`/api/cities/${row.id}`, { method: 'DELETE' })
              await load()
            } catch (err) {
              alert(err instanceof Error ? err.message : 'Delete failed')
            }
          }}
        />
      </div>
    </div>
  )
}
