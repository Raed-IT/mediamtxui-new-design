'use client'

import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Activity,
  AlertTriangle,
  Antenna,
  CheckCircle2,
  Clock3,
  Database,
  Globe2,
  HardDrive,
  KeyRound,
  LockKeyhole,
  Radio,
  RotateCcw,
  Save,
  Search,
  ServerCog,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Video,
  Wifi,
} from 'lucide-react'
import { api } from './ApiClient'

type Settings = Record<string, unknown>

type Field = {
  key: string
  label: string
  help: string
  type?: 'text' | 'number' | 'switch'
  placeholder?: string
  warning?: string
}

type Section = {
  id: string
  title: string
  short: string
  description: string
  icon: ReactNode
  accent: 'green' | 'gold' | 'red' | 'blue'
  fields: Field[]
}

const sections: Section[] = [
  {
    id: 'general',
    title: 'عام',
    short: 'تشغيل لوحة التحكم والمهلات',
    description: 'هذه الإعدادات تتحكم بطريقة عمل السيرفر العامة. اترك القيم كما هي إذا لم تكن متأكداً.',
    icon: <ServerCog size={20} />,
    accent: 'green',
    fields: [
      { key: 'api', label: 'تفعيل لوحة التحكم', help: 'يجب أن تبقى مفعلة حتى تستطيع هذه المنصة قراءة حالة البثوث.', type: 'switch' },
      { key: 'apiAddress', label: 'عنوان لوحة التحكم', help: 'منفذ API الخاص بـ MediaMTX.', placeholder: ':9997' },
      { key: 'logLevel', label: 'مستوى السجلات', help: 'اختر info للاستخدام اليومي، debug للتشخيص فقط.', placeholder: 'info' },
      { key: 'readTimeout', label: 'مهلة القراءة', help: 'المدة التي ينتظرها السيرفر عند القراءة.', placeholder: '10s' },
      { key: 'writeTimeout', label: 'مهلة الكتابة', help: 'المدة التي ينتظرها السيرفر عند إرسال البيانات.', placeholder: '10s' },
    ],
  },
  {
    id: 'network',
    title: 'الشبكة',
    short: 'المنافذ والعناوين',
    description: 'كل المنافذ المهمة في مكان واحد. هذه القيم يجب أن تطابق إعدادات الجدار الناري والدومين.',
    icon: <Wifi size={20} />,
    accent: 'blue',
    fields: [
      { key: 'rtmpAddress', label: 'منفذ إرسال البث RTMP', help: 'يستخدمه الدرون أو OBS لإرسال الفيديو إلى السيرفر.', placeholder: ':1935' },
      { key: 'webrtcAddress', label: 'منفذ المشاهدة WebRTC', help: 'أفضل خيار للمراقبة المباشرة بزمن تأخير قليل.', placeholder: ':8889' },
      { key: 'webrtcLocalUDPAddress', label: 'منفذ WebRTC UDP', help: 'منفذ ICE المستخدم للاتصال المباشر.', placeholder: ':8189' },
      { key: 'hlsAddress', label: 'منفذ HLS', help: 'مشاهدة عبر المتصفح بزمن تأخير أعلى.', placeholder: ':8888' },
      { key: 'rtspAddress', label: 'منفذ RTSP', help: 'للكاميرات أو برامج المراقبة التي تدعم RTSP.', placeholder: ':8554' },
      { key: 'srtAddress', label: 'منفذ SRT', help: 'مفيد للشبكات الضعيفة أو البث عبر الإنترنت.', placeholder: ':8890' },
    ],
  },
  {
    id: 'streaming',
    title: 'البث',
    short: 'تشغيل البروتوكولات',
    description: 'فعّل فقط البروتوكولات التي تحتاجها. غالباً تحتاج RTMP للإرسال و WebRTC للمشاهدة.',
    icon: <Antenna size={20} />,
    accent: 'green',
    fields: [
      { key: 'rtmp', label: 'استقبال RTMP', help: 'ضروري إذا كان الدرون أو OBS يرسل عبر RTMP.', type: 'switch' },
      { key: 'webrtc', label: 'مشاهدة WebRTC', help: 'ضروري لصفحة Live Grid والمشاهدة قليلة التأخير.', type: 'switch' },
      { key: 'hls', label: 'مشاهدة HLS', help: 'مفيد للمشاهدة العامة لكنه أعلى تأخيراً.', type: 'switch' },
      { key: 'rtsp', label: 'RTSP', help: 'للكاميرات أو التطبيقات الخارجية.', type: 'switch' },
      { key: 'srt', label: 'SRT', help: 'للبث عبر شبكات غير مستقرة.', type: 'switch' },
      { key: 'hlsAllowOrigin', label: 'السماح للمواقع HLS', help: 'ضع دومين لوحة التحكم أو * أثناء التجربة.', placeholder: '*' },
      { key: 'webrtcAllowOrigin', label: 'السماح للمواقع WebRTC', help: 'ضع دومين لوحة التحكم أو * أثناء التجربة.', placeholder: '*' },
    ],
  },
  {
    id: 'recording',
    title: 'التسجيل',
    short: 'مكان ومدة التسجيل',
    description: 'تحكم بمكان حفظ التسجيلات وطول الملفات. لا تفعل التسجيل العام إلا إذا لديك مساحة كافية.',
    icon: <Database size={20} />,
    accent: 'gold',
    fields: [
      { key: 'record', label: 'التسجيل الافتراضي', help: 'إذا كان مفعلاً سيتم التسجيل حسب إعدادات المسارات.', type: 'switch', warning: 'قد يستهلك مساحة كبيرة.' },
      { key: 'recordPath', label: 'مسار حفظ التسجيل', help: 'مكان حفظ ملفات الفيديو على السيرفر.', placeholder: './recordings/%path/%Y-%m-%d_%H-%M-%S-%f' },
      { key: 'recordFormat', label: 'صيغة التسجيل', help: 'fmp4 مناسبة لمعظم الحالات.', placeholder: 'fmp4' },
      { key: 'recordPartDuration', label: 'مدة جزء التسجيل', help: 'قيمة صغيرة تساعد على حفظ آمن.', placeholder: '1s' },
      { key: 'recordSegmentDuration', label: 'مدة ملف التسجيل', help: 'مثال: ملف كل ساعة.', placeholder: '1h' },
      { key: 'recordDeleteAfter', label: 'حذف التسجيلات بعد', help: 'مثال: 7d أو 0s لعدم الحذف.', placeholder: '7d' },
    ],
  },
  {
    id: 'security',
    title: 'الحماية',
    short: 'الأمان والصلاحيات',
    description: 'إعدادات الحماية المتقدمة. لا تغيرها أثناء وجود بث مباشر إلا إذا كنت متأكداً.',
    icon: <LockKeyhole size={20} />,
    accent: 'red',
    fields: [
      { key: 'authMethod', label: 'طريقة الحماية', help: 'internal مناسبة لمعظم الأنظمة الصغيرة.', placeholder: 'internal' },
      { key: 'apiAllowOrigin', label: 'السماح لواجهة API', help: 'الدومين المسموح له بالاتصال بواجهة MediaMTX.', placeholder: '*' },
      { key: 'rtspAuthMethods', label: 'حماية RTSP', help: 'basic,digest عند الحاجة.', placeholder: 'basic,digest' },
      { key: 'metrics', label: 'Metrics', help: 'للمراقبة التقنية المتقدمة.', type: 'switch' },
      { key: 'pprof', label: 'PPROF', help: 'للتشخيص التقني فقط، يفضل تركه متوقفاً.', type: 'switch', warning: 'للمطورين فقط.' },
    ],
  },
]

function stringifyValue(value: unknown) {
  if (Array.isArray(value)) return value.join(', ')
  if (value === undefined || value === null) return ''
  return String(value)
}

function parseValue(type: Field['type'], value: string | boolean) {
  if (type === 'switch') return Boolean(value)
  if (type === 'number') return Number(value)
  if (typeof value === 'string' && value.includes(',') && !value.trim().startsWith('[')) {
    return value.split(',').map((item) => item.trim()).filter(Boolean)
  }
  return value
}

function isEnabled(value: unknown) {
  return value === true || value === 'yes' || value === 'true'
}

function OverviewCard({ icon, label, value, state }: { icon: ReactNode; label: string; value: string; state?: 'ok' | 'warn' | 'danger' }) {
  return (
    <div className={`settings-overview-card ${state || 'ok'}`}>
      <span className="settings-overview-icon">{icon}</span>
      <div>
        <small>{label}</small>
        <b>{value || '—'}</b>
      </div>
    </div>
  )
}

export function HumanSettingsHub({ initial }: { initial: Settings }) {
  const router = useRouter()
  const [active, setActive] = useState('general')
  const [values, setValues] = useState<Settings>(initial || {})
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [dirty, setDirty] = useState(false)

  const current = sections.find((section) => section.id === active) || sections[0]

  const matchedFields = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return null
    return sections.flatMap((section) =>
      section.fields
        .filter((field) => `${section.title} ${field.label} ${field.help} ${field.key}`.toLowerCase().includes(q))
        .map((field) => ({ ...field, section }))
    )
  }, [query])

  const enabledCount = ['rtmp', 'webrtc', 'hls', 'rtsp', 'srt'].filter((key) => isEnabled(values[key])).length

  function updateField(field: Field, value: string | boolean) {
    setDirty(true)
    setValues((old) => ({ ...old, [field.key]: parseValue(field.type, value) }))
  }

  async function save() {
    setBusy(true)
    setMessage('')
    try {
      const body: Settings = {}
      for (const section of sections) {
        for (const field of section.fields) {
          if (Object.prototype.hasOwnProperty.call(values, field.key)) body[field.key] = values[field.key]
        }
      }
      await api('/api/mediamtx/global', { method: 'PATCH', body: JSON.stringify(body) })
      setMessage('تم حفظ الإعدادات بنجاح')
      setDirty(false)
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'فشل حفظ الإعدادات')
    } finally {
      setBusy(false)
    }
  }

  function resetLocal() {
    setValues(initial || {})
    setDirty(false)
    setMessage('تم الرجوع لآخر إعدادات محفوظة')
  }

  const visibleFields = matchedFields ? matchedFields : current.fields.map((field) => ({ ...field, section: current }))

  return (
    <div className="settings-v2">
      <section className="settings-v2-hero">
        <div className="settings-v2-copy">
          <span className="settings-v2-kicker"><Sparkles size={15} /> مركز التحكم</span>
          <h2>إعدادات واضحة للمسؤول غير التقني</h2>
          <p>
            واجهة جديدة أصغر وأنظف. الإعدادات مقسمة حسب الاستخدام اليومي: عام، الشبكة، البث، التسجيل، والحماية.
          </p>
        </div>
        <div className="settings-v2-actions">
          <label className="settings-search-box">
            <Search size={16} />
            <input placeholder="ابحث عن إعداد..." value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <button className="btn secondary" onClick={resetLocal} disabled={!dirty || busy}><RotateCcw size={16} /> تراجع</button>
          <button className="btn" onClick={save} disabled={busy}><Save size={16} /> {busy ? 'جار الحفظ...' : 'حفظ'}</button>
        </div>
      </section>

      <div className="settings-overview-grid">
        <OverviewCard icon={<Globe2 size={20} />} label="API" value={stringifyValue(values.apiAddress)} state={isEnabled(values.api) ? 'ok' : 'danger'} />
        <OverviewCard icon={<Video size={20} />} label="WebRTC" value={stringifyValue(values.webrtcAddress)} state={isEnabled(values.webrtc) ? 'ok' : 'warn'} />
        <OverviewCard icon={<Radio size={20} />} label="RTMP" value={stringifyValue(values.rtmpAddress)} state={isEnabled(values.rtmp) ? 'ok' : 'warn'} />
        <OverviewCard icon={<HardDrive size={20} />} label="التسجيل" value={isEnabled(values.record) ? 'مفعل' : 'حسب كل بث'} state={isEnabled(values.record) ? 'ok' : 'warn'} />
      </div>

      <div className="settings-v2-shell">
        <aside className="settings-v2-nav">
          {sections.map((section) => (
            <button
              key={section.id}
              className={`settings-v2-tab ${active === section.id && !query ? 'active' : ''} ${section.accent}`}
              onClick={() => { setActive(section.id); setQuery('') }}
            >
              <span>{section.icon}</span>
              <div>
                <b>{section.title}</b>
                <small>{section.short}</small>
              </div>
            </button>
          ))}
        </aside>

        <main className="settings-v2-panel">
          <div className="settings-v2-panel-head">
            <div>
              <span className={`settings-section-chip ${current.accent}`}>{query ? 'نتائج البحث' : current.title}</span>
              <h3>{query ? `نتائج البحث عن: ${query}` : current.description}</h3>
              <p>{query ? 'اضغط على أي إعداد لتعديله مباشرة.' : current.short}</p>
            </div>
            <div className="settings-health-badge">
              <CheckCircle2 size={16} />
              <span>{enabledCount}/5 بروتوكولات مفعلة</span>
            </div>
          </div>

          <div className="settings-v2-fields">
            {visibleFields.map((field) => {
              const rawValue = values[field.key]
              const enabled = Boolean(rawValue)
              return (
                <div className="settings-v2-field" key={`${field.section.id}-${field.key}`}>
                  <div className="settings-v2-field-info">
                    <span className={`field-mini-icon ${field.section.accent}`}>{field.section.icon}</span>
                    <div>
                      <b>{field.label}</b>
                      <p>{field.help}</p>
                      {field.warning && <em><AlertTriangle size={13} /> {field.warning}</em>}
                    </div>
                  </div>
                  <div className="settings-v2-control">
                    {field.type === 'switch' ? (
                      <button type="button" className={`settings-v2-switch ${enabled ? 'on' : ''}`} onClick={() => updateField(field, !Boolean(values[field.key]))}>
                        <span />
                        {enabled ? 'مفعل' : 'متوقف'}
                      </button>
                    ) : (
                      <input
                        value={stringifyValue(rawValue)}
                        placeholder={field.placeholder || field.key}
                        onChange={(event) => updateField(field, event.target.value)}
                      />
                    )}
                  </div>
                </div>
              )
            })}
            {!visibleFields.length && <div className="settings-empty-search">لا توجد إعدادات مطابقة لهذا البحث.</div>}
          </div>
        </main>
      </div>

      <section className="settings-help-strip">
        <div><ShieldCheck size={18} /><b>نصيحة أمان</b><span>لا تغيّر إعدادات الحماية أو المنافذ أثناء وجود بث مباشر إلا عند الحاجة.</span></div>
        <div><Clock3 size={18} /><b>أفضل إعداد يومي</b><span>RTMP للإرسال، WebRTC للمشاهدة، والتسجيل حسب الحاجة فقط.</span></div>
        <div><SlidersHorizontal size={18} /><b>متقدم</b><span>الإعدادات التقنية الكاملة موجودة في إدارة MediaMTX.</span></div>
      </section>

      {message && <div className={`settings-floating-message ${message.includes('فشل') ? 'danger' : 'ok'}`}>{message}</div>}
    </div>
  )
}
