'use client'

import { X, Radio, Users, Activity, HardDriveDownload, HardDriveUpload } from 'lucide-react'
import type { MediaMtxPath } from '@/lib/mediamtx'

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

function webrtcUrl(pathName: string) {
  const base = (process.env.NEXT_PUBLIC_WEBRTC_BASE_URL || 'http://localhost:8889').replace(/\/$/, '')
  return `${base}/${encodeURIComponent(pathName)}`
}

export default function DashboardPathPreview({ path, onClose }: { path: MediaMtxPath; onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-card path-preview-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="sy-badge"><Radio size={14} /> بث مباشر</span>
            <h2>{path.name}</h2>
            <p className="muted">معاينة المسار المحدد فقط من لوحة التحكم.</p>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        <div className="preview-video-frame">
          {path.ready ? (
            <iframe src={webrtcUrl(path.name)} title={path.name} allow="autoplay; fullscreen; picture-in-picture" />
          ) : (
            <div className="empty-state">هذا المسار غير متصل حالياً</div>
          )}
        </div>

        <div className="preview-metrics">
          <div><Activity size={17} /><span>الحالة</span><b>{path.ready ? 'متصل' : 'غير متصل'}</b></div>
          <div><Radio size={17} /><span>نوع المصدر</span><b>{path.source?.type || '—'}</b></div>
          <div><Users size={17} /><span>القراء</span><b>{path.readers?.length || 0}</b></div>
          <div><HardDriveDownload size={17} /><span>الوارد</span><b>{bytes(path.bytesReceived)}</b></div>
          <div><HardDriveUpload size={17} /><span>الصادر</span><b>{bytes(path.bytesSent)}</b></div>
        </div>
      </div>
    </div>
  )
}
