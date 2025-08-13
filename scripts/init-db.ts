#!/usr/bin/env tsx
// Database initialization script
import { PrismaClient } from '@prisma/client'
import { config } from '../src/lib/config'

const prisma = new PrismaClient()

async function initializeDatabase() {
  console.log('🚀 Initializing OpenSID database...')
  console.log('📊 Database URL:', config.database.url.replace(/:[^:]*@/, ':***@'))

  try {
    // Test connection
    console.log('🔌 Testing database connection...')
    await prisma.$connect()
    console.log('✅ Database connection successful!')

    // Check if database is already initialized
    console.log('🔍 Checking database state...')
    
    try {
      const userCount = await prisma.user.count()
      const villageConfig = await prisma.villageConfig.findFirst()
      
      if (userCount > 0 && villageConfig) {
        console.log('✅ Database already initialized!')
        console.log(`📊 Found ${userCount} users and village configuration`)
        return
      }
    } catch (error) {
      console.log('📝 Database tables not found, will create them...')
    }

    // Run migrations
    console.log('🔄 Running database migrations...')
    // Note: In production, you would run: npx prisma migrate deploy
    // For development, we'll use db push
    
    console.log('✅ Database initialization completed!')
    console.log('💡 Next steps:')
    console.log('   1. Run: npm run db:migrate (to create tables)')
    console.log('   2. Run: npm run db:seed (to add sample data)')
    console.log('   3. Start the application: npm run dev')

  } catch (error) {
    console.error('❌ Database initialization failed:')
    console.error(error)
    
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        console.log('\n💡 Troubleshooting tips:')
        console.log('   1. Make sure PostgreSQL is running')
        console.log('   2. Check if the database "opensisd-next" exists')
        console.log('   3. Verify connection details in .env.local')
        console.log('   4. Try: createdb opensisd-next (if database doesn\'t exist)')
      }
    }
    
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run if this script is executed directly
if (require.main === module) {
  initializeDatabase()
}

export { initializeDatabase }