/**
 * MySQL to PostgreSQL Migration
 * Migrates data from OpenSID MySQL database to new PostgreSQL schema
 */

import mysql from 'mysql2/promise'
import { PrismaClient } from '@prisma/client'
import { createHash } from 'crypto'

export interface MigrationConfig {
  mysql: {
    host: string
    port: number
    user: string
    password: string
    database: string
  }
  batchSize?: number
  skipExisting?: boolean
  validateData?: boolean
}

export interface MigrationResult {
  table: string
  totalRecords: number
  migratedRecords: number
  skippedRecords: number
  errorRecords: number
  errors: string[]
  duration: number
}

export class MySQLToPostgresMigrator {
  private mysqlConnection: mysql.Connection | null = null
  private prisma: PrismaClient
  private config: MigrationConfig

  constructor(config: MigrationConfig) {
    this.config = {
      batchSize: 1000,
      skipExisting: true,
      validateData: true,
      ...config
    }
    this.prisma = new PrismaClient()
  }

  async connect(): Promise<void> {
    try {
      this.mysqlConnection = await mysql.createConnection(this.config.mysql)
      console.log('Connected to MySQL database')
    } catch (error) {
      console.error('Failed to connect to MySQL:', error)
      throw error
    }
  }

  async disconnect(): Promise<void> {
    if (this.mysqlConnection) {
      await this.mysqlConnection.end()
      console.log('Disconnected from MySQL')
    }
    await this.prisma.$disconnect()
    console.log('Disconnected from PostgreSQL')
  }

  /**
   * Migrate all data
   */
  async migrateAll(): Promise<MigrationResult[]> {
    const results: MigrationResult[] = []

    try {
      await this.connect()

      // Migration order is important due to foreign key constraints
      const migrations = [
        () => this.migrateUsers(),
        () => this.migrateWilayah(),
        () => this.migrateKeluarga(),
        () => this.migratePenduduk(),
        () => this.migrateSettings(),
        () => this.migrateDokumen(),
        () => this.migrateLogLogin()
      ]

      for (const migration of migrations) {
        const result = await migration()
        results.push(result)
        console.log(`Completed migration: ${result.table}`)
      }

      return results
    } finally {
      await this.disconnect()
    }
  }

  /**
   * Migrate users (tweb_user -> User)
   */
  async migrateUsers(): Promise<MigrationResult> {
    const startTime = Date.now()
    const result: MigrationResult = {
      table: 'users',
      totalRecords: 0,
      migratedRecords: 0,
      skippedRecords: 0,
      errorRecords: 0,
      errors: [],
      duration: 0
    }

    try {
      if (!this.mysqlConnection) throw new Error('MySQL connection not established')

      // Get total count
      const [countRows] = await this.mysqlConnection.execute(
        'SELECT COUNT(*) as total FROM user'
      ) as any[]
      result.totalRecords = countRows[0].total

      // Get users data
      const [rows] = await this.mysqlConnection.execute(`
        SELECT 
          id,
          username,
          password,
          nama,
          email,
          last_login,
          active,
          id_grup,
          created_at,
          updated_at
        FROM user 
        ORDER BY id
      `) as any[]

      for (const row of rows) {
        try {
          // Check if user already exists
          if (this.config.skipExisting) {
            const existing = await this.prisma.user.findUnique({
              where: { username: row.username }
            })
            if (existing) {
              result.skippedRecords++
              continue
            }
          }

          // Map role from id_grup
          const role = this.mapUserRole(row.id_grup)

          await this.prisma.user.create({
            data: {
              username: row.username,
              password: row.password, // Already hashed in OpenSID
              name: row.nama,
              email: row.email || `${row.username}@example.com`,
              role: role,
              isActive: row.active === 1,
              lastLogin: row.last_login ? new Date(row.last_login) : null,
              createdAt: row.created_at ? new Date(row.created_at) : new Date(),
              updatedAt: row.updated_at ? new Date(row.updated_at) : new Date()
            }
          })

          result.migratedRecords++
        } catch (error) {
          result.errorRecords++
          result.errors.push(`User ${row.username}: ${error}`)
        }
      }

    } catch (error) {
      result.errors.push(`Migration error: ${error}`)
    }

    result.duration = Date.now() - startTime
    return result
  }

  /**
   * Migrate penduduk (tweb_penduduk -> Citizen)
   */
  async migratePenduduk(): Promise<MigrationResult> {
    const startTime = Date.now()
    const result: MigrationResult = {
      table: 'citizens',
      totalRecords: 0,
      migratedRecords: 0,
      skippedRecords: 0,
      errorRecords: 0,
      errors: [],
      duration: 0
    }

    try {
      if (!this.mysqlConnection) throw new Error('MySQL connection not established')

      // Get total count
      const [countRows] = await this.mysqlConnection.execute(
        'SELECT COUNT(*) as total FROM tweb_penduduk'
      ) as any[]
      result.totalRecords = countRows[0].total

      // Process in batches
      let offset = 0
      const batchSize = this.config.batchSize || 1000

      while (offset < result.totalRecords) {
        const [rows] = await this.mysqlConnection.execute(`
          SELECT 
            id,
            nama,
            nik,
            id_kk,
            kk_level,
            sex,
            tempatlahir,
            tanggallahir,
            agama_id,
            pendidikan_kk_id,
            pekerjaan_id,
            status_kawin,
            warganegara_id,
            nama_ayah,
            nama_ibu,
            golongan_darah_id,
            id_cluster,
            status,
            alamat_sekarang,
            status_dasar,
            telepon,
            email,
            foto,
            created_at,
            updated_at
          FROM tweb_penduduk 
          ORDER BY id
          LIMIT ? OFFSET ?
        `, [batchSize, offset]) as any[]

        for (const row of rows) {
          try {
            // Check if citizen already exists
            if (this.config.skipExisting) {
              const existing = await this.prisma.citizen.findUnique({
                where: { nik: row.nik }
              })
              if (existing) {
                result.skippedRecords++
                continue
              }
            }

            // Get family ID
            const familyId = await this.getFamilyId(row.id_kk)

            await this.prisma.citizen.create({
              data: {
                nik: row.nik,
                name: row.nama,
                familyId: familyId,
                familyRole: this.mapFamilyRole(row.kk_level),
                gender: row.sex === 1 ? 'L' : 'P',
                birthPlace: row.tempatlahir,
                birthDate: new Date(row.tanggallahir),
                religion: this.mapReligion(row.agama_id),
                education: this.mapEducation(row.pendidikan_kk_id),
                occupation: await this.getOccupationName(row.pekerjaan_id),
                maritalStatus: this.mapMaritalStatus(row.status_kawin),
                nationality: this.mapNationality(row.warganegara_id),
                fatherName: row.nama_ayah,
                motherName: row.nama_ibu,
                bloodType: this.mapBloodType(row.golongan_darah_id),
                phone: row.telepon,
                email: row.email,
                photo: row.foto,
                isActive: row.status_dasar === 1,
                createdAt: row.created_at ? new Date(row.created_at) : new Date(),
                updatedAt: row.updated_at ? new Date(row.updated_at) : new Date()
              }
            })

            result.migratedRecords++
          } catch (error) {
            result.errorRecords++
            result.errors.push(`Citizen ${row.nik}: ${error}`)
          }
        }

        offset += batchSize
        console.log(`Processed ${Math.min(offset, result.totalRecords)}/${result.totalRecords} citizens`)
      }

    } catch (error) {
      result.errors.push(`Migration error: ${error}`)
    }

    result.duration = Date.now() - startTime
    return result
  }

  /**
   * Migrate keluarga (tweb_keluarga -> Family)
   */
  async migrateKeluarga(): Promise<MigrationResult> {
    const startTime = Date.now()
    const result: MigrationResult = {
      table: 'families',
      totalRecords: 0,
      migratedRecords: 0,
      skippedRecords: 0,
      errorRecords: 0,
      errors: [],
      duration: 0
    }

    try {
      if (!this.mysqlConnection) throw new Error('MySQL connection not established')

      const [countRows] = await this.mysqlConnection.execute(
        'SELECT COUNT(*) as total FROM tweb_keluarga'
      ) as any[]
      result.totalRecords = countRows[0].total

      const [rows] = await this.mysqlConnection.execute(`
        SELECT 
          id,
          no_kk,
          nik_kepala,
          tgl_daftar,
          tgl_cetak_kk,
          alamat,
          id_cluster,
          created_at,
          updated_at
        FROM tweb_keluarga 
        ORDER BY id
      `) as any[]

      for (const row of rows) {
        try {
          if (this.config.skipExisting) {
            const existing = await this.prisma.family.findUnique({
              where: { familyNumber: row.no_kk }
            })
            if (existing) {
              result.skippedRecords++
              continue
            }
          }

          await this.prisma.family.create({
            data: {
              familyNumber: row.no_kk,
              headNIK: row.nik_kepala,
              registrationDate: row.tgl_daftar ? new Date(row.tgl_daftar) : new Date(),
              printDate: row.tgl_cetak_kk ? new Date(row.tgl_cetak_kk) : null,
              isActive: true,
              createdAt: row.created_at ? new Date(row.created_at) : new Date(),
              updatedAt: row.updated_at ? new Date(row.updated_at) : new Date()
            }
          })

          result.migratedRecords++
        } catch (error) {
          result.errorRecords++
          result.errors.push(`Family ${row.no_kk}: ${error}`)
        }
      }

    } catch (error) {
      result.errors.push(`Migration error: ${error}`)
    }

    result.duration = Date.now() - startTime
    return result
  }

  // Helper methods for mapping data
  private mapUserRole(grupId: number): string {
    const roleMap: Record<number, string> = {
      1: 'Super Admin',
      2: 'Admin',
      3: 'Operator',
      4: 'User'
    }
    return roleMap[grupId] || 'User'
  }

  private mapFamilyRole(kkLevel: number): string {
    const roleMap: Record<number, string> = {
      1: 'KEPALA_KELUARGA',
      2: 'SUAMI',
      3: 'ISTRI',
      4: 'ANAK',
      5: 'MENANTU',
      6: 'CUCU',
      7: 'ORANGTUA',
      8: 'MERTUA',
      9: 'FAMILI_LAIN',
      10: 'PEMBANTU',
      11: 'LAINNYA'
    }
    return roleMap[kkLevel] || 'LAINNYA'
  }

  private mapReligion(agamaId: number): string {
    const religionMap: Record<number, string> = {
      1: 'ISLAM',
      2: 'KRISTEN',
      3: 'KATOLIK',
      4: 'HINDU',
      5: 'BUDDHA',
      6: 'KONGHUCU',
      7: 'KEPERCAYAAN'
    }
    return religionMap[agamaId] || 'ISLAM'
  }

  private mapEducation(pendidikanId: number): string {
    const educationMap: Record<number, string> = {
      1: 'TIDAK_SEKOLAH',
      2: 'BELUM_SEKOLAH',
      3: 'TIDAK_TAMAT_SD',
      4: 'SD',
      5: 'SMP',
      6: 'SMA',
      7: 'D1',
      8: 'D2',
      9: 'D3',
      10: 'S1',
      11: 'S2',
      12: 'S3'
    }
    return educationMap[pendidikanId] || 'SD'
  }

  private mapMaritalStatus(statusKawin: number): string {
    const statusMap: Record<number, string> = {
      1: 'BELUM_KAWIN',
      2: 'KAWIN',
      3: 'CERAI_HIDUP',
      4: 'CERAI_MATI'
    }
    return statusMap[statusKawin] || 'BELUM_KAWIN'
  }

  private mapNationality(warganegaraId: number): string {
    return warganegaraId === 1 ? 'WNI' : 'WNA'
  }

  private mapBloodType(golonganDarahId: number): string {
    const bloodTypeMap: Record<number, string> = {
      1: 'A',
      2: 'B',
      3: 'AB',
      4: 'O',
      13: 'A+',
      14: 'A-',
      15: 'B+',
      16: 'B-',
      17: 'AB+',
      18: 'AB-',
      19: 'O+',
      20: 'O-'
    }
    return bloodTypeMap[golonganDarahId] || 'O'
  }

  private async getFamilyId(kkId: number): Promise<string | null> {
    if (!kkId) return null

    try {
      const family = await this.prisma.family.findFirst({
        where: {
          // We'll need to map this based on the family migration
          id: kkId.toString()
        }
      })
      return family?.id || null
    } catch {
      return null
    }
  }

  private async getOccupationName(pekerjaanId: number): Promise<string> {
    if (!pekerjaanId || !this.mysqlConnection) return 'Tidak Bekerja'

    try {
      const [rows] = await this.mysqlConnection.execute(
        'SELECT nama FROM tweb_penduduk_pekerjaan WHERE id = ?',
        [pekerjaanId]
      ) as any[]

      return rows[0]?.nama || 'Tidak Bekerja'
    } catch {
      return 'Tidak Bekerja'
    }
  }

  /**
   * Migrate settings (config -> Settings)
   */
  async migrateSettings(): Promise<MigrationResult> {
    const startTime = Date.now()
    const result: MigrationResult = {
      table: 'settings',
      totalRecords: 0,
      migratedRecords: 0,
      skippedRecords: 0,
      errorRecords: 0,
      errors: [],
      duration: 0
    }

    try {
      if (!this.mysqlConnection) throw new Error('MySQL connection not established')

      const [countRows] = await this.mysqlConnection.execute(
        'SELECT COUNT(*) as total FROM config'
      ) as any[]
      result.totalRecords = countRows[0].total

      const [rows] = await this.mysqlConnection.execute(`
        SELECT 
          key,
          value,
          keterangan,
          jenis,
          kategori
        FROM config 
        ORDER BY id
      `) as any[]

      for (const row of rows) {
        try {
          if (this.config.skipExisting) {
            const existing = await this.prisma.setting.findUnique({
              where: { key: row.key }
            })
            if (existing) {
              result.skippedRecords++
              continue
            }
          }

          await this.prisma.setting.create({
            data: {
              key: row.key,
              value: row.value || '',
              description: row.keterangan,
              type: this.mapSettingType(row.jenis),
              category: row.kategori || 'general',
              isPublic: false
            }
          })

          result.migratedRecords++
        } catch (error) {
          result.errorRecords++
          result.errors.push(`Setting ${row.key}: ${error}`)
        }
      }

    } catch (error) {
      result.errors.push(`Migration error: ${error}`)
    }

    result.duration = Date.now() - startTime
    return result
  }

  private mapSettingType(jenis: string): string {
    const typeMap: Record<string, string> = {
      'text': 'STRING',
      'textarea': 'TEXT',
      'number': 'NUMBER',
      'boolean': 'BOOLEAN',
      'option': 'SELECT',
      'upload': 'FILE'
    }
    return typeMap[jenis] || 'STRING'
  }

  /**
   * Validate migrated data
   */
  async validateMigration(): Promise<{
    isValid: boolean
    issues: string[]
    summary: Record<string, number>
  }> {
    const issues: string[] = []
    const summary: Record<string, number> = {}

    try {
      // Count records in each table
      summary.users = await this.prisma.user.count()
      summary.families = await this.prisma.family.count()
      summary.citizens = await this.prisma.citizen.count()
      summary.settings = await this.prisma.setting.count()

      // Validate data integrity
      const orphanedCitizens = await this.prisma.citizen.count({
        where: {
          familyId: { not: null },
          family: null
        }
      })

      if (orphanedCitizens > 0) {
        issues.push(`${orphanedCitizens} citizens have invalid family references`)
      }

      // Check for duplicate NIKs
      const duplicateNIKs = await this.prisma.citizen.groupBy({
        by: ['nik'],
        having: {
          nik: {
            _count: {
              gt: 1
            }
          }
        }
      })

      if (duplicateNIKs.length > 0) {
        issues.push(`${duplicateNIKs.length} duplicate NIKs found`)
      }

      return {
        isValid: issues.length === 0,
        issues,
        summary
      }

    } catch (error) {
      issues.push(`Validation error: ${error}`)
      return {
        isValid: false,
        issues,
        summary
      }
    }
  }

  // Additional migration methods would be implemented here...
  async migrateWilayah(): Promise<MigrationResult> {
    // Implementation for migrating wilayah/address data
    return {
      table: 'addresses',
      totalRecords: 0,
      migratedRecords: 0,
      skippedRecords: 0,
      errorRecords: 0,
      errors: [],
      duration: 0
    }
  }

  async migrateDokumen(): Promise<MigrationResult> {
    // Implementation for migrating documents
    return {
      table: 'documents',
      totalRecords: 0,
      migratedRecords: 0,
      skippedRecords: 0,
      errorRecords: 0,
      errors: [],
      duration: 0
    }
  }

  async migrateLogLogin(): Promise<MigrationResult> {
    // Implementation for migrating login logs
    return {
      table: 'login_logs',
      totalRecords: 0,
      migratedRecords: 0,
      skippedRecords: 0,
      errorRecords: 0,
      errors: [],
      duration: 0
    }
  }
}
