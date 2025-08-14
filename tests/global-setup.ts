/**
 * Global Test Setup
 * Setup for E2E tests including database seeding
 */

import { chromium, FullConfig } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up E2E test environment...')

  const prisma = new PrismaClient()

  try {
    // Clean up existing test data
    await prisma.citizen.deleteMany({
      where: {
        nik: {
          startsWith: '9999' // Test NIKs start with 9999
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

    // Create test users
    const hashedPassword = await hash('admin123', 12)
    
    await prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        password: hashedPassword,
        name: 'Test Admin',
        email: 'admin@test.com',
        role: 'Super Admin',
        isActive: true
      }
    })

    // Create test families
    const testFamily = await prisma.family.upsert({
      where: { familyNumber: '9999000000000001' },
      update: {},
      create: {
        familyNumber: '9999000000000001',
        headNIK: '9999000000000001',
        registrationDate: new Date(),
        isActive: true
      }
    })

    // Create test citizens
    await prisma.citizen.upsert({
      where: { nik: '9999000000000001' },
      update: {},
      create: {
        nik: '9999000000000001',
        name: 'Ahmad Test',
        familyId: testFamily.id,
        familyRole: 'KEPALA_KELUARGA',
        gender: 'L',
        birthPlace: 'Jakarta',
        birthDate: new Date('1985-01-01'),
        religion: 'ISLAM',
        education: 'SMA',
        occupation: 'Wiraswasta',
        maritalStatus: 'KAWIN',
        nationality: 'WNI',
        isActive: true
      }
    })

    await prisma.citizen.upsert({
      where: { nik: '9999000000000002' },
      update: {},
      create: {
        nik: '9999000000000002',
        name: 'Siti Test',
        familyId: testFamily.id,
        familyRole: 'ISTRI',
        gender: 'P',
        birthPlace: 'Bandung',
        birthDate: new Date('1990-01-01'),
        religion: 'ISLAM',
        education: 'S1',
        occupation: 'Guru',
        maritalStatus: 'KAWIN',
        nationality: 'WNI',
        isActive: true
      }
    })

    // Create test addresses
    await prisma.address.upsert({
      where: { id: 'test-address-1' },
      update: {},
      create: {
        id: 'test-address-1',
        street: 'Jl. Test No. 123',
        rt: '001',
        rw: '002',
        village: 'Test Village',
        district: 'Test District',
        regency: 'Test Regency',
        province: 'Test Province',
        postalCode: '12345',
        isActive: true
      }
    })

    console.log('✅ Test data seeded successfully')

    // Warm up the application
    const browser = await chromium.launch()
    const page = await browser.newPage()
    
    try {
      await page.goto(config.projects[0].use?.baseURL || 'http://localhost:3000')
      await page.waitForLoadState('networkidle')
      console.log('✅ Application warmed up')
    } catch (error) {
      console.warn('⚠️  Could not warm up application:', error)
    } finally {
      await browser.close()
    }

  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }

  console.log('🎉 E2E test environment ready!')
}

export default globalSetup
