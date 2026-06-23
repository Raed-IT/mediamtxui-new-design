import { prisma } from '@/lib/prisma'

export function listCitiesService() {
  return prisma.city.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { users: true, drones: true } } } })
}

export function createCityService(name: string) {
  return prisma.city.create({ data: { name } })
}

export function updateCityService(id: number, name: string) {
  return prisma.city.update({ where: { id }, data: { name } })
}

export function deleteCityService(id: number) {
  return prisma.city.delete({ where: { id } })
}
