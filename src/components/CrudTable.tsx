'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'

export type Column<T> = {
  key: keyof T | string
  header: string
  render?: (row: T) => ReactNode
  className?: string
}

export type LegacyColumn<T> = [keyof T | string, string, (row: T) => ReactNode]

type AnyColumn<T> = Column<T> | LegacyColumn<T>

function normalizeColumn<T>(column: AnyColumn<T>): Column<T> {
  if (Array.isArray(column)) {
    return {
      key: column[0],
      header: column[1],
      render: column[2],
    }
  }

  return column
}

function readValue<T>(row: T, key: keyof T | string): ReactNode {
  const value = (row as Record<string, unknown>)[String(key)]

  if (value === null || value === undefined) return '—'
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  return JSON.stringify(value)
}

export function CrudTable<T extends { id: number }>({
  rows,
  columns,
  onEdit,
  onDelete,
  searchPlaceholder = 'Search table...',
}: {
  rows: T[]
  columns: Array<AnyColumn<T>>
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  searchPlaceholder?: string
}) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const normalizedColumns = useMemo(() => columns.map(normalizeColumn), [columns])

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
          <Search
            size={17}
            style={{ position: 'absolute', left: 12, top: 13, color: 'var(--muted)' }}
          />
          <input
            className="input"
            style={{ paddingLeft: 38 }}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(1)
            }}
            placeholder={searchPlaceholder}
          />
        </div>
        <select
          className="select"
          style={{ width: 130 }}
          value={pageSize}
          onChange={(event) => {
            setPageSize(Number(event.target.value))
            setPage(1)
          }}
        >
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
              {normalizedColumns.map((column) => (
                <th key={String(column.key)} className={column.className}>
                  {column.header}
                </th>
              ))}
              {(onEdit || onDelete) && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.id}>
                {normalizedColumns.map((column) => (
                  <td key={String(column.key)} className={column.className}>
                    {column.render ? column.render(row) : readValue(row, column.key)}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td>
                    <div className="actions">
                      {onEdit && (
                        <button className="btn secondary" onClick={() => onEdit(row)} type="button">
                          Edit
                        </button>
                      )}
                      {onDelete && (
                        <button className="btn danger" onClick={() => onDelete(row)} type="button">
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {!visible.length && (
              <tr>
                <td colSpan={normalizedColumns.length + (onEdit || onDelete ? 1 : 0)} className="muted">
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <span className="muted">
          Showing {visible.length} of {filtered.length} records
        </span>
        <div className="actions">
          <button
            className="btn secondary"
            disabled={currentPage <= 1}
            onClick={() => setPage((previous) => Math.max(1, previous - 1))}
            type="button"
          >
            <ChevronLeft size={16} /> Prev
          </button>
          <span className="badge">Page {currentPage} / {totalPages}</span>
          <button
            className="btn secondary"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((previous) => Math.min(totalPages, previous + 1))}
            type="button"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
