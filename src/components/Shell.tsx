'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  BarChart3,
  Building2,
  ChevronsLeft,
  ChevronsRight,
  CircleUserRound,
  Clapperboard,
  Command,
  Grid2X2,
  LogOut,
  Menu,
  Plane,
  Radio,
  Search,
  Settings,
  Users,
  X,
} from 'lucide-react'
import { api } from './ApiClient'

type User = {
  id: number
  name: string
  email: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'VIEWER'
  cityId: number
}

type NavItem = {
  label: string
  href: string
  show: boolean
  icon: ReactNode
  section: 'main' | 'manage' | 'system'
}

function roleLabel(role?: User['role']) {
  if (role === 'SUPER_ADMIN') return 'Super Admin'
  if (role === 'ADMIN') return 'Admin'
  if (role === 'VIEWER') return 'Viewer'
  return 'Loading'
}

function active(pathname: string, href: string) {
  return pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`))
}

export default function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [compact, setCompact] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    api<User>('/api/auth/me').then(setUser).catch(() => router.push('/login'))
  }, [router])

  useEffect(() => {
    function toggleSidebar(event: Event) {
      const detail = (event as CustomEvent<{ hidden?: boolean }>).detail
      setHidden((old) => (typeof detail?.hidden === 'boolean' ? detail.hidden : !old))
      setMobileOpen(false)
    }

    window.addEventListener('streamops:toggle-sidebar', toggleSidebar)
    return () => window.removeEventListener('streamops:toggle-sidebar', toggleSidebar)
  }, [])

  const isSuper = user?.role === 'SUPER_ADMIN'
  const canManage = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN'

  const nav = useMemo<NavItem[]>(() => [
    { label: 'Dashboard', href: '/dashboard', show: true, icon: <BarChart3 size={18} />, section: 'main' },
    { label: 'Live Grid', href: '/live-grid', show: true, icon: <Grid2X2 size={18} />, section: 'main' },
    { label: 'Drones', href: '/drones', show: canManage, icon: <Plane size={18} />, section: 'manage' },
    { label: 'Cities', href: '/cities', show: canManage, icon: <Building2 size={18} />, section: 'manage' },
    { label: 'Users', href: '/users', show: isSuper, icon: <Users size={18} />, section: 'manage' },
    { label: 'MediaMTX', href: '/mediamtx-settings', show: isSuper, icon: <Radio size={18} />, section: 'system' },
    { label: 'Recordings', href: '/mediamtx-settings/recordings', show: isSuper, icon: <Clapperboard size={18} />, section: 'system' },
    { label: 'Settings', href: '/settings', show: isSuper, icon: <Settings size={18} />, section: 'system' },
  ], [canManage, isSuper])

  const visible = nav.filter((item) => item.show)

  async function logout() {
    await api('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div className={`ops-shell right-dock ${compact ? 'dock-compact' : ''} ${hidden ? 'dock-hidden' : ''}`} dir="ltr">
      {mobileOpen && <button className="mobile-scrim" onClick={() => setMobileOpen(false)} aria-label="Close menu" />}

      <aside className={`ops-dock ${mobileOpen ? 'open' : ''}`}>
        <div className="dock-brand">
          <span className="brand-glyph"><Command size={19} /></span>
          {!compact && <div><b>StreamOps</b><small>MediaMTX Control</small></div>}
          <button className="dock-toggle" onClick={() => setCompact((v) => !v)} title="Toggle sidebar">
            {compact ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
          </button>
        </div>

        <div className="dock-user">
          <span className="avatar"><CircleUserRound size={18} /></span>
          {!compact && <div className="dock-user-text"><b>{user?.name || 'Loading...'}</b><small>{roleLabel(user?.role)}</small></div>}
        </div>

        <nav className="dock-nav">
          {(['main', 'manage', 'system'] as const).map((section) => {
            const items = visible.filter((item) => item.section === section)
            if (!items.length) return null
            return (
              <div className="dock-section" key={section}>
                {!compact && <span className="dock-section-title">{section === 'main' ? 'Monitor' : section === 'manage' ? 'Manage' : 'System'}</span>}
                {items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    onClick={() => setMobileOpen(false)}
                    className={`dock-link ${active(pathname, item.href) ? 'is-active' : ''}`}
                  >
                    <span>{item.icon}</span>
                    {!compact && <b>{item.label}</b>}
                  </Link>
                ))}
              </div>
            )
          })}
        </nav>

        <button className="dock-logout" onClick={logout} title="Logout">
          <LogOut size={18} /> {!compact && <span>Logout</span>}
        </button>
      </aside>

      <main className="ops-main">
        <header className="ops-topbar">
          <div className="topbar-left">
            <button className="mobile-nav-button" onClick={() => setMobileOpen(true)}><Menu size={18} /></button>
            {mobileOpen && <button className="mobile-nav-button" onClick={() => setMobileOpen(false)}><X size={18} /></button>}
            {hidden && <button className="mobile-nav-button show-dock-button" onClick={() => setHidden(false)}><Menu size={18} /></button>}
            <div>
              <b>Operations Console</b>
              <small>City-filtered live monitoring and MediaMTX control</small>
            </div>
          </div>
          <div className="topbar-search">
            <Search size={16} />
            <input placeholder="Search streams, drones, users..." />
          </div>
          <div className="topbar-status"><span /> Online</div>
        </header>
        <section className="ops-content">{children}</section>
      </main>
    </div>
  )
}
