import bcrypt from 'bcryptjs'
import { Role } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export function listUsersService() {
  return prisma.user.findMany({ include: { city: true }, orderBy: { id: 'desc' } })
}

export async function createUserService(data: { email: string; password: string; name: string; role: Role; cityId: number }) {
  return prisma.user.create({ data: { ...data, password: await bcrypt.hash(data.password, 10) } })
}

export async function updateUserService(id: number, data: { email: string; password?: string; name: string; role: Role; cityId: number }) {
  return prisma.user.update({
    where: { id },
    data: { ...data, ...(data.password ? { password: await bcrypt.hash(data.password, 10) } : {}) },
  })
}

export function deleteUserService(id: number) {
  return prisma.user.delete({ where: { id } })
}
