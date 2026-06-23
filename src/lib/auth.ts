import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import type { Role } from '@prisma/client'

const COOKIE_NAME = 'token'
const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-me')

export type AuthUser = {
  id: number
  email: string
  name: string
  role: Role
  cityId: number
}

export async function signSession(user: AuthUser) {
  return new SignJWT(user)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
}

export async function setSessionCookie(user: AuthUser) {
  const token = await signSession(user)
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as AuthUser
  } catch {
    return null
  }
}

export function hasRole(user: AuthUser | null, allowed: Role[]) {
  return !!user && allowed.includes(user.role)
}

export function canManageUsers(user: AuthUser | null) {
  return user?.role === 'SUPER_ADMIN'
}

export function canManageCitiesAndDrones(user: AuthUser | null) {
  return user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN'
}

export function canViewAllCities(user: AuthUser | null) {
  return user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN'
}
