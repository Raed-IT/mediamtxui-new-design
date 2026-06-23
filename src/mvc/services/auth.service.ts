import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function loginService(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email }, include: { city: true } })
  if (!user) return null
  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return null
  return { id: user.id, email: user.email, name: user.name, role: user.role, cityId: user.cityId, city: user.city }
}
