'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, LockKeyhole, RadioTower, ShieldCheck } from 'lucide-react'
import { api } from '@/components/ApiClient'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('superadmin@test.com')
  const [password, setPassword] = useState('123456')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-shell">
      <section className="login-visual">
        <div className="dock-brand" style={{ zIndex: 2 }}>
          <span className="brand-glyph"><RadioTower size={21} /></span>
          <div><b>StreamOps</b><small>MediaMTX Control Room</small></div>
        </div>
        <div className="login-orb" />
        <div className="login-title">
          <span className="badge"><ShieldCheck size={13} /> Secure Operations</span>
          <h1>Monitor drones like a control room, not an admin panel.</h1>
          <p>City-based access, role permissions, live-only MediaMTX streams, recording, snapshots, and a cleaner command-center experience.</p>
        </div>
        <div className="grid grid-2" style={{ zIndex: 2 }}>
          <div className="card" style={{ background: 'rgba(255,255,255,.1)', borderColor: 'rgba(255,255,255,.16)', color: 'white' }}><b>Live Grid</b><p style={{ color: '#d8e5df' }}>Auto-fill and fast operator controls.</p></div>
          <div className="card" style={{ background: 'rgba(255,255,255,.1)', borderColor: 'rgba(255,255,255,.16)', color: 'white' }}><b>Permissions</b><p style={{ color: '#d8e5df' }}>Super Admin, Admin, Viewer.</p></div>
        </div>
      </section>

      <section className="login-panel-wrap">
        <form onSubmit={submit} className="card login-card stack">
          <div>
            <span className="badge ok"><ShieldCheck size={13} /> Sign in</span>
            <h2>Welcome back</h2>
            <p className="muted">Enter the operations console.</p>
          </div>

          <label className="stack">
            <span className="muted">Email address</span>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          </label>

          <label className="stack">
            <span className="muted">Password</span>
            <div style={{ position: 'relative' }}>
              <LockKeyhole size={17} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--muted)' }} />
              <input className="input" style={{ paddingLeft: 38, paddingRight: 38 }} type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
              <button type="button" className="icon-btn" style={{ position: 'absolute', right: 4, top: 4, width: 32, height: 32, padding: 0, boxShadow: 'none' }} onClick={() => setShowPass((v) => !v)}>{showPass ? <EyeOff size={15} /> : <Eye size={15} />}</button>
            </div>
          </label>

          {error && <p className="badge danger">{error}</p>}
          <button className="btn" disabled={loading}>{loading ? 'Signing in...' : 'Open Console'}</button>
          <p className="muted" style={{ fontSize: 12 }}>Default seed: superadmin@test.com / 123456</p>
        </form>
      </section>
    </main>
  )
}
