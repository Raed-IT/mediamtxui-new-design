'use client'

import Shell from '@/components/Shell'
import { api } from '@/components/ApiClient'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Camera,
  Columns3,
  Expand,
  Grid2X2,
  ListVideo,
  Maximize2,
  MonitorPlay,
  PanelRightClose,
  PanelRightOpen,
  Radio,
  RefreshCw,
  Video,
  X,
} from 'lucide-react'

type Drone = {
  id: number
  name: string
  label: string
  streamKey: string
  city: { name: string }
  online: boolean
  webrtcUrl: string
  isRecording?: boolean
}

type Cell = Drone | null

function getNumberSetting(key: string, fallback: number) {
  if (typeof window === 'undefined') return fallback
  const value = Number(localStorage.getItem(key))
  return Number.isFinite(value) && value > 0 ? value : fallback
}

function getDefaultColumns(cells: number) {
  if (cells <= 1) return 1
  if (cells <= 4) return 2
  if (cells <= 9) return 3
  if (cells <= 16) return 4
  if (cells <= 25) return 5
  return 6
}

export default function LiveGrid() {
  const [liveDrones, setLiveDrones] = useState<Drone[]>([])
  const [cells, setCells] = useState<Cell[]>([])
  const [cellCount, setCellCount] = useState(20)
  const [columns, setColumns] = useState(5)
  const [selectedCell, setSelectedCell] = useState(0)
  const [expanded, setExpanded] = useState<Drone | null>(null)
  const [toast, setToast] = useState('')
  const [autoFill, setAutoFill] = useState(true)
  const [showLiveDrones, setShowLiveDrones] = useState(true)
  const [fullscreenMode, setFullscreenMode] = useState(false)
  const [fullscreenColumns, setFullscreenColumns] = useState(5)
  const [fullscreenRows, setFullscreenRows] = useState(4)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  const activeCells = useMemo(() => cells.filter(Boolean).length, [cells])
  const assignedIds = useMemo(() => new Set(cells.filter(Boolean).map((drone) => drone!.id)), [cells])
  const unassignedLiveDrones = useMemo(
    () => liveDrones.filter((drone) => !assignedIds.has(drone.id)),
    [liveDrones, assignedIds]
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const savedCellCount = getNumberSetting('liveGridCellCount', 20)
    const savedColumns = getNumberSetting('liveGridColumns', getDefaultColumns(savedCellCount))

    setCellCount(savedCellCount)
    setColumns(savedColumns)
    setFullscreenColumns(savedColumns)
    setFullscreenRows(Math.max(1, Math.ceil(savedCellCount / savedColumns)))
    setCells(Array(savedCellCount).fill(null))
  }, [])

  useEffect(() => {
    if (!fullscreenMode) return

    window.dispatchEvent(new CustomEvent('streamops:toggle-sidebar', { detail: { hidden: true } }))
    document.body.classList.add('grid-monitor-active')

    if (document.fullscreenEnabled && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    }

    return () => {
      document.body.classList.remove('grid-monitor-active')
      window.dispatchEvent(new CustomEvent('streamops:toggle-sidebar', { detail: { hidden: false } }))
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    }
  }, [fullscreenMode])

  useEffect(() => {
    if (!expanded) return

    document.body.classList.add('stream-modal-open', 'live-grid-modal-open')

    return () => {
      document.body.classList.remove('stream-modal-open', 'live-grid-modal-open')
    }
  }, [expanded])

  async function loadLiveDrones() {
    const data = await api<Drone[]>('/api/live/drones')
    const onlineOnly = data.filter((drone) => drone.online !== false)
    setLiveDrones(onlineOnly)

    if (!autoFill) return

    setCells((old) => {
      const next = Array(cellCount).fill(null) as Cell[]
      const liveIds = new Set(onlineOnly.map((drone) => drone.id))

      let pointer = 0
      for (const current of old) {
        if (!current || !liveIds.has(current.id)) continue
        if (pointer >= next.length) break
        next[pointer] = current
        pointer += 1
      }

      const alreadyPlaced = new Set(next.filter(Boolean).map((drone) => drone!.id))
      for (const drone of onlineOnly) {
        if (alreadyPlaced.has(drone.id)) continue
        const emptyIndex = next.findIndex((cell) => !cell)
        if (emptyIndex < 0) break
        next[emptyIndex] = drone
        alreadyPlaced.add(drone.id)
      }

      return next
    })
  }

  useEffect(() => {
    setLoading(true)
    loadLiveDrones()
      .catch(() => setToast('تعذر تحديث البثوث المباشرة'))
      .finally(() => setLoading(false))

    const interval = setInterval(() => loadLiveDrones().catch(() => {}), 4000)
    return () => clearInterval(interval)
  }, [cellCount, autoFill])

  function updateCellCount(value: number) {
    const nextCount = Math.max(1, Math.min(64, value || 20))
    setCellCount(nextCount)
    localStorage.setItem('liveGridCellCount', String(nextCount))
    setCells((old) => {
      const next = old.slice(0, nextCount)
      while (next.length < nextCount) next.push(null)
      return next
    })
    if (selectedCell >= nextCount) setSelectedCell(0)
  }

  function updateColumns(value: number) {
    const nextColumns = Math.max(1, Math.min(12, value || getDefaultColumns(cellCount)))
    setColumns(nextColumns)
    localStorage.setItem('liveGridColumns', String(nextColumns))
  }



  function updateFullscreenLayout(nextRows: number, nextColumns: number) {
    const safeRows = Math.max(1, Math.min(12, nextRows || 1))
    const safeColumns = Math.max(1, Math.min(12, nextColumns || 1))
    setFullscreenRows(safeRows)
    setFullscreenColumns(safeColumns)
    updateCellCount(safeRows * safeColumns)
  }

  function assignDrone(drone: Drone, index = selectedCell) {
    setCells((old) => {
      const next = old.map((cell) => (cell?.id === drone.id ? null : cell))
      next[index] = drone
      return next
    })
    setToast(`${drone.label} added to cell ${index + 1}`)
  }

  function clearCell(index: number) {
    setCells((old) => {
      const next = [...old]
      next[index] = null
      return next
    })
  }

  async function startRecording(drone: Drone) {
    try {
      await api<{ file: string }>('/api/live/recording/start', {
        method: 'POST',
        body: JSON.stringify({ streamKey: drone.streamKey }),
      })
      setToast(`بدأ تسجيل بث ${drone.label}`)
      loadLiveDrones().catch(() => {})
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'تعذر بدء التسجيل')
    }
  }

  async function stopRecording(drone: Drone) {
    try {
      const res = await api<{ file: string | null }>('/api/live/recording/stop', {
        method: 'POST',
        body: JSON.stringify({ streamKey: drone.streamKey }),
      })
      setToast(res.file ? `تم حفظ تسجيل ${drone.label}` : `تم إيقاف تسجيل ${drone.label}`)
      if (res.file) window.open(res.file, '_blank')
      loadLiveDrones().catch(() => {})
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'تعذر إيقاف التسجيل')
    }
  }

  async function snapshot(drone: Drone) {
    try {
      const res = await api<{ file: string }>('/api/live/snapshot', {
        method: 'POST',
        body: JSON.stringify({ streamKey: drone.streamKey }),
      })
      setToast(`تم حفظ لقطة من ${drone.label}`)
      window.open(res.file, '_blank')
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'تعذر أخذ اللقطة')
    }
  }

  const grid = (
    <section className="grid-stage-wrap">
      <header className="grid-stage-header">
        <div>
          <b>Live Monitor Grid</b>
          <small>{activeCells} active cells from {cellCount}. Click any empty cell, then select a drone.</small>
        </div>
        <div className="grid-pager">
          <button onClick={() => loadLiveDrones()} title="Refresh live drones"><RefreshCw size={15} /></button>
          <button onClick={() => setFullscreenMode(true)} title="Full screen"><Expand size={15} /></button>
          <button onClick={() => setShowLiveDrones((v) => !v)} title="Show live drones">
            {showLiveDrones ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
          </button>
        </div>
      </header>

      <section
        className="grid-stage"
        style={{
          gridTemplateColumns: `repeat(${fullscreenMode ? fullscreenColumns : columns}, minmax(0, 1fr))`,
          gridTemplateRows: fullscreenMode ? `repeat(${fullscreenRows}, minmax(0, 1fr))` : undefined,
        }}
        aria-label="Live drone grid"
      >
        {cells.map((drone, index) => (
          <article
            key={index}
            className={`studio-cell ${selectedCell === index ? 'selected' : ''} ${drone ? 'has-stream' : ''}`}
            onClick={() => setSelectedCell(index)}
          >
            {drone ? (
              <>
                <iframe src={drone.webrtcUrl} allow="autoplay; fullscreen; camera; microphone" />

                <header className="studio-cell-head">
                  <span><Video size={13} />{drone.label}</span>
                  <button onClick={(event) => { event.stopPropagation(); clearCell(index) }}>×</button>
                </header>

                <div className="studio-cell-overlay">
                  <span className="live-pill"><span /> LIVE</span>
                  {drone.isRecording && <span className="recording-pill">REC</span>}
                </div>

                <footer className="studio-cell-actions" onClick={(event) => event.stopPropagation()}>
                  <button onClick={() => setExpanded(drone)}><Maximize2 size={13} /> View</button>
                  <button onClick={() => snapshot(drone)}><Camera size={13} /> Snapshot</button>
                  {drone.isRecording ? (
                    <button className="danger" onClick={() => stopRecording(drone)}>Stop REC</button>
                  ) : (
                    <button className="success" onClick={() => startRecording(drone)}>Record</button>
                  )}
                </footer>
              </>
            ) : (
              <div className="studio-empty-cell">
                <div>
                  <MonitorPlay size={28} />
                  <b>Cell {index + 1}</b>
                  <small>{selectedCell === index ? 'Selected. Choose a live drone.' : 'Click to select this cell.'}</small>
                </div>
              </div>
            )}
          </article>
        ))}
      </section>
    </section>
  )

  const dronesPanel = showLiveDrones && (
    <aside className="live-drones-panel">
      <div className="panel-title-row">
        <div>
          <h3>Live Drones</h3>
          <p>Only online drones from MediaMTX are shown here.</p>
        </div>
        <span className="badge ok">{liveDrones.length}</span>
      </div>

      <div className="live-drone-stack">
        {loading && <div className="empty-drone-state"><b>Loading live drones...</b></div>}
        {!loading && liveDrones.length === 0 && (
          <div className="empty-drone-state">
            <Radio size={24} />
            <b>No live drones</b>
            <small>Start streaming to MediaMTX and this list will update automatically.</small>
          </div>
        )}
        {!loading && liveDrones.map((drone) => (
          <button
            key={drone.id}
            className="live-drone-item"
            onClick={() => assignDrone(drone)}
            disabled={assignedIds.has(drone.id)}
          >
            <span className="signal-ring"><span /></span>
            <span className="drone-meta">
              <b>{drone.label}</b>
              <small>{drone.city?.name || 'No city'} · {drone.streamKey}</small>
            </span>
            <span className="add-hint">{assignedIds.has(drone.id) ? 'Added' : 'Add'}</span>
          </button>
        ))}
      </div>
    </aside>
  )

  const modalContent = expanded && (
    <div className="modal-backdrop live-grid-preview-backdrop" onClick={() => setExpanded(null)}>
      <div className="card stream-modal studio-modal live-grid-preview-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <div>
            <span className="badge ok"><Video size={13} /> Live Preview</span>
            <h2>{expanded.label}</h2>
            <p>{expanded.city?.name || 'No city'} · {expanded.streamKey}</p>
          </div>
          <button className="btn danger" onClick={() => setExpanded(null)}><X size={15} /> Close</button>
        </div>
        <iframe className="stream-modal-frame" src={expanded.webrtcUrl} allow="autoplay; fullscreen; camera; microphone" />
        <div className="modal-actions">
          <button className="btn secondary" onClick={() => snapshot(expanded)}><Camera size={15} /> Snapshot</button>
          {expanded.isRecording ? (
            <button className="btn danger" onClick={() => stopRecording(expanded)}>Stop Recording</button>
          ) : (
            <button className="btn" onClick={() => startRecording(expanded)}>Record Stream</button>
          )}
        </div>
      </div>
    </div>
  )

  if (expanded) {
    return (
      <main className="single-stream-viewer" dir="ltr">
        {toast && <div className="grid-toast single-stream-toast" onAnimationEnd={() => setToast('')}>{toast}</div>}
        <header className="single-stream-topbar">
          <div>
            <span className="badge ok"><Video size={13} /> LIVE STREAM</span>
            <h1>{expanded.label}</h1>
            <p>{expanded.city?.name || 'No city'} · {expanded.streamKey}</p>
          </div>
          <div className="single-stream-actions">
            <button className="btn secondary" onClick={() => snapshot(expanded)}><Camera size={15} /> Snapshot</button>
            {expanded.isRecording ? (
              <button className="btn danger" onClick={() => stopRecording(expanded)}>Stop Recording</button>
            ) : (
              <button className="btn" onClick={() => startRecording(expanded)}>Record Stream</button>
            )}
            <button className="btn danger" onClick={() => setExpanded(null)}><X size={15} /> Close</button>
          </div>
        </header>
        <section className="single-stream-stage">
          <iframe
            src={expanded.webrtcUrl}
            allow="autoplay; fullscreen; camera; microphone"
            allowFullScreen
            title={expanded.label}
          />
        </section>
      </main>
    )
  }

  if (fullscreenMode) {
    return (
      <main className={`grid-fullscreen-normal ${showLiveDrones ? 'with-drones' : 'grid-only-mode'}`} dir="ltr">
        {toast && <div className="grid-toast fullscreen-toast" onAnimationEnd={() => setToast('')}>{toast}</div>}
        <div className="fullscreen-mini-bar">
          <span><Grid2X2 size={15} /> {activeCells}/{cellCount}</span>
          <label className="fullscreen-layout-control">Rows <input type="number" min={1} max={12} value={fullscreenRows} onChange={(event) => updateFullscreenLayout(Number(event.target.value), fullscreenColumns)} /></label>
          <label className="fullscreen-layout-control">Columns <input type="number" min={1} max={12} value={fullscreenColumns} onChange={(event) => updateFullscreenLayout(fullscreenRows, Number(event.target.value))} /></label>
          <button onClick={() => setShowLiveDrones((v) => !v)}>
            <ListVideo size={15} /> {showLiveDrones ? 'Hide live drones' : 'Show live drones'}
          </button>
          <button onClick={() => setFullscreenMode(false)}><X size={15} /> Exit full screen</button>
        </div>
        <div className="grid-workspace grid-fullscreen-workspace">
          {dronesPanel}
          {grid}
        </div>
        {mounted && modalContent ? createPortal(modalContent, document.body) : null}
      </main>
    )
  }

  return (
    <Shell>
      <div className="grid-studio page-animate">
        {toast && <div className="grid-toast" onAnimationEnd={() => setToast('')}>{toast}</div>}

        <section className="grid-studio-hero compact-hero">
          <div>
            <span className="badge ok"><Radio size={13} /> MediaMTX Live</span>
            <h1>Live Grid</h1>
            <p>Normal operator view with a clean toolbar. Switch to full screen when you need only monitoring, or show live drones when you want to assign streams manually.</p>
          </div>
          <div className="grid-live-summary">
            <div><b>{liveDrones.length}</b><span>Live drones</span></div>
            <div><b>{activeCells}</b><span>On grid</span></div>
            <div><b>{cellCount}</b><span>Cells</span></div>
          </div>
        </section>

        <section className="grid-commandbar compact-fields">
          <div className="command-group">
            <button className="btn" onClick={() => setFullscreenMode(true)}><Expand size={15} /> Full Screen</button>
            <button className="btn secondary" onClick={() => setShowLiveDrones((v) => !v)}>
              <ListVideo size={15} /> {showLiveDrones ? 'Hide Live Drones' : 'Show Live Drones'}
            </button>
            <button className="btn secondary" onClick={() => loadLiveDrones()}><RefreshCw size={15} /> Refresh</button>
          </div>

          <div className="command-group">
            <label><Grid2X2 size={14} /> Cells <input type="number" min={1} max={64} value={cellCount} onChange={(event) => updateCellCount(Number(event.target.value))} /></label>
            <label><Columns3 size={14} /> Columns <input type="number" min={1} max={12} value={columns} onChange={(event) => updateColumns(Number(event.target.value))} /></label>
            <label className="studio-switch"><input type="checkbox" checked={autoFill} onChange={(event) => setAutoFill(event.target.checked)} /><span /> Auto Fill</label>
          </div>
        </section>

        <section className={`grid-workspace ${showLiveDrones ? '' : 'grid-only-mode'}`}>
          {dronesPanel}
          {grid}
        </section>

        {mounted && modalContent ? createPortal(modalContent, document.body) : null}
      </div>
    </Shell>
  )
}
