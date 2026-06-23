import Link from 'next/link'
import Shell from '@/components/Shell'
import { JsonEditor } from '@/components/MediaMtxSettingsTools'
import { getMediaMtxPathDefaults } from '@/lib/mediamtx'

export default async function MediaMtxDefaultsSettings() {
  const defaults = await getMediaMtxPathDefaults()
  return <Shell><div className="page-animate"><div className="topbar"><div><span className="badge danger">متقدم</span><h1>إعدادات البث الافتراضية</h1><p className="page-subtitle">هذه الصفحة مخصصة للمستخدم التقني. تؤثر على السلوك الافتراضي لكل بث جديد.</p></div><Link className="btn secondary" href="/mediamtx-settings">رجوع</Link></div><JsonEditor title="إعدادات افتراضية JSON" subtitle="استخدم هذه الصفحة فقط عند الحاجة لتعديل إعدادات MediaMTX المتقدمة." endpoint="/api/mediamtx/path-defaults" initial={defaults} /></div></Shell>
}
