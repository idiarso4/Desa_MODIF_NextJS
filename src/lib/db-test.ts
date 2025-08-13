// Database connection test utility
import { PrismaClient } from '@prisma/client'

export async function testDatabaseConnection() {
  const prisma = new PrismaClient()
  
  try {
    await prisma.$connect()
    console.log('✅ Database connection successful!')
    
    // Test basic query
    const result = await prisma.$queryRaw`SELECT version()`
    console.log('📊 Database version:', result)
    
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return false
  } finally {
    await prisma.$disconnect()
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testDatabaseConnection()
}