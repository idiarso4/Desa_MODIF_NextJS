import { chromium, FullConfig } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E test setup...')
  
  // Initialize test database
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL_TEST || process.env.DATABASE_URL
      }
    }
  })

  try {
    // Clean up existing test data
    await prisma.activityLog.deleteMany()
    await prisma.letterRequest.deleteMany()
    await prisma.citizen.deleteMany()
    await prisma.family.deleteMany()
    await prisma.user.deleteMany()
    await prisma.userRole.deleteMany()
    await prisma.permission.deleteMany()

    console.log('🧹 Cleaned up existing test data')

    // Create permissions
    const permissions = await Promise.all([
      prisma.permission.create({
        data: {
          name: 'citizens:read',
          resource: 'citizens',
          action: 'read'
        }
      }),
      prisma.permission.create({
        data: {
          name: 'citizens:create',
          resource: 'citizens',
          action: 'create'
        }
      }),
      prisma.permission.create({
        data: {
          name: 'citizens:update',
          resource: 'citizens',
          action: 'update'
        }
      }),
      prisma.permission.create({
        data: {
          name: 'citizens:delete',
          resource: 'citizens',
          action: 'delete'
        }
      }),
      prisma.permission.create({
        data: {
          name: 'users:manage',
          resource: 'users',
          action: 'manage'
        }
      }),
      prisma.permission.create({
        data: {
          name: 'letters:read',
          resource: 'letters',
          action: 'read'
        }
      }),
      prisma.permission.create({
        data: {
          name: 'letters:process',
          resource: 'letters',
          action: 'process'
        }
      })
    ])

    // Create roles
    const adminRole = await prisma.userRole.create({
      data: {
        name: 'Admin',
        description: 'Administrator with full access',
        permissions: {
          connect: permissions.map(p => ({ id: p.id }))
        }
      }
    })

    const staffRole = await prisma.userRole.create({
      data: {
        name: 'Staff',
        description: 'Staff with limited access',
        permissions: {
          connect: permissions.slice(0, 4).map(p => ({ id: p.id }))
        }
      }
    })

    console.log('✅ Created roles and permissions')

    // Create test users
    const adminUser = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@test.com',
        name: 'Test Admin',
        password: await hash('admin123', 12),
        roleId: adminRole.id,
        isActive: true
      }
    })

    const staffUser = await prisma.user.create({
      data: {
        username: 'staff',
        email: 'staff@test.com',
        name: 'Test Staff',
        password: await hash('staff123', 12),
        roleId: staffRole.id,
        isActive: true
      }
    })

    console.log('👥 Created test users')

    // Create test families
    const testFamily = await prisma.family.create({
      data: {
        familyNumber: '1234567890123456',
        rt: '001',
        rw: '002',
        address: 'Jl. Test No. 1'
      }
    })

    // Create test citizens
    const testCitizen = await prisma.citizen.create({
      data: {
        nik: '1234567890123456',
        name: 'John Doe Test',
        birthDate: new Date('1990-01-01'),
        birthPlace: 'Jakarta',
        gender: 'L',
        religion: 'ISLAM',
        education: 'S1',
        occupation: 'Software Engineer',
        maritalStatus: 'KAWIN',
        bloodType: 'A',
        familyId: testFamily.id,
        isHeadOfFamily: true,
        rt: '001',
        rw: '002',
        address: 'Jl. Test No. 1'
      }
    })

    console.log('👨‍👩‍👧‍👦 Created test families and citizens')

    // Create test letter requests
    await prisma.letterRequest.create({
      data: {
        citizenId: testCitizen.id,
        letterType: 'DOMICILE',
        purpose: 'Untuk keperluan test E2E',
        status: 'PENDING',
        requestedAt: new Date()
      }
    })

    console.log('📄 Created test letter requests')

    // Store test data in global state for tests
    process.env.TEST_ADMIN_USERNAME = 'admin'
    process.env.TEST_ADMIN_PASSWORD = 'admin123'
    process.env.TEST_STAFF_USERNAME = 'staff'
    process.env.TEST_STAFF_PASSWORD = 'staff123'
    process.env.TEST_CITIZEN_NIK = '1234567890123456'
    process.env.TEST_CITIZEN_NAME = 'John Doe Test'

    console.log('✅ E2E test setup completed successfully')

  } catch (error) {
    console.error('❌ E2E test setup failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }

  // Warm up the application
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    await page.goto(config.projects[0].use?.baseURL || 'http://localhost:3000')
    await page.waitForLoadState('networkidle')
    console.log('🔥 Application warmed up')
  } catch (error) {
    console.warn('⚠️ Could not warm up application:', error)
  } finally {
    await browser.close()
  }
}

export default globalSetup