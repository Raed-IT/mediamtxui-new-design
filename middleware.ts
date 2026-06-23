import { jwtVerify } from 'jose'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

type SessionPayload = {
  id: number
  email: string
  name: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'VIEWER'
  cityId: number
}

const PUBLIC_ROUTES = ['/login']
const AUTH_ONLY_ROUTES = ['/dashboard', '/live-grid']
const ADMIN_ROUTES = ['/cities', '/drones']
const SUPER_ADMIN_ROUTES = ['/users', '/settings', '/mediamtx-settings']

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-me')

function startsWithAny(pathname: string, routes: string[]) {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

async function readSession(request: NextRequest): Promise<SessionPayload | null> {
  const token = request.cookies.get('token')?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as SessionPayload
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/recordings') ||
    pathname.startsWith('/snapshots') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  const isPublicRoute = startsWithAny(pathname, PUBLIC_ROUTES)
  const user = await readSession(request)

  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (!user) return NextResponse.next()

  const isAllowedForAllUsers = startsWithAny(pathname, AUTH_ONLY_ROUTES) || pathname === '/'
  const isAdminRoute = startsWithAny(pathname, ADMIN_ROUTES)
  const isSuperAdminRoute = startsWithAny(pathname, SUPER_ADMIN_ROUTES)

  if (isAllowedForAllUsers) return NextResponse.next()

  if (isAdminRoute && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN')) {
    return NextResponse.next()
  }

  if (isSuperAdminRoute && user.role === 'SUPER_ADMIN') {
    return NextResponse.next()
  }

  return NextResponse.redirect(new URL('/dashboard?forbidden=1', request.url))
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
