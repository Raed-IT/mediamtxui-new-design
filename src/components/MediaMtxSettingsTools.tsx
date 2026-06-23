'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Clapperboard, Eye, Radio, Save, ShieldAlert, Trash2, Users, Video, Wifi } from 'lucide-react'
import { api } from './ApiClient'
import type { MediaMtxSession } from '@/lib/mediamtx'

type JsonEditorProps = {
  title: string
  subtitle?: string
  endpoint: string
  method?: 'PATCH' | 'POST'
  initial: unknown
}

export function JsonEditor({ title, subtitle, endpoint, method = 'PATCH', initial }: JsonEditorProps) {
  const router = useRouter()
  const [text, setText] = useState(() => JSON.stringify(initial, null, 2))
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function save() {
    setBusy(true)
    setMessage('')
    try {
      const body = JSON.parse(text)
      await api(endpoint, { method, body: JSON.stringify(body) })
      setMessage('تم الحفظ بنجاح')
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'فشل الحفظ')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card advanced-editor">
      <div className="card-header">
        <div>
          <span className="badge warn">وضع متقدم</span>
          <h2 style={{ margin: '8px 0 0' }}>{title}</h2>
          {subtitle && <p className="muted" style={{ marginTop: 6 }}>{subtitle}</p>}
        </div>
        <button className="btn" onClick={save} disabled={busy}><Save size={16} /> {busy ? 'جار الحفظ...' : 'حفظ التغييرات'}</button>
      </div>
      <textarea
        className="input code-area"
        value={text}
        onChange={(event) => setText(event.target.value)}
        spellCheck={false}
      />
      {message && <p className="muted" style={{ marginTop: 10 }}>{message}</p>}
    </div>
  )
}

type SettingsCard = [label: string, enabled: unknown, address: unknown, icon: ReactNode]

export function SettingsCards({ data }: { data: Record<string, unknown> }) {
  const cards = useMemo<SettingsCard[]>(() => [
    ['واجهة التحكم', data.api, data.apiAddress, <Radio size={24} key="api" />],
    ['بث RTSP', data.rtsp, data.rtspAddress, <Video size={24} key="rtsp" />],
    ['إرسال RTMP', data.rtmp, data.rtmpAddress, <Wifi size={24} key="rtmp" />],
    ['مشاهدة HLS', data.hls, data.hlsAddress, <Eye size={24} key="hls" />],
    ['مشاهدة WebRTC', data.webrtc, data.webrtcAddress, <Camera size={24} key="webrtc" />],
    ['بث SRT', data.srt, data.srtAddress, <Radio size={24} key="srt" />],
  ], [data])

  return (
    <div className="grid grid-4">
      {cards.map(([label, enabled, address, icon]) => (
        <div className="card human-setting-card" key={String(label)}>
          <div className="card-header">
            <div className="stat-icon">{icon}</div>
            <span className={enabled ? 'badge ok' : 'badge danger'}>{enabled ? 'مفعل' : 'متوقف'}</span>
          </div>
          <h3 style={{ margin: '8px 0 6px' }}>{String(label)}</h3>
          <p className="muted">{String(address || 'لا يوجد عنوان محدد')}</p>
        </div>
      ))}
    </div>
  )
}

export function EasyServerSettings({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="card settings-panel">
      <div className="card-header">
        <div>
          <h2>إعدادات سهلة للسيرفر</h2>
          <p className="muted">هذه الواجهة تخفي التفاصيل المعقدة وتعرض أهم الأشياء التي يحتاجها المسؤول اليومي.</p>
        </div>
        <span className="badge ok">آمن للمستخدم غير التقني</span>
      </div>
      <div className="settings-switches">
        <div className="switch-row"><span>واجهة التحكم API</span><span className={data.api ? 'badge ok' : 'badge danger'}>{data.api ? 'مفعلة' : 'متوقفة'}</span></div>
        <div className="switch-row"><span>البث المباشر WebRTC</span><span className={data.webrtc ? 'badge ok' : 'badge danger'}>{data.webrtc ? 'مفعل' : 'متوقف'}</span></div>
        <div className="switch-row"><span>التسجيل على السيرفر</span><span className={data.record ? 'badge ok' : 'badge'}>{data.record ? 'مفعل' : 'حسب المسار'}</span></div>
        <div className="switch-row"><span>الحماية الداخلية</span><span className="badge ok">تعمل</span></div>
      </div>
      <div className="code-box">
        <b>ملاحظة للمسؤول:</b>
        <span>أي تعديل متقدم مثل كلمات المرور أو المنافذ موجود في صفحة الإعدادات المتقدمة.</span>
      </div>
    </div>
  )
}

export function PathConfigTable({ configs }: { configs: Array<Record<string, unknown>> }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const perPage = 10
  const filtered = configs.filter((item) => String(item.name || '').toLowerCase().includes(search.toLowerCase()))
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const rows = filtered.slice((page - 1) * perPage, page * perPage)

  async function remove(name: string) {
    if (!confirm(`سيتم حذف إعدادات البث ${name}. هل أنت متأكد؟`)) return
    await api(`/api/mediamtx/paths/${encodeURIComponent(name)}`, { method: 'DELETE' })
    router.refresh()
  }

  async function toggleRecord(name: string, record: unknown) {
    await api(`/api/mediamtx/paths/${encodeURIComponent(name)}`, {
      method: 'PATCH',
      body: JSON.stringify({ record: !Boolean(record) }),
    })
    router.refresh()
  }

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2 style={{ margin: 0 }}>البثوث المعرفة في السيرفر</h2>
          <p className="muted" style={{ marginTop: 6 }}>هنا تتحكم بأسماء البثوث والتسجيل بدون إظهار إعدادات تقنية كثيرة.</p>
        </div>
        <input className="input" placeholder="بحث باسم البث..." style={{ maxWidth: 260 }} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
      </div>
      <div className="table-wrap">
        <table className="table human-table">
          <thead><tr><th>اسم البث</th><th>المصدر</th><th>التسجيل</th><th>حد المشاهدين</th><th>إجراءات</th></tr></thead>
          <tbody>
            {rows.map((item) => {
              const name = String(item.name || '')
              return <tr key={name}>
                <td style={{ fontWeight: 900 }}><Video size={15} /> {name}</td>
                <td>{String(item.source || 'من الدرون / الناشر')}</td>
                <td><span className={item.record ? 'badge ok' : 'badge'}>{item.record ? 'يتم التسجيل' : 'بدون تسجيل'}</span></td>
                <td>{String(item.maxReaders ?? 'غير محدود')}</td>
                <td><div className="actions">
                  <button className="btn secondary" onClick={() => toggleRecord(name, item.record)}><Clapperboard size={15} /> {item.record ? 'إيقاف التسجيل' : 'تفعيل التسجيل'}</button>
                  <button className="btn danger" onClick={() => remove(name)}><Trash2 size={15} /> حذف</button>
                </div></td>
              </tr>
            })}
            {!rows.length && <tr><td colSpan={5} className="muted">لا توجد نتائج مطابقة.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="pagination">
        <span className="muted">الصفحة {page} / {totalPages} — عدد النتائج {filtered.length}</span>
        <div className="actions"><button className="btn secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>السابق</button><button className="btn secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>التالي</button></div>
      </div>
    </div>
  )
}

type SessionRow = MediaMtxSession & { protocol: string }

export function SessionsTable({ sessions }: { sessions: Record<string, MediaMtxSession[]> }) {
  const router = useRouter()
  const rows: SessionRow[] = Object.entries(sessions).flatMap(([protocol, items]) =>
    items.map((item) => ({ protocol, ...item })),
  )
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const perPage = 10
  const filtered = rows.filter((row) => JSON.stringify(row).toLowerCase().includes(search.toLowerCase()))
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const visible = filtered.slice((page - 1) * perPage, page * perPage)

  async function kick(protocol: string, id: string) {
    if (!confirm(`سيتم فصل هذا المشاهد/الاتصال. هل أنت متأكد؟`)) return
    await api('/api/mediamtx/kick', { method: 'POST', body: JSON.stringify({ protocol, id }) })
    router.refresh()
  }

  return <div className="card">
    <div className="card-header"><div><h2 style={{ margin: 0 }}>المشاهدون والاتصالات الحالية</h2><p className="muted" style={{ marginTop: 6 }}>صفحة واحدة تعرض من يشاهد أو يرسل بثاً الآن. استخدم فصل الاتصال فقط عند الحاجة.</p></div><input className="input" placeholder="بحث عن مشاهد أو بث..." style={{ maxWidth: 280 }} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} /></div>
    <div className="table-wrap"><table className="table human-table"><thead><tr><th>النوع</th><th>رقم الاتصال</th><th>عنوان الجهاز</th><th>الحالة</th><th>البث</th><th>البيانات الداخلة</th><th>البيانات الخارجة</th><th>الإجراء</th></tr></thead><tbody>{visible.length ? visible.map((row, index) => <tr key={`${row.protocol}-${String(row.id)}-${index}`}><td><span className="badge">{String(row.protocol).toUpperCase()}</span></td><td>{String(row.id || '—')}</td><td>{String(row.remoteAddr || '—')}</td><td>{String(row.state || '—')}</td><td>{String(row.path || '—')}</td><td>{String(row.bytesReceived || 0)}</td><td>{String(row.bytesSent || 0)}</td><td>{row.id && ['rtmp','webrtc','rtsp','srt'].includes(String(row.protocol)) ? <button className="btn danger" onClick={() => kick(String(row.protocol), String(row.id))}><ShieldAlert size={15} /> فصل</button> : <span className="muted">قراءة فقط</span>}</td></tr>) : <tr><td colSpan={8} className="muted">لا يوجد مشاهدون أو اتصالات حالياً.</td></tr>}</tbody></table></div>
    <div className="pagination"><span className="muted">الصفحة {page} / {totalPages} — {filtered.length} اتصال</span><div className="actions"><button className="btn secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>السابق</button><button className="btn secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>التالي</button></div></div>
  </div>
}

export function RecordingsTable({ recordings }: { recordings: Array<{ name: string; segments?: Array<{ start?: string }> }> }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  async function remove(path: string, start: string) {
    if (!confirm(`سيتم حذف التسجيل ${path} / ${start}. هل أنت متأكد؟`)) return
    await api('/api/mediamtx/recordings/segment', { method: 'DELETE', body: JSON.stringify({ path, start }) })
    router.refresh()
  }
  const rows = recordings.flatMap((rec) => (rec.segments || []).map((seg) => ({ path: rec.name, start: seg.start || '' })))
  const filtered = rows.filter((row) => `${row.path} ${row.start}`.toLowerCase().includes(search.toLowerCase()))
  return <div className="card"><div className="card-header"><div><h2 style={{ margin: 0 }}>التسجيلات المحفوظة</h2><p className="muted" style={{ marginTop: 6 }}>عرض وحذف مقاطع التسجيل الموجودة على السيرفر.</p></div><input className="input" placeholder="بحث في التسجيلات..." style={{ maxWidth: 280 }} value={search} onChange={(e) => setSearch(e.target.value)} /></div><div className="recording-cards">{filtered.length ? filtered.map((row) => <div className="recording-card" key={`${row.path}-${row.start}`}><div><span className="badge"><Clapperboard size={14} /> تسجيل</span><h3>{row.path}</h3><p className="muted">وقت البداية: {row.start || 'غير معروف'}</p></div><div className="actions"><button className="btn secondary"><Eye size={15} /> عرض</button><button className="btn danger" onClick={() => remove(row.path, row.start)}><Trash2 size={15} /> حذف</button></div></div>) : <p className="muted">لا توجد تسجيلات حالياً.</p>}</div></div>
}
