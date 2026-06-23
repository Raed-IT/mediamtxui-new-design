import { Role } from '@prisma/client'
import { z } from 'zod'
import { getCurrentUser, hasRole } from '@/lib/auth'
import { fail, ok } from '@/lib/http'
import { createCityService, deleteCityService, listCitiesService, updateCityService } from '@/mvc/services/city.service'

const citySchema = z.object({ name: z.string().min(2) })

async function guard() {
  const user = await getCurrentUser()
  if (!hasRole(user, [Role.SUPER_ADMIN, Role.ADMIN])) return null
  return user
}

export async function listCitiesController() {
  if (!(await guard())) return fail('Forbidden', 403)
  return ok(await listCitiesService())
}

export async function createCityController(request: Request) {
  if (!(await guard())) return fail('Forbidden', 403)
  const body = citySchema.safeParse(await request.json())
  if (!body.success) return fail('Invalid city data', 422)
  return ok(await createCityService(body.data.name), 201)
}

export async function updateCityController(request: Request, id: number) {
  if (!(await guard())) return fail('Forbidden', 403)
  const body = citySchema.safeParse(await request.json())
  if (!body.success) return fail('Invalid city data', 422)
  return ok(await updateCityService(id, body.data.name))
}

export async function deleteCityController(id: number) {
  if (!(await guard())) return fail('Forbidden', 403)
  return ok(await deleteCityService(id))
}
