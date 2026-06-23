import DashboardRecentPaths from '@/components/DashboardRecentPaths'
import Shell from '@/components/Shell'
import { getCurrentUser } from '@/lib/auth'
import { listMediaMtxPaths, listMediaMtxRecordings, listMediaMtxSessions } from '@/lib/mediamtx'
import { prisma } from '@/lib/prisma'
import { Activity, Building2, Clapperboard, Plane, Users, Wifi } from 'lucide-react'

export default async function Dashboard(){
  const user = await getCurrentUser()
  const canViewAll = user?.role === 'SUPER_ADMIN'
  const droneWhere = canViewAll ? {} : { cityId: user?.cityId || 0 }
  const [cities, drones, users, allPaths, sessions, recordings, accessibleDrones] = await Promise.all([
    prisma.city.count(),
    prisma.drone.count({ where: droneWhere }),
    prisma.user.count(),
    listMediaMtxPaths(),
    listMediaMtxSessions().catch(() => ({} as Record<string, unknown[]>)),
    listMediaMtxRecordings().catch(() => ({ items: [] as unknown[] })),
    prisma.drone.findMany({
      where: droneWhere,
      include: { city: true },
      orderBy: { name: 'asc' },
    }),
  ])

  const allowedStreamKeys = new Set(
    accessibleDrones.flatMap((drone) => [drone.streamKey, drone.name, drone.label]).filter(Boolean),
  )

  const paths = canViewAll
    ? allPaths
    : allPaths.filter((path) => {
        const pathName = String(path.name || '').toLowerCase()
        return Array.from(allowedStreamKeys).some((key) => {
          const value = String(key).toLowerCase()
          return pathName === value || pathName.endsWith(`/${value}`) || pathName.endsWith(value)
        })
      })

  const liveCount = paths.filter((p) => p.ready).length
  const viewerCount = Object.values(sessions).reduce((total, list) => total + (Array.isArray(list) ? list.length : 0), 0)

  return (
    <Shell>
      <div className="page-animate">
        <div className="page-head">
          <div>
            <span className="badge ok"><Wifi size={14} /> Live Operations</span>
            <h1>Mission Overview</h1>
            <p className="page-subtitle">A new design idea: map-first operations center with compact metrics, recent events, and direct stream actions. No heavy old admin-panel feeling.</p>
          </div>
          <span className="badge ok">{liveCount} live stream{liveCount === 1 ? '' : 's'}</span>
        </div>

        <div className="grid grid-4 stat-row">
          <div className="card stat-mini"><Activity size={25} /><span>Live Streams</span><b>{liveCount}</b><p className="muted">Ready paths from MediaMTX</p></div>
          <div className="card stat-mini"><Plane size={25} /><span>Accessible Drones</span><b>{drones}</b><p className="muted">Filtered by city and role</p></div>
          <div className="card stat-mini"><Users size={25} /><span>Current Viewers</span><b>{viewerCount}</b><p className="muted">Active watching sessions</p></div>
          <div className="card stat-mini"><Clapperboard size={25} /><span>Recordings</span><b>{recordings.items?.length || 0}</b><p className="muted">Saved server segments</p></div>
        </div>

        <section className="card" style={{ marginTop: 14 }}>
          <div className="card-header">
            <div>
              <h2 style={{ margin: 0 }}>Operations Feed</h2>
              <p className="muted" style={{ margin: '4px 0 0' }}>Simple messages for non-technical operators.</p>
            </div>
            <span className="badge ok">Today</span>
          </div>
          <div className="event-list dashboard-feed-grid">
            <div className="event-row"><span className="event-dot" /><b>{liveCount}</b><span className="muted">streams are currently online.</span></div>
            <div className="event-row"><span className="event-dot" /><b>{viewerCount}</b><span className="muted">viewers are connected now.</span></div>
            <div className="event-row"><span className="event-dot" /><b>{cities}</b><span className="muted">cities are configured.</span></div>
            <div className="event-row"><span className="event-dot" /><b>{user?.role === 'SUPER_ADMIN' ? users : 'Hidden'}</b><span className="muted">users in the system.</span></div>
            <div className="event-row"><Building2 size={16} color="var(--gold)" /><span className="muted">City filtering is active for viewers.</span></div>
          </div>
        </section>

        <DashboardRecentPaths paths={paths} canControl={user?.role === 'SUPER_ADMIN'} />
      </div>
    </Shell>
  )
}
