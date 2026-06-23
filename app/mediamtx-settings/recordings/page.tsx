import Link from 'next/link'
import Shell from '@/components/Shell'
import { RecordingsTable } from '@/components/MediaMtxSettingsTools'
import { listMediaMtxRecordings } from '@/lib/mediamtx'
import { Clapperboard } from 'lucide-react'

export default async function MediaMtxRecordingsSettings() {
  const recordings = await listMediaMtxRecordings().catch(() => ({ items: [] }))
  return <Shell><div className="page-animate"><div className="topbar"><div><span className="badge ok"><Clapperboard size={14} /> التسجيلات</span><h1>التسجيلات المحفوظة</h1><p className="page-subtitle">عرض مقاطع التسجيل وحذف المقاطع القديمة أو غير المطلوبة.</p></div><Link className="btn secondary" href="/mediamtx-settings">رجوع</Link></div><RecordingsTable recordings={(recordings.items || []) as Array<{ name: string; segments?: Array<{ start?: string }> }>} /></div></Shell>
}
