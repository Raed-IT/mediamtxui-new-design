import { Role } from '@prisma/client'
import { z } from 'zod'
import { getCurrentUser, hasRole } from '@/lib/auth'
import { fail, ok } from '@/lib/http'
import { createUserService, deleteUserService, listUsersService, updateUserService } from '@/mvc/services/user.service'

type UserPayload = { email: string; password?: string; name: string; role: Role; cityId: number }

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).optional(),
  name: z.string().min(2),
  role: z.nativeEnum(Role),
  cityId: z.coerce.number().int().positive(),
})

async function guard() {
  const user = await getCurrentUser()
  if (!hasRole(user, [Role.SUPER_ADMIN])) return null
  return user
}

export async function listUsersController() {
  if (!(await guard())) return fail('Forbidden', 403)
  const users = await listUsersService()
  return ok((users as Array<Record<string, unknown>>).map(({ password: _password, ...user }) => user))
}

export async function createUserController(request: Request) {
  if (!(await guard())) return fail('Forbidden', 403)
  const body = userSchema.extend({ password: z.string().min(6) }).safeParse(await request.json())
  if (!body.success) return fail('Invalid user data', 422)
  const { password: _password, ...user } = await createUserService(body.data as UserPayload & { password: string })
  return ok(user, 201)
}

export async function updateUserController(request: Request, id: number) {
  if (!(await guard())) return fail('Forbidden', 403)
  const body = userSchema.safeParse(await request.json())
  if (!body.success) return fail('Invalid user data', 422)
  const { password: _password, ...user } = await updateUserService(id, body.data as UserPayload)
  return ok(user)
}

export async function deleteUserController(id: number) {
  if (!(await guard())) return fail('Forbidden', 403)
  return ok(await deleteUserService(id))
}
