import Link from 'next/link'
import Shell from '@/components/Shell'
import { HumanSettingsHub } from '@/components/HumanSettingsHub'
import { getMediaMtxGlobalConfig } from '@/lib/mediamtx'
import { Settings, ServerCog } from 'lucide-react'

export default async function SettingsPage() {
  const global = await getMediaMtxGlobalConfig()
  return (
    <Shell>
      <div className="page-animate">
        <div className="topbar">
          <div>
            <span className="badge gold"><Settings size={14} /> Settings Center</span>
            <h1>إعدادات النظام</h1>
            <p className="page-subtitle">
              صفحة مبسطة لإدارة إعدادات السيرفر، الشبكة، البث، التسجيل والحماية بدون إظهار تفاصيل تقنية معقدة للمستخدم اليومي.
            </p>
          </div>
          <Link className="btn secondary" href="/mediamtx-settings"><ServerCog size={16} /> إدارة MediaMTX</Link>
        </div>
        <HumanSettingsHub initial={global} />
      </div>
    </Shell>
  )
}
