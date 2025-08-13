#!/usr/bin/env tsx

/**
 * Complete Database Setup Script
 * This script sets up the database with all necessary constraints, indexes, and triggers
 */

import { PrismaClient } from '@prisma/client'
import { createAdditionalIndexes, updateStatistics } from '../src/lib/database/indexes'
import { createDatabaseConstraints, createDatabaseTriggers, validateDataIntegrity } from '../src/lib/database/constraints'

const prisma = new PrismaClient()

async function setupDatabase() {
  console.log('🚀 Starting complete database setup...')

  try {
    // 1. Ensure database connection
    console.log('📡 Testing database connection...')
    await prisma.$connect()
    console.log('✅ Database connection successful')

    // 2. Create additional indexes
    console.log('📊 Creating additional database indexes...')
    await createAdditionalIndexes()

    // 3. Create database constraints
    console.log('🔒 Creating database constraints...')
    await createDatabaseConstraints()

    // 4. Create database triggers
    console.log('⚡ Creating database triggers...')
    await createDatabaseTriggers()

    // 5. Update database statistics
    console.log('📈 Updating database statistics...')
    await updateStatistics()

    // 6. Validate data integrity
    console.log('🔍 Validating data integrity...')
    const issues = await validateDataIntegrity()
    if (issues.length > 0) {
      console.warn('⚠️  Data integrity issues found:')
      issues.forEach(issue => console.warn(`   - ${issue}`))
    } else {
      console.log('✅ Data integrity validation passed')
    }

    // 7. Create initial configuration if not exists
    console.log('⚙️  Creating initial configuration...')
    await createInitialConfiguration()

    console.log('🎉 Database setup completed successfully!')
    
  } catch (error) {
    console.error('❌ Database setup failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

async function createInitialConfiguration() {
  try {
    // Create default village configuration if not exists
    const existingConfig = await prisma.villageConfig.findFirst()
    if (!existingConfig) {
      await prisma.villageConfig.create({
        data: {
          name: 'Desa Contoh',
          code: '1234567890123',
          headName: 'Kepala Desa',
          address: 'Alamat Desa',
          phone: '021-12345678',
          email: 'desa@example.com',
          description: 'Deskripsi desa'
        }
      })
      console.log('✅ Default village configuration created')
    }

    // Create default user roles if not exist
    const roles = [
      { name: 'Super Admin', description: 'Administrator sistem dengan akses penuh' },
      { name: 'Admin Desa', description: 'Administrator desa dengan akses terbatas' },
      { name: 'Operator', description: 'Operator data dengan akses input data' },
      { name: 'Viewer', description: 'Pengguna dengan akses hanya lihat' }
    ]

    for (const role of roles) {
      await prisma.userRole.upsert({
        where: { name: role.name },
        update: {},
        create: role
      })
    }
    console.log('✅ Default user roles created')

    // Create default permissions
    const permissions = [
      // User management
      { name: 'Kelola Pengguna', resource: 'users', action: 'manage' },
      { name: 'Lihat Pengguna', resource: 'users', action: 'read' },
      
      // Citizen management
      { name: 'Kelola Penduduk', resource: 'citizens', action: 'manage' },
      { name: 'Lihat Penduduk', resource: 'citizens', action: 'read' },
      { name: 'Input Penduduk', resource: 'citizens', action: 'create' },
      { name: 'Edit Penduduk', resource: 'citizens', action: 'update' },
      { name: 'Hapus Penduduk', resource: 'citizens', action: 'delete' },
      
      // Letter management
      { name: 'Kelola Surat', resource: 'letters', action: 'manage' },
      { name: 'Proses Surat', resource: 'letters', action: 'process' },
      { name: 'Lihat Surat', resource: 'letters', action: 'read' },
      
      // Financial management
      { name: 'Kelola Keuangan', resource: 'finance', action: 'manage' },
      { name: 'Lihat Keuangan', resource: 'finance', action: 'read' },
      
      // Content management
      { name: 'Kelola Konten', resource: 'content', action: 'manage' },
      { name: 'Lihat Konten', resource: 'content', action: 'read' },
      
      // Reports
      { name: 'Lihat Laporan', resource: 'reports', action: 'read' },
      { name: 'Export Laporan', resource: 'reports', action: 'export' },
      
      // Settings
      { name: 'Kelola Pengaturan', resource: 'settings', action: 'manage' },
      { name: 'Lihat Pengaturan', resource: 'settings', action: 'read' }
    ]

    for (const permission of permissions) {
      await prisma.permission.upsert({
        where: { 
          resource_action: { 
            resource: permission.resource, 
            action: permission.action 
          } 
        },
        update: {},
        create: permission
      })
    }
    console.log('✅ Default permissions created')

    // Create default settings
    const settings = [
      { key: 'app_name', value: 'OpenSID', type: 'STRING' as const, category: 'general', description: 'Nama aplikasi' },
      { key: 'app_version', value: '2.0.0', type: 'STRING' as const, category: 'general', description: 'Versi aplikasi' },
      { key: 'timezone', value: 'Asia/Jakarta', type: 'STRING' as const, category: 'general', description: 'Zona waktu' },
      { key: 'date_format', value: 'DD/MM/YYYY', type: 'STRING' as const, category: 'general', description: 'Format tanggal' },
      { key: 'items_per_page', value: '25', type: 'NUMBER' as const, category: 'display', description: 'Jumlah item per halaman' },
      { key: 'enable_registration', value: 'false', type: 'BOOLEAN' as const, category: 'security', description: 'Izinkan registrasi publik' },
      { key: 'session_timeout', value: '3600', type: 'NUMBER' as const, category: 'security', description: 'Timeout sesi (detik)' },
      { key: 'backup_enabled', value: 'true', type: 'BOOLEAN' as const, category: 'system', description: 'Aktifkan backup otomatis' },
      { key: 'backup_frequency', value: 'daily', type: 'STRING' as const, category: 'system', description: 'Frekuensi backup' }
    ]

    for (const setting of settings) {
      await prisma.setting.upsert({
        where: { key: setting.key },
        update: {},
        create: setting
      })
    }
    console.log('✅ Default settings created')

  } catch (error) {
    console.error('❌ Error creating initial configuration:', error)
    throw error
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  setupDatabase()
}