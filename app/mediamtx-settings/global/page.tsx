import Link from 'next/link'
import Shell from '@/components/Shell'
import { HumanSettingsHub } from '@/components/HumanSettingsHub'
import { getMediaMtxGlobalConfig } from '@/lib/mediamtx'
import { SlidersHorizontal } from 'lucide-react'

export default async function MediaMtxGlobalSettings() {
  const global = await getMediaMtxGlobalConfig()
  return (
    <Shell>
      <div className="page-animate">
        <div className="topbar">
          <div>
            <span className="badge gold"><SlidersHorizontal size={14} /> إعدادات سهلة</span>
            <h1>إعدادات MediaMTX</h1>
            <p className="page-subtitle">تم إعادة تصميم الصفحة من الصفر: شبكة، بث، تسجيل، حماية، وإعدادات عامة بدون تعقيد.</p>
          </div>
          <Link className="btn secondary" href="/settings">فتح مركز الإعدادات</Link>
        </div>
        <HumanSettingsHub initial={global} />
      </div>
    </Shell>
  )
}
