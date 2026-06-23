import { Role } from '@prisma/client'
import { z } from 'zod'
import { getCurrentUser, hasRole } from '@/lib/auth'
import { fail, ok } from '@/lib/http'
import { createDroneService, deleteDroneService, listDronesService, updateDroneService } from '@/mvc/services/drone.service'

const droneSchema = z.object({
  name: z.string().min(2),
  label: z.string().min(2),
  streamKey: z.string().min(2),
  cityId: z.coerce.number().int().positive(),
})

export async function listDronesController() {
  const user = await getCurrentUser()
  if (!user) return fail('Unauthenticated', 401)
  return ok(await listDronesService(user))
}

async function manageGuard() {
  const user = await getCurrentUser()
  if (!hasRole(user, [Role.SUPER_ADMIN, Role.ADMIN])) return null
  return user
}

export async function createDroneController(request: Request) {
  if (!(await manageGuard())) return fail('Forbidden', 403)
  const body = droneSchema.safeParse(await request.json())
  if (!body.success) return fail('Invalid drone data', 422)
  return ok(await createDroneService(body.data), 201)
}

export async function updateDroneController(request: Request, id: number) {
  if (!(await manageGuard())) return fail('Forbidden', 403)
  const body = droneSchema.safeParse(await request.json())
  if (!body.success) return fail('Invalid drone data', 422)
  return ok(await updateDroneService(id, body.data))
}

export async function deleteDroneController(id: number) {
  if (!(await manageGuard())) return fail('Forbidden', 403)
  return ok(await deleteDroneService(id))
}
