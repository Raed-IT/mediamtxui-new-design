'use client'

import { useEffect, useState } from 'react'
import { api } from '@/components/ApiClient'
import { CrudTable, type Column } from '@/components/CrudTable'

type City = { id: number; name: string }
type Drone = {
  id: number
  name: string
  label: string
  streamKey: string
  cityId: number
  createdAt: string
  city: City
}

const emptyForm = { name: '', label: '', streamKey: '', cityId: '' }

export default function DroneManager() {
  const [rows, setRows] = useState<Drone[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [editing, setEditing] = useState<Drone | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  const load = async () => {
    const [droneData, cityData] = await Promise.all([api<Drone[]>('/api/drones?all=1'), api<City[]>('/api/cities?all=1')])
    setRows(droneData)
    setCities(cityData)
  }

  useEffect(() => {
    load().catch((err) => setError(err.message))
  }, [])

  async function save(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    try {
      await api(editing ? `/api/drones/${editing.id}` : '/api/drones', {
        method: editing ? 'PUT' : 'POST',
        body: JSON.stringify({ ...form, cityId: Number(form.cityId) }),
      })
      setForm(emptyForm)
      setEditing(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    }
  }

  const columns: Column<Drone>[] = [
    { key: 'name', header: 'Drone', render: (row) => <strong>{row.name}</strong> },
    { key: 'label', header: 'Label', render: (row) => row.label },
    { key: 'streamKey', header: 'Stream key', render: (row) => <span className="badge">{row.streamKey}</span> },
    { key: 'city', header: 'City', render: (row) => row.city?.name },
    { key: 'createdAt', header: 'Created', render: (row) => new Date(row.createdAt).toLocaleDateString() },
  ]

  return (
    <div className="grid">
      <div className="card">
        <div className="card-header">
          <div>
            <h3>{editing ? 'Update drone' : 'Create drone'}</h3>
            <div className="muted">Stream key must match the MediaMTX path name, for example drone-01.</div>
          </div>
        </div>

        <form onSubmit={save} className="form-grid">
          <div className="form-field">
            <label>Drone name</label>
            <input className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="drone-01" />
          </div>
          <div className="form-field">
            <label>Display label</label>
            <input className="input" value={form.label} onChange={(event) => setForm({ ...form, label: event.target.value })} placeholder="Damascus Patrol 01" />
          </div>
          <div className="form-field">
            <label>Stream key</label>
            <input className="input" value={form.streamKey} onChange={(event) => setForm({ ...form, streamKey: event.target.value })} placeholder="drone-01" />
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
            <button className="btn">{editing ? 'Save changes' : 'Add drone'}</button>
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
          searchPlaceholder="Search drones by name, city, stream key..."
          onEdit={(row) => {
            setEditing(row)
            setForm({ name: row.name, label: row.label, streamKey: row.streamKey, cityId: String(row.cityId) })
          }}
          onDelete={async (row) => {
            if (!confirm(`Delete ${row.label}?`)) return
            try {
              await api(`/api/drones/${row.id}`, { method: 'DELETE' })
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
