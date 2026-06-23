import Shell from '@/components/Shell'
import { getCurrentUser } from '@/lib/auth'
import { Shield, CheckCircle2, XCircle } from 'lucide-react'

const rows = [
  ['عرض لوحة التحكم', true, true, true],
  ['عرض Live Grid', true, true, true],
  ['رؤية درونات المدينة فقط', true, false, false],
  ['رؤية كل المدن والدرونات', false, true, true],
  ['إدارة المدن CRUD', false, true, true],
  ['إدارة الدرونات CRUD', false, true, true],
  ['إدارة المستخدمين CRUD', false, false, true],
  ['إعدادات MediaMTX', false, false, true],
  ['إيقاف الجلسات والمسارات', false, false, true],
  ['التسجيل واللقطات', true, true, true],
]

function Bool({ ok }: { ok: boolean }) {
  return ok ? <span className="badge ok"><CheckCircle2 size={14}/> مسموح</span> : <span className="badge danger"><XCircle size={14}/> ممنوع</span>
}

export default async function PermissionsPage() {
  const user = await getCurrentUser()
  return (
    <Shell>
      <div className="page-animate">
        <div className="topbar">
          <div>
            <h1>الصلاحيات</h1>
            <p className="page-subtitle">مصفوفة الأدوار المستخدمة في المشروع: Viewer, Admin, Super Admin.</p>
          </div>
          <span className="badge"><Shield size={14}/> {user?.role}</span>
        </div>

        <div className="grid grid-3" style={{ marginBottom: 18 }}>
          <div className="card stat-card stat-1"><div className="stat-card-inner"><div className="stat-card-icon">V</div><div><h3>VIEWER</h3><p>عرض البث والدرونات التابعة لمدينته فقط.</p></div></div></div>
          <div className="card stat-card stat-2"><div className="stat-card-inner"><div className="stat-card-icon">A</div><div><h3>ADMIN</h3><p>إدارة المدن والدرونات بدون إدارة المستخدمين.</p></div></div></div>
          <div className="card stat-card stat-3"><div className="stat-card-inner"><div className="stat-card-icon">S</div><div><h3>SUPER_ADMIN</h3><p>صلاحيات كاملة على النظام و MediaMTX.</p></div></div></div>
        </div>

        <div className="card">
          <div className="card-header"><h2 style={{ margin: 0 }}>جدول الصلاحيات</h2></div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>الميزة</th><th>VIEWER</th><th>ADMIN</th><th>SUPER_ADMIN</th></tr></thead>
              <tbody>
                {rows.map(([name, viewer, admin, superAdmin]) => (
                  <tr key={String(name)}>
                    <td style={{ fontWeight: 800 }}>{name}</td>
                    <td><Bool ok={Boolean(viewer)} /></td>
                    <td><Bool ok={Boolean(admin)} /></td>
                    <td><Bool ok={Boolean(superAdmin)} /></td>
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
