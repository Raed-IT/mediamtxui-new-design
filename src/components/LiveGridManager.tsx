'use client'

import { useEffect, useMemo, useState } from 'react'
import { api } from '@/components/ApiClient'

type LiveDrone = {
  id: number
  name: string
  label: string
  streamKey: string
  city?: { name: string }
  online: boolean
  webrtcUrl: string
}

const gridOptions = [
  { label: '1', size: 1, className: 'one' },
  { label: '2×2', size: 4, className: 'two' },
  { label: '3×3', size: 9, className: 'three' },
  { label: '4×4', size: 16, className: 'four' },
]

export default function LiveGridManager() {
  const [drones, setDrones] = useState<LiveDrone[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [gridSize, setGridSize] = useState(4)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  const selectedOption = gridOptions.find((item) => item.size === gridSize) || gridOptions[1]
  const selectedDrones = selectedIds.map((id) => drones.find((drone) => drone.id === id)).filter(Boolean) as LiveDrone[]

  const visibleDrones = useMemo(() => {
    const value = search.trim().toLowerCase()
    if (!value) return drones
    return drones.filter((drone) => `${drone.name} ${drone.label} ${drone.city?.name || ''}`.toLowerCase().includes(value))
  }, [drones, search])

  async function load() {
    try {
      const data = await api<LiveDrone[]>('/api/live/drones')
      setDrones(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load live drones')
    }
  }

  useEffect(() => {
    load()
    const interval = window.setInterval(load, 5000)
    return () => window.clearInterval(interval)
  }, [])

  function toggleDrone(drone: LiveDrone) {
    setSelectedIds((current) => {
      if (current.includes(drone.id)) return current.filter((id) => id !== drone.id)
      if (current.length >= gridSize) return [...current.slice(1), drone.id]
      return [...current, drone.id]
    })
  }

  function clearCell(index: number) {
    setSelectedIds((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }

  return (
    <div className="live-layout">
      <section className="card">
        <div className="card-header">
          <div>
            <h3>Available drones</h3>
            <div className="muted">Filtered automatically by authenticated user city.</div>
          </div>
          <button className="btn secondary small" onClick={load}>Refresh</button>
        </div>

        <input className="input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search live drones..." />

        <div className="actions" style={{ margin: '14px 0' }}>
          {gridOptions.map((option) => (
            <button
              key={option.size}
              className={`btn small ${gridSize === option.size ? '' : 'secondary'}`}
              onClick={() => {
                setGridSize(option.size)
                setSelectedIds((current) => current.slice(0, option.size))
              }}
            >
              {option.label}
            </button>
          ))}
          <button className="btn danger small" onClick={() => setSelectedIds([])}>Clear</button>
        </div>

        {error && <p className="badge danger">{error}</p>}

        <div className="drone-list">
          {visibleDrones.map((drone) => {
            const active = selectedIds.includes(drone.id)
            return (
              <button
                key={drone.id}
                className="drone-card"
                onClick={() => toggleDrone(drone)}
                style={{ textAlign: 'left', color: 'inherit', cursor: 'pointer', borderColor: active ? 'rgba(56,189,248,.75)' : undefined }}
              >
                <div className="actions" style={{ justifyContent: 'space-between' }}>
                  <strong>{drone.label}</strong>
                  <span className={`badge ${drone.online ? 'success' : 'danger'}`}>{drone.online ? 'LIVE' : 'OFFLINE'}</span>
                </div>
                <div className="muted">{drone.name} · {drone.city?.name || 'No city'}</div>
                <div className="badge">{drone.streamKey}</div>
              </button>
            )
          })}
          {visibleDrones.length === 0 && <div className="empty-state">No drones available for your city.</div>}
        </div>
      </section>

      <section>
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="actions" style={{ justifyContent: 'space-between' }}>
            <div>
              <strong>NVR Grid</strong>
              <div className="muted">Selected {selectedDrones.length} / {gridSize} cells</div>
            </div>
            <span className="badge">{selectedOption.label}</span>
          </div>
        </div>

        <div className={`live-grid ${selectedOption.className}`}>
          {Array.from({ length: gridSize }).map((_, index) => {
            const drone = selectedDrones[index]
            return (
              <div key={index} className="cell">
                {drone ? (
                  <>
                    <div className="cell-title">
                      <span className={`badge ${drone.online ? 'success' : 'danger'}`}>{drone.online ? 'LIVE' : 'OFF'}</span>
                      <span>{drone.label}</span>
                    </div>
                    <div className="cell-actions">
                      <button className="btn danger small" onClick={() => clearCell(index)}>×</button>
                    </div>
                    <iframe src={drone.webrtcUrl} allow="autoplay; fullscreen; camera; microphone" title={drone.label} />
                  </>
                ) : (
                  <div className="empty">
                    <div>
                      <strong>Empty cell {index + 1}</strong>
                      <div>Select a drone from the list.</div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
