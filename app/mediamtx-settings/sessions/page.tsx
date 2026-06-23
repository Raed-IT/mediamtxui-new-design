import Link from 'next/link'
import Shell from '@/components/Shell'
import { SessionsTable } from '@/components/MediaMtxSettingsTools'
import { listMediaMtxSessions } from '@/lib/mediamtx'
import { Eye } from 'lucide-react'

export default async function MediaMtxSessionsSettings() {
  const sessions = await listMediaMtxSessions()
  return <Shell><div className="page-animate"><div className="topbar"><div><span className="badge ok"><Eye size={14} /> المشاهدون</span><h1>المشاهدون والاتصالات</h1><p className="page-subtitle">اعرف من يشاهد أو يرسل بثاً الآن. زر فصل الاتصال يستخدم فقط عند وجود مشكلة أو جلسة معلقة.</p></div><Link className="btn secondary" href="/mediamtx-settings">رجوع</Link></div><SessionsTable sessions={sessions as unknown as Record<string, Array<Record<string, unknown>>>} /></div></Shell>
}
