import Link from 'next/link'
import Shell from '@/components/Shell'
import { PathConfigTable } from '@/components/MediaMtxSettingsTools'
import { listMediaMtxPathConfigs } from '@/lib/mediamtx'
import { Video } from 'lucide-react'

export default async function MediaMtxPathsSettings() {
  const configs = await listMediaMtxPathConfigs()
  return <Shell><div className="page-animate"><div className="topbar"><div><span className="badge ok"><Video size={14} /> البثوث</span><h1>البثوث المباشرة</h1><p className="page-subtitle">تحكم بأسماء البثوث والتسجيل بطريقة سهلة. لا يحتاج المستخدم لمعرفة RTSP أو RTMP ليعمل على هذه الصفحة.</p></div><Link className="btn secondary" href="/mediamtx-settings">رجوع</Link></div><PathConfigTable configs={(configs.items || []) as Array<Record<string, unknown>>} /></div></Shell>
}
