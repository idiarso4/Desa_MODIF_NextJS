import { PrismaClient } from '@prisma/client'

async function globalTeardown() {
  console.log('🧹 Starting E2E test teardown...')
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL_TEST || process.env.DATABASE_URL
      }
    }
  })

  try {
    // Clean up test data
    await prisma.activityLog.deleteMany()
    await prisma.letterRequest.deleteMany()
    await prisma.citizen.deleteMany()
    await prisma.family.deleteMany()
    await prisma.user.deleteMany()
    await prisma.userRole.deleteMany()
    await prisma.permission.deleteMany()

    console.log('✅ Test data cleaned up successfully')
  } catch (error) {
    console.error('❌ E2E test teardown failed:', error)
  } finally {
    await prisma.$disconnect()
  }

  console.log('✅ E2E test teardown completed')
}

export default globalTeardown