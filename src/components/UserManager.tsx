'use client'

import { useEffect, useState } from 'react'
import { api } from '@/components/ApiClient'
import { CrudTable, type Column } from '@/components/CrudTable'

type Role = 'SUPER_ADMIN' | 'ADMIN' | 'VIEWER'
type City = { id: number; name: string }
type User = {
  id: number
  name: string
  email: string
  role: Role
  cityId: number
  createdAt: string
  city: City
}

const emptyForm = { name: '', email: '', password: '', role: 'VIEWER' as Role, cityId: '' }

function roleClass(role: Role) {
  if (role === 'SUPER_ADMIN') return 'danger'
  if (role === 'ADMIN') return 'warning'
  return 'success'
}

export default function UserManager() {
  const [rows, setRows] = useState<User[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [editing, setEditing] = useState<User | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  const load = async () => {
    const [users, cityData] = await Promise.all([api<User[]>('/api/users?all=1'), api<City[]>('/api/cities?all=1')])
    setRows(users)
    setCities(cityData)
  }

  useEffect(() => {
    load().catch((err) => setError(err.message))
  }, [])

  async function save(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    const payload = {
      ...form,
      cityId: Number(form.cityId),
      ...(editing && !form.password ? { password: undefined } : {}),
    }
    try {
      await api(editing ? `/api/users/${editing.id}` : '/api/users', {
        method: editing ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      })
      setForm(emptyForm)
      setEditing(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    }
  }

  const columns: Column<User>[] = [
    { key: 'name', header: 'User', render: (row) => <strong>{row.name}</strong> },
    { key: 'email', header: 'Email', render: (row) => row.email },
    { key: 'role', header: 'Role', render: (row) => <span className={`badge ${roleClass(row.role)}`}>{row.role}</span> },
    { key: 'city', header: 'City', render: (row) => row.city?.name },
    { key: 'createdAt', header: 'Created', render: (row) => new Date(row.createdAt).toLocaleDateString() },
  ]

  return (
    <div className="grid">
      <div className="card">
        <div className="card-header">
          <div>
            <h3>{editing ? 'Update user' : 'Create user'}</h3>
            <div className="muted">Only SUPER_ADMIN can create, update, or delete users.</div>
          </div>
        </div>

        <form onSubmit={save} className="form-grid">
          <div className="form-field">
            <label>Full name</label>
            <input className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Operator name" />
          </div>
          <div className="form-field">
            <label>Email</label>
            <input className="input" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="user@test.com" />
          </div>
          <div className="form-field">
            <label>Password {editing ? '(leave empty to keep)' : ''}</label>
            <input className="input" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="123456" />
          </div>
          <div className="form-field">
            <label>Role</label>
            <select className="select" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as Role })}>
              <option value="VIEWER">VIEWER</option>
              <option value="ADMIN">ADMIN</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            </select>
          </div>
          <div className="form-field">
            <label>City</label>
            <select className="select" value={form.cityId} onChange={(event) => setForm({ ...form, cityId: event.target.value })}>
              <option value="">Select city</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>{city.name}</option>
              ))}
            </select>
          </div>
          <div className="actions">
            <button className="btn">{editing ? 'Save changes' : 'Add user'}</button>
            {editing && (
              <button
                type="button"
                className="btn secondary"
                onClick={() => {
                  setEditing(null)
                  setForm(emptyForm)
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
        {error && <p className="badge danger" style={{ marginTop: 12 }}>{error}</p>}
      </div>

      <div className="card">
        <CrudTable
          rows={rows}
          columns={columns}
          searchPlaceholder="Search users by name, email, role, city..."
          onEdit={(row) => {
            setEditing(row)
            setForm({ name: row.name, email: row.email, password: '', role: row.role, cityId: String(row.cityId) })
          }}
          onDelete={async (row) => {
            if (!confirm(`Delete ${row.email}?`)) return
            try {
              await api(`/api/users/${row.id}`, { method: 'DELETE' })
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
