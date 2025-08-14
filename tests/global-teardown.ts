/**
 * Global Test Teardown
 * Cleanup after E2E tests
 */

import { FullConfig } from '@playwright/test'
import { PrismaClient } from '@prisma/client'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up E2E test environment...')

  const prisma = new PrismaClient()

  try {
    // Clean up test data
    await prisma.citizen.deleteMany({
      where: {
        nik: {
          startsWith: '9999' // Test NIKs start with 9999
        }
      }
    })

    await prisma.family.deleteMany({
      where: {
        familyNumber: {
          startsWith: '9999'
        }
      }
    })

    await prisma.address.deleteMany({
      where: {
        id: {
          startsWith: 'test-'
        }
      }
    })

    await prisma.user.deleteMany({
      where: {
        username: {
          startsWith: 'test_'
        }
      }
    })

    // Clean up any generated documents
    await prisma.document.deleteMany({
      where: {
        purpose: {
          contains: 'test'
        }
      }
    })

    console.log('✅ Test data cleaned up successfully')

  } catch (error) {
    console.error('❌ Global teardown failed:', error)
    // Don't throw here as it might prevent other cleanup
  } finally {
    await prisma.$disconnect()
  }

  console.log('🎉 E2E test environment cleaned up!')
}

export default globalTeardown
