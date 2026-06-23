import Link from 'next/link'
import Shell from '@/components/Shell'
import {
  getMediaMtxGlobalConfig,
  getMediaMtxInfo,
  listMediaMtxPathConfigs,
  listMediaMtxPaths,
  listMediaMtxRecordings,
  listMediaMtxSessions,
} from '@/lib/mediamtx'
import {
  Activity,
  AlertTriangle,
  ArrowUpLeft,
  CheckCircle2,
  Clapperboard,
  Eye,
  FileSliders,
  Gauge,
  Globe2,
  HardDrive,
  LockKeyhole,
  Network,
  Radio,
  Route,
  ServerCog,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Video,
  Wifi,
  Zap,
} from 'lucide-react'

type CardLink = {
  title: string
  description: string
  href: string
  icon: React.ReactNode
  badge: string
  tone: 'green' | 'gold' | 'red' | 'dark'
}

function yesNo(value: unknown) {
  return value ? 'مفعل' : 'متوقف'
}

function valueText(value: unknown, fallback = 'غير محدد') {
  if (value === undefined || value === null || value === '') return fallback
  return String(value)
}

export default async function MediaMtxSettingsHome() {
  const [global, info, paths, sessions, configsResult, recordingsResult] = await Promise.all([
    getMediaMtxGlobalConfig().catch(() => ({} as Record<string, unknown>)),
    getMediaMtxInfo().catch(() => ({} as Record<string, unknown>)),
    listMediaMtxPaths().catch(() => []),
    listMediaMtxSessions().catch(() => ({ rtmp: [], webrtc: [], rtsp: [], rtspConn: [], hls: [], srt: [] })),
    listMediaMtxPathConfigs().catch(() => ({ items: [] })),
    listMediaMtxRecordings().catch(() => ({ items: [] })),
  ])

  const sessionCount = Object.values(sessions).reduce((total, list) => total + list.length, 0)
  const livePaths = paths.filter((path) => path.ready)
  const offlinePaths = paths.length - livePaths.length
  const pathConfigs = configsResult.items || []
  const recordings = recordingsResult.items || []

  const systemOk = Boolean(global.api) && Boolean(global.webrtc)
  const serverVersion = valueText(info.version, 'غير معروف')

  const quickLinks: CardLink[] = [
    {
      title: 'البثوث المباشرة',
      description: 'مشاهدة البثوث المتصلة الآن، تشغيلها، أو فصل بث محدد عند الحاجة.',
      href: '/mediamtx-settings/paths',
      icon: <Video size={22} />,
      badge: `${livePaths.length} مباشر`,
      tone: 'green',
    },
    {
      title: 'المشاهدون والاتصالات',
      description: 'معرفة عدد المشاهدين والمرسلين الحاليين مع زر فصل آمن.',
      href: '/mediamtx-settings/sessions',
      icon: <Eye size={22} />,
      badge: `${sessionCount} اتصال`,
      tone: 'gold',
    },
    {
      title: 'إعدادات الشبكة',
      description: 'المنافذ والعناوين و WebRTC / HLS / RTMP بطريقة مبسطة.',
      href: '/settings?section=network',
      icon: <Network size={22} />,
      badge: 'مبسطة',
      tone: 'dark',
    },
    {
      title: 'التسجيلات',
      description: 'عرض التسجيلات المحفوظة وإدارة المقاطع بدون تعقيد.',
      href: '/mediamtx-settings/recordings',
      icon: <Clapperboard size={22} />,
      badge: `${recordings.length} مسار`,
      tone: 'red',
    },
  ]

  const adminLinks: CardLink[] = [
    {
      title: 'إعدادات البث الافتراضية',
      description: 'تحديد قواعد التسجيل والقراءة لكل البثوث الجديدة.',
      href: '/mediamtx-settings/defaults',
      icon: <FileSliders size={22} />,
      badge: 'متقدم',
      tone: 'gold',
    },
    {
      title: 'إعدادات السيرفر العامة',
      description: 'التحكم بتكوين MediaMTX الكامل للمدير التقني.',
      href: '/mediamtx-settings/global',
      icon: <ServerCog size={22} />,
      badge: 'Super Admin',
      tone: 'dark',
    },
    {
      title: 'حالة النظام',
      description: 'فحص الخدمة، المسارات، المصادر، وعدد الاتصالات الفعالة.',
      href: '/mediamtx-settings/system',
      icon: <Gauge size={22} />,
      badge: 'تشخيص',
      tone: 'green',
    },
    {
      title: 'لوحة الإعدادات الرئيسية',
      description: 'إدارة عام، شبكة، بث، تسجيل، وحماية من صفحة واحدة.',
      href: '/settings',
      icon: <Settings2 size={22} />,
      badge: 'UX',
      tone: 'red',
    },
  ]

  const services = [
    { name: 'واجهة API', value: global.api, address: global.apiAddress, icon: <Radio size={18} /> },
    { name: 'WebRTC', value: global.webrtc, address: global.webrtcAddress, icon: <Video size={18} /> },
    { name: 'HLS', value: global.hls, address: global.hlsAddress, icon: <Globe2 size={18} /> },
    { name: 'RTMP', value: global.rtmp, address: global.rtmpAddress, icon: <Wifi size={18} /> },
    { name: 'RTSP', value: global.rtsp, address: global.rtspAddress, icon: <Route size={18} /> },
    { name: 'SRT', value: global.srt, address: global.srtAddress, icon: <Zap size={18} /> },
  ]

  return (
    <Shell>
      <div className="page-animate media-hub-page">
        <section className="media-hub-hero">
          <div className="media-hub-hero-copy">
            <span className={systemOk ? 'badge ok' : 'badge danger'}>
              {systemOk ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
              {systemOk ? 'السيرفر جاهز للبث' : 'تحتاج بعض الخدمات للمراجعة'}
            </span>
            <h1>إدارة MediaMTX</h1>
            <p>
              مركز تحكم مبسط لإدارة البثوث، المشاهدين، التسجيلات، وإعدادات السيرفر بدون إظهار
              تفاصيل تقنية غير ضرورية للمستخدم اليومي.
            </p>
            <div className="media-hub-hero-actions">
              <Link className="btn" href="/live-grid"><Video size={16} /> فتح شبكة المراقبة</Link>
              <Link className="btn secondary" href="/mediamtx-settings/paths"><Activity size={16} /> عرض البثوث</Link>
              <Link className="btn ghost" href="/settings"><SlidersHorizontal size={16} /> الإعدادات</Link>
            </div>
          </div>

          <div className="media-hub-health-card">
            <div className="media-hub-health-top">
              <div>
                <span className="muted">نسخة MediaMTX</span>
                <strong>{serverVersion}</strong>
              </div>
              <span className="media-hub-pulse" />
            </div>
            <div className="media-hub-health-grid">
              <div><b>{livePaths.length}</b><span>بث مباشر</span></div>
              <div><b>{sessionCount}</b><span>اتصال</span></div>
              <div><b>{pathConfigs.length}</b><span>إعداد بث</span></div>
              <div><b>{offlinePaths}</b><span>غير متصل</span></div>
            </div>
          </div>
        </section>

        <section className="media-hub-stat-strip">
          <div className="media-hub-stat"><Video size={18} /><span>المسارات المتصلة</span><b>{livePaths.length}</b></div>
          <div className="media-hub-stat"><Eye size={18} /><span>المشاهدون والاتصالات</span><b>{sessionCount}</b></div>
          <div className="media-hub-stat"><HardDrive size={18} /><span>التسجيلات</span><b>{recordings.length}</b></div>
          <div className="media-hub-stat"><ShieldCheck size={18} /><span>الحماية</span><b>{global.authMethod ? 'مفعلة' : 'داخلية'}</b></div>
        </section>

        <section className="media-hub-section">
          <div className="media-hub-section-head">
            <div>
              <h2>ماذا تريد أن تفعل؟</h2>
              <p className="muted">اختصارات واضحة بدلاً من أسماء البروتوكولات التقنية.</p>
            </div>
          </div>
          <div className="media-hub-action-grid">
            {quickLinks.map((item) => (
              <Link className={`media-hub-action-card tone-${item.tone}`} href={item.href} key={item.title}>
                <div className="media-hub-action-icon">{item.icon}</div>
                <div>
                  <span>{item.badge}</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
                <ArrowUpLeft size={18} className="media-hub-action-arrow" />
              </Link>
            ))}
          </div>
        </section>

        <section className="media-hub-layout-grid">
          <div className="card media-hub-services-card">
            <div className="card-header">
              <div>
                <h2 style={{ margin: 0 }}>الخدمات الأساسية</h2>
                <p className="muted" style={{ marginTop: 6 }}>نظرة سريعة على أهم خدمات السيرفر.</p>
              </div>
              <span className="badge ok">Live Check</span>
            </div>
            <div className="media-hub-service-list">
              {services.map((service) => (
                <div className="media-hub-service-row" key={service.name}>
                  <div className="media-hub-service-name">
                    <span>{service.icon}</span>
                    <div>
                      <b>{service.name}</b>
                      <small>{valueText(service.address, 'لا يوجد عنوان محدد')}</small>
                    </div>
                  </div>
                  <span className={service.value ? 'badge ok' : 'badge danger'}>{yesNo(service.value)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card media-hub-live-card">
            <div className="card-header">
              <div>
                <h2 style={{ margin: 0 }}>آخر البثوث المباشرة</h2>
                <p className="muted" style={{ marginTop: 6 }}>أسماء البثوث المتصلة حالياً من MediaMTX.</p>
              </div>
              <Link className="btn secondary" href="/dashboard">لوحة التحكم</Link>
            </div>
            <div className="media-hub-live-list">
              {livePaths.slice(0, 6).map((path, index) => (
                <div className="media-hub-live-row" style={{ animationDelay: `${index * 55}ms` }} key={path.name}>
                  <div>
                    <b>{path.name}</b>
                    <small>{path.source?.type || 'مصدر مباشر'} · {path.readers?.length || 0} مشاهد</small>
                  </div>
                  <Link className="btn ghost" href={`/dashboard?stream=${encodeURIComponent(path.name)}`}>عرض</Link>
                </div>
              ))}
              {!livePaths.length && (
                <div className="media-hub-empty-state">
                  <Radio size={34} />
                  <b>لا يوجد بث مباشر الآن</b>
                  <span>عند وصول بث جديد سيظهر هنا تلقائياً.</span>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="media-hub-section">
          <div className="media-hub-section-head">
            <div>
              <h2>أدوات المدير التقني</h2>
              <p className="muted">هذه الأقسام للمدير أو Super Admin عند الحاجة لتعديل الإعدادات المتقدمة.</p>
            </div>
            <span className="badge"><LockKeyhole size={14} /> صلاحيات متقدمة</span>
          </div>
          <div className="media-hub-action-grid compact">
            {adminLinks.map((item) => (
              <Link className={`media-hub-action-card tone-${item.tone}`} href={item.href} key={item.title}>
                <div className="media-hub-action-icon">{item.icon}</div>
                <div>
                  <span>{item.badge}</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </Shell>
  )
}
