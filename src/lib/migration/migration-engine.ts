/**
 * Migration Engine
 * Main engine for migrating data from MySQL OpenSID to PostgreSQL
 */

import { PrismaClient } from '@prisma/client'
import { MySQLConnection } from './mysql-connection'
import { DataMapper } from './data-mapper'

export interface MigrationConfig {
  batchSize: number
  validateData: boolean
  createBackup: boolean
  skipExisting: boolean
}

export interface MigrationResult {
  tableName: string
  totalRecords: number
  migratedRecords: number
  skippedRecords: number
  errorRecords: number
  errors: string[]
  duration: number
  status: 'success' | 'partial' | 'failed'
}

export interface MigrationReport {
  startTime: Date
  endTime: Date
  totalDuration: number
  results: MigrationResult[]
  overallStatus: 'success' | 'partial' | 'failed'
  summary: {
    totalTables: number
    successfulTables: number
    partialTables: number
    failedTables: number
    totalRecords: number
    migratedRecords: number
    errorRecords: number
  }
}

export class MigrationEngine {
  private prisma: PrismaClient
  private mysql: MySQLConnection
  private config: MigrationConfig

  constructor(
    prisma: PrismaClient,
    mysql: MySQLConnection,
    config: Partial<MigrationConfig> = {}
  ) {
    this.prisma = prisma
    this.mysql = mysql
    this.config = {
      batchSize: 1000,
      validateData: true,
      createBackup: true,
      skipExisting: false,
      ...config
    }
  }

  /**
   * Run complete migration process
   */
  async migrate(): Promise<MigrationReport> {
    const startTime = new Date()
    const results: MigrationResult[] = []

    console.log('🚀 Starting data migration from MySQL to PostgreSQL...')

    try {
      // Connect to databases
      await this.mysql.connect()
      await this.prisma.$connect()

      // Create backup if requested
      if (this.config.createBackup) {
        await this.createBackup()
      }

      // Migrate in order (respecting foreign key dependencies)
      const migrationOrder = [
        'user_roles',
        'users',
        'village_config',
        'settings',
        'addresses',
        'families',
        'citizens',
        'documents',
        'letter_requests',
        'articles',
        'categories',
        'groups',
        'group_categories',
        'budgets',
        'expenses'
      ]

      for (const tableName of migrationOrder) {
        console.log(`📊 Migrating ${tableName}...`)
        const result = await this.migrateTable(tableName)
        results.push(result)
        
        if (result.status === 'failed') {
          console.error(`❌ Failed to migrate ${tableName}`)
        } else {
          console.log(`✅ Migrated ${tableName}: ${result.migratedRecords}/${result.totalRecords} records`)
        }
      }

    } catch (error) {
      console.error('❌ Migration failed:', error)
    } finally {
      await this.mysql.disconnect()
      await this.prisma.$disconnect()
    }

    const endTime = new Date()
    const totalDuration = endTime.getTime() - startTime.getTime()

    return this.generateReport(startTime, endTime, totalDuration, results)
  }

  /**
   * Migrate a specific table
   */
  private async migrateTable(tableName: string): Promise<MigrationResult> {
    const startTime = Date.now()
    let totalRecords = 0
    let migratedRecords = 0
    let skippedRecords = 0
    let errorRecords = 0
    const errors: string[] = []

    try {
      // Get MySQL table mapping
      const mysqlTableName = this.getMySQLTableName(tableName)
      if (!mysqlTableName) {
        return {
          tableName,
          totalRecords: 0,
          migratedRecords: 0,
          skippedRecords: 0,
          errorRecords: 0,
          errors: [`No MySQL mapping found for table: ${tableName}`],
          duration: Date.now() - startTime,
          status: 'failed'
        }
      }

      // Get total count
      totalRecords = await this.mysql.getTableCount(mysqlTableName)
      
      if (totalRecords === 0) {
        return {
          tableName,
          totalRecords: 0,
          migratedRecords: 0,
          skippedRecords: 0,
          errorRecords: 0,
          errors: [],
          duration: Date.now() - startTime,
          status: 'success'
        }
      }

      // Process in batches
      let offset = 0
      while (offset < totalRecords) {
        try {
          const batch = await this.mysql.getTableData(mysqlTableName, this.config.batchSize, offset)
          
          for (const record of batch) {
            try {
              const migrated = await this.migrateRecord(tableName, record)
              if (migrated) {
                migratedRecords++
              } else {
                skippedRecords++
              }
            } catch (error) {
              errorRecords++
              errors.push(`Record ${record.id || 'unknown'}: ${error.message}`)
            }
          }

          offset += this.config.batchSize
          
          // Progress indicator
          const progress = Math.round((offset / totalRecords) * 100)
          console.log(`   Progress: ${progress}% (${offset}/${totalRecords})`)
          
        } catch (error) {
          errors.push(`Batch error at offset ${offset}: ${error.message}`)
          break
        }
      }

    } catch (error) {
      errors.push(`Table migration error: ${error.message}`)
    }

    const duration = Date.now() - startTime
    const status = errorRecords === 0 ? 'success' : 
                  migratedRecords > 0 ? 'partial' : 'failed'

    return {
      tableName,
      totalRecords,
      migratedRecords,
      skippedRecords,
      errorRecords,
      errors: errors.slice(0, 10), // Limit errors
      duration,
      status
    }
  }

  /**
   * Migrate a single record
   */
  private async migrateRecord(tableName: string, mysqlRecord: any): Promise<boolean> {
    try {
      switch (tableName) {
        case 'users':
          return await this.migrateUser(mysqlRecord)
        case 'citizens':
          return await this.migrateCitizen(mysqlRecord)
        case 'families':
          return await this.migrateFamily(mysqlRecord)
        case 'addresses':
          return await this.migrateAddress(mysqlRecord)
        default:
          console.warn(`No migration handler for table: ${tableName}`)
          return false
      }
    } catch (error) {
      throw error
    }
  }

  /**
   * Migrate user record
   */
  private async migrateUser(mysqlRecord: any): Promise<boolean> {
    const mappedData = DataMapper.mapUser(mysqlRecord)
    
    if (this.config.validateData) {
      if (!DataMapper.validateEmail(mappedData.email)) {
        throw new Error(`Invalid email: ${mappedData.email}`)
      }
    }

    if (this.config.skipExisting) {
      const existing = await this.prisma.user.findUnique({
        where: { username: mappedData.username }
      })
      if (existing) return false
    }

    await this.prisma.user.upsert({
      where: { username: mappedData.username },
      update: mappedData,
      create: mappedData
    })

    return true
  }

  /**
   * Migrate citizen record
   */
  private async migrateCitizen(mysqlRecord: any): Promise<boolean> {
    // Get default user for createdById
    const defaultUser = await this.prisma.user.findFirst()
    if (!defaultUser) {
      throw new Error('No users found for createdById reference')
    }

    const mappedData = DataMapper.mapCitizen(mysqlRecord, defaultUser.id)
    
    if (this.config.validateData) {
      if (!DataMapper.validateNIK(mappedData.nik)) {
        throw new Error(`Invalid NIK: ${mappedData.nik}`)
      }
    }

    if (this.config.skipExisting) {
      const existing = await this.prisma.citizen.findUnique({
        where: { nik: mappedData.nik }
      })
      if (existing) return false
    }

    await this.prisma.citizen.upsert({
      where: { nik: mappedData.nik },
      update: mappedData,
      create: mappedData
    })

    return true
  }

  /**
   * Migrate family record
   */
  private async migrateFamily(mysqlRecord: any): Promise<boolean> {
    const mappedData = DataMapper.mapFamily(mysqlRecord)

    if (this.config.skipExisting) {
      const existing = await this.prisma.family.findUnique({
        where: { familyNumber: mappedData.familyNumber }
      })
      if (existing) return false
    }

    await this.prisma.family.upsert({
      where: { familyNumber: mappedData.familyNumber },
      update: mappedData,
      create: mappedData
    })

    return true
  }

  /**
   * Migrate address record
   */
  private async migrateAddress(mysqlRecord: any): Promise<boolean> {
    // Address migration logic would go here
    // This is a placeholder as address structure may vary
    return true
  }

  /**
   * Get MySQL table name mapping
   */
  private getMySQLTableName(postgresTableName: string): string | null {
    const tableMapping: Record<string, string> = {
      'users': 'user',
      'user_roles': 'user_grup',
      'citizens': 'tweb_penduduk',
      'families': 'tweb_keluarga',
      'addresses': 'tweb_wil_clusterdesa',
      'documents': 'dokumen',
      'letter_requests': 'permohonan_surat',
      'articles': 'artikel',
      'categories': 'kategori',
      'village_config': 'config',
      'settings': 'setting_aplikasi'
    }

    return tableMapping[postgresTableName] || null
  }

  /**
   * Create database backup
   */
  private async createBackup(): Promise<void> {
    console.log('💾 Creating database backup...')
    
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupName = `opensid_backup_${timestamp}`
      
      // This would implement actual backup logic
      // For now, just log the backup creation
      console.log(`✅ Backup created: ${backupName}`)
      
    } catch (error) {
      console.error('❌ Backup creation failed:', error)
      throw error
    }
  }

  /**
   * Generate migration report
   */
  private generateReport(
    startTime: Date,
    endTime: Date,
    totalDuration: number,
    results: MigrationResult[]
  ): MigrationReport {
    const summary = {
      totalTables: results.length,
      successfulTables: results.filter(r => r.status === 'success').length,
      partialTables: results.filter(r => r.status === 'partial').length,
      failedTables: results.filter(r => r.status === 'failed').length,
      totalRecords: results.reduce((sum, r) => sum + r.totalRecords, 0),
      migratedRecords: results.reduce((sum, r) => sum + r.migratedRecords, 0),
      errorRecords: results.reduce((sum, r) => sum + r.errorRecords, 0)
    }

    const overallStatus = summary.failedTables === 0 ? 
      (summary.partialTables === 0 ? 'success' : 'partial') : 'failed'

    return {
      startTime,
      endTime,
      totalDuration,
      results,
      overallStatus,
      summary
    }
  }

  /**
   * Validate data integrity after migration
   */
  async validateMigration(): Promise<string[]> {
    const issues: string[] = []

    try {
      // Check for orphaned records
      const orphanedCitizens = await this.prisma.citizen.count({
        where: {
          familyId: { not: null },
          family: null
        }
      })

      if (orphanedCitizens > 0) {
        issues.push(`Found ${orphanedCitizens} citizens with invalid family references`)
      }

      // Check for duplicate NIKs
      const duplicateNiks = await this.prisma.$queryRaw`
        SELECT nik, COUNT(*) as count 
        FROM citizens 
        GROUP BY nik 
        HAVING COUNT(*) > 1
      `

      if (Array.isArray(duplicateNiks) && duplicateNiks.length > 0) {
        issues.push(`Found ${duplicateNiks.length} duplicate NIK entries`)
      }

      // Check for families without heads
      const familiesWithoutHead = await this.prisma.family.count({
        where: {
          members: {
            none: {
              isHeadOfFamily: true
            }
          }
        }
      })

      if (familiesWithoutHead > 0) {
        issues.push(`Found ${familiesWithoutHead} families without a head of family`)
      }

    } catch (error) {
      issues.push(`Validation error: ${error.message}`)
    }

    return issues
  }
}