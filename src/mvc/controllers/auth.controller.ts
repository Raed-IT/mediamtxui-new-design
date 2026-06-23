import { z } from 'zod'
import { clearSessionCookie, getCurrentUser, setSessionCookie } from '@/lib/auth'
import { fail, ok } from '@/lib/http'
import { loginService } from '@/mvc/services/auth.service'

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) })

export async function loginController(request: Request) {
  const body = loginSchema.safeParse(await request.json())
  if (!body.success) return fail('Invalid email or password', 422)
  const user = await loginService(body.data.email, body.data.password)
  if (!user) return fail('Invalid email or password', 401)
  await setSessionCookie({ id: user.id, email: user.email, name: user.name, role: user.role, cityId: user.cityId })
  return ok({ user: { ...user, password: undefined } })
}

export async function meController() {
  const user = await getCurrentUser()
  if (!user) return fail('Unauthenticated', 401)
  return ok(user)
}

export async function logoutController() {
  await clearSessionCookie()
  return ok({ loggedOut: true })
}
