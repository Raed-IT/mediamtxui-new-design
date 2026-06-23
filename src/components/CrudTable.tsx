'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'

export function CrudTable<T extends { id: number }>({
  rows,
  columns,
  onEdit,
  onDelete,
  searchPlaceholder = 'Search table...',
}: {
  rows: T[]
  columns: Array<[keyof T | string, string, (row: T) => ReactNode]>
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  searchPlaceholder?: string
}) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(q))
  }, [rows, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div>
      <div className="actions" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ position: 'relative', width: 'min(100%, 380px)' }}>
          <Search size={17} style={{ position: 'absolute', left: 12, top: 13, color: 'var(--muted)' }} />
          <input
            className="input"
            style={{ paddingLeft: 38 }}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1) }}
            placeholder={searchPlaceholder}
          />
        </div>
        <select className="select" style={{ width: 130 }} value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}>
          <option value={5}>5 / page</option>
          <option value={10}>10 / page</option>
          <option value={20}>20 / page</option>
          <option value={50}>50 / page</option>
        </select>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {columns.map(([, label]) => <th key={label}>{label}</th>)}
              {(onEdit || onDelete) && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.id}>
                {columns.map(([key, , render]) => <td key={String(key)}>{render(row)}</td>)}
                {(onEdit || onDelete) && (
                  <td>
                    <div className="actions">
                      {onEdit && <button className="btn secondary" onClick={() => onEdit(row)}>Edit</button>}
                      {onDelete && <button className="btn danger" onClick={() => onDelete(row)}>Delete</button>}
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {!visible.length && <tr><td colSpan={columns.length + 1} className="muted">No records found.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <span className="muted">Showing {visible.length} of {filtered.length} records</span>
        <div className="actions">
          <button className="btn secondary" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}><ChevronLeft size={16} /> Prev</button>
          <span className="badge">Page {currentPage} / {totalPages}</span>
          <button className="btn secondary" disabled={currentPage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next <ChevronRight size={16} /></button>
        </div>
      </div>
    </div>
  )
}
