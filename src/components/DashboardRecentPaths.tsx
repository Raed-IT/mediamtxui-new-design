'use client'

import { useRouter } from 'next/navigation'
import { Camera, Eye, Skull, Video } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { MediaMtxPath } from '@/lib/mediamtx'
import { api } from './ApiClient'

type Props = {
  paths: MediaMtxPath[]
  canControl: boolean
}

function bytes(value?: number) {
  if (!value) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let n = value
  let i = 0
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024
    i++
  }
  return `${n.toFixed(i ? 1 : 0)} ${units[i]}`
}

function streamUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_WEBRTC_BASE_URL || 'http://localhost:8889'
  return `${base.replace(/\/$/, '')}/${encodeURIComponent(path)}`
}

export default function DashboardRecentPaths({ paths, canControl }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<MediaMtxPath | null>(null)
  const [mounted, setMounted] = useState(false)
  const recent = paths.slice(0, 10)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    document.body.classList.toggle('stream-modal-open', Boolean(selected))
    return () => document.body.classList.remove('stream-modal-open')
  }, [selected])

  async function kill(path: string) {
    if (!confirm(`سيتم إيقاف البث أو فصل جميع المشاهدين عن: ${path}. هل أنت متأكد؟`)) return
    await api('/api/mediamtx/kick-path', {
      method: 'POST',
      body: JSON.stringify({ path }),
    })
    router.refresh()
  }

  return (
    <>
      <div className="card" style={{ marginTop: 18 }}>
        <div className="card-header">
          <div>
            <h2 style={{ margin: 0 }}>آخر البثوث المباشرة</h2>
            <div className="muted" style={{ marginTop: 6 }}>يعرض فقط الدرونات المرتبطة بصلاحية المستخدم والمدينة الخاصة به.</div>
          </div>
          <button className="btn secondary" onClick={() => router.push('/live-grid')}>فتح شاشة المراقبة</button>
        </div>

        <div className="table-wrap">
          <table className="table human-table">
            <thead>
              <tr>
                <th>اسم البث</th>
                <th>الحالة</th>
                <th>نوع المصدر</th>
                <th>المشاهدون</th>
                <th>البيانات المستقبلة</th>
                <th>البيانات المرسلة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {recent.length ? recent.map((path, index) => (
                <tr key={path.name} className="animated-row" style={{ animationDelay: `${index * 45}ms` }}>
                  <td style={{ fontWeight: 900 }}><Video size={15} /> {path.name}</td>
                  <td><span className={path.ready ? 'badge ok' : 'badge danger'}>{path.ready ? 'مباشر' : 'غير متصل'}</span></td>
                  <td>{path.source?.type || '—'}</td>
                  <td>{path.readers?.length || 0}</td>
                  <td>{bytes(path.bytesReceived)}</td>
                  <td>{bytes(path.bytesSent)}</td>
                  <td>
                    <div className="actions">
                      <button className="btn secondary" onClick={() => setSelected(path)}><Eye size={15} /> عرض</button>
                      {canControl && <button className="btn danger" onClick={() => kill(path.name)}><Skull size={15} /> إيقاف</button>}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={7} className="muted empty-filter-row">لا يوجد بث مباشر مرتبط بحسابك حالياً.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {mounted && selected && createPortal(
        <div className="stream-fullscreen-backdrop" onClick={() => setSelected(null)}>
          <div className="stream-fullscreen-modal" onClick={(e) => e.stopPropagation()}>
            <div className="stream-fullscreen-header">
              <div>
                <h2>{selected.name}</h2>
                <p>عرض مباشر للبث المحدد فقط من لوحة التحكم.</p>
              </div>
              <div className="stream-fullscreen-actions">
                <span className={selected.ready ? 'badge ok' : 'badge danger'}>{selected.ready ? 'مباشر الآن' : 'غير متصل'}</span>
                <span className="badge"><Camera size={14} /> المشاهدون: {selected.readers?.length || 0}</span>
                <button className="stream-fullscreen-close" onClick={() => setSelected(null)}>×</button>
              </div>
            </div>
            <div className="stream-fullscreen-player">
              <iframe src={streamUrl(selected.name)} allow="autoplay; fullscreen; camera; microphone" />
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
