
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10)

  // 1. Create or Find Workspace
  let workspace = await prisma.workspace.findFirst({
    where: { name: 'Main Workspace' }
  })

  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: {
        name: 'Main Workspace',
      }
    })
    console.log('Created Main Workspace')
  } else {
    console.log('Main Workspace already exists')
  }

  // 2. Upsert User (Create if not exists, Update if exists)
  // relying on unique email
  await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: {}, // No changes if exists
    create: {
      email: 'admin@gmail.com',
      name: 'Super Admin',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      workspaceId: workspace.id,
      permissions: JSON.stringify(['all'])
    }
  })

  console.log('Seed data checked/created!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
