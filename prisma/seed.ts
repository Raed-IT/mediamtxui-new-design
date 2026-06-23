import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const damascus = await prisma.city.upsert({ where: { name: 'Damascus' }, update: {}, create: { name: 'Damascus' } })
  const aleppo = await prisma.city.upsert({ where: { name: 'Aleppo' }, update: {}, create: { name: 'Aleppo' } })

  const password = await bcrypt.hash('123456', 10)

  await prisma.user.upsert({
    where: { email: 'superadmin@test.com' },
    update: { password, role: Role.SUPER_ADMIN, cityId: damascus.id },
    create: { email: 'superadmin@test.com', name: 'Super Admin', password, role: Role.SUPER_ADMIN, cityId: damascus.id },
  })

  await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: { password, role: Role.ADMIN, cityId: damascus.id },
    create: { email: 'admin@test.com', name: 'City Admin', password, role: Role.ADMIN, cityId: damascus.id },
  })

  await prisma.user.upsert({
    where: { email: 'viewer@test.com' },
    update: { password, role: Role.VIEWER, cityId: damascus.id },
    create: { email: 'viewer@test.com', name: 'Viewer', password, role: Role.VIEWER, cityId: damascus.id },
  })

  for (const drone of [
    { name: 'drone-01', label: 'Drone 01', streamKey: 'drone-01', cityId: damascus.id },
    { name: 'drone-02', label: 'Drone 02', streamKey: 'drone-02', cityId: damascus.id },
    { name: 'drone-03', label: 'Drone 03', streamKey: 'drone-03', cityId: aleppo.id },
  ]) {
    await prisma.drone.upsert({ where: { name: drone.name }, update: drone, create: drone })
  }
}

main().finally(() => prisma.$disconnect())
