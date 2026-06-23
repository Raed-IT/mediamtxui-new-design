import Link from 'next/link'
import Shell from '@/components/Shell'
import { getMediaMtxInfo, listMediaMtxPaths, type MediaMtxInfo } from '@/lib/mediamtx'
import { Activity, Eye, Video } from 'lucide-react'

export default async function MediaMtxSystemSettings() {
  const [info, paths] = await Promise.all([
    getMediaMtxInfo().catch((): MediaMtxInfo => ({})),
    listMediaMtxPaths().catch(() => []),
  ])

  return (
    <Shell>
      <div className="page-animate">
        <div className="topbar">
          <div>
            <span className="badge ok"><Activity size={14} /> حالة النظام</span>
            <h1>حالة السيرفر</h1>
            <p className="page-subtitle">
              صفحة قراءة فقط، تساعد المسؤول على فهم هل البث يعمل أم لا بدون الدخول في تفاصيل تقنية.
            </p>
          </div>
          <Link className="btn secondary" href="/mediamtx-settings">رجوع</Link>
        </div>

        <div className="grid grid-4">
          <div className="card stat-mini">
            <Activity size={26} />
            <span>الإصدار</span>
            <b style={{ fontSize: 28 }}>{String(info.version || 'غير معروف')}</b>
          </div>
          <div className="card">
            <h3>وقت التشغيل</h3>
            <p className="muted">{String(info.started || '—')}</p>
          </div>
          <div className="card stat-mini">
            <Video size={26} />
            <span>بث مباشر</span>
            <b>{paths.filter((p) => p.ready).length}</b>
          </div>
          <div className="card stat-mini">
            <Eye size={26} />
            <span>كل البثوث</span>
            <b>{paths.length}</b>
          </div>
        </div>

        <div className="card" style={{ marginTop: 18 }}>
          <div className="card-header">
            <div>
              <h2 style={{ margin: 0 }}>البثوث الحالية</h2>
              <p className="muted" style={{ marginTop: 6 }}>أخضر يعني أن البث يعمل ويمكن مشاهدته.</p>
            </div>
          </div>
          <div className="table-wrap">
            <table className="table human-table">
              <thead>
                <tr>
                  <th>اسم البث</th>
                  <th>الحالة</th>
                  <th>المصدر</th>
                  <th>المشاهدون</th>
                  <th>معلومات الفيديو</th>
                </tr>
              </thead>
              <tbody>
                {paths.map((p) => (
                  <tr key={p.name}>
                    <td style={{ fontWeight: 900 }}>{p.name}</td>
                    <td><span className={p.ready ? 'badge ok' : 'badge danger'}>{p.ready ? 'مباشر' : 'غير متصل'}</span></td>
                    <td>{p.source?.type || '—'}</td>
                    <td>{p.readers?.length || 0}</td>
                    <td>{p.tracks?.join(', ') || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Shell>
  )
}
