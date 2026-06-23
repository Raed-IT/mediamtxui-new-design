import type { AuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export function listDronesService(user: AuthUser) {
  return prisma.drone.findMany({
    where: user.role === 'VIEWER' ? { cityId: user.cityId } : {},
    include: { city: true },
    orderBy: { name: 'asc' },
  })
}

export function createDroneService(data: { name: string; label: string; streamKey: string; cityId: number }) {
  return prisma.drone.create({ data })
}

export function updateDroneService(id: number, data: { name: string; label: string; streamKey: string; cityId: number }) {
  return prisma.drone.update({ where: { id }, data })
}

export function deleteDroneService(id: number) {
  return prisma.drone.delete({ where: { id } })
}
