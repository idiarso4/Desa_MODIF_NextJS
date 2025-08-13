/**
 * Backup and Rollback Manager
 * Handles database backup and rollback operations for safe migration
 */

import { PrismaClient } from '@prisma/client'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

export interface BackupInfo {
  id: string
  filename: string
  filepath: string
  size: number
  createdAt: Date
  tables: string[]
  recordCounts: Record<string, number>
  checksum: string
}

export class BackupManager {
  private prisma: PrismaClient
  private backupDir: string

  constructor(prisma: PrismaClient, backupDir: string = './backups') {
    this.prisma = prisma
    this.backupDir = backupDir
  }

  /**
   * Create a full database backup
   */
  async createBackup(description?: string): Promise<BackupInfo> {
    console.log('💾 Creating database backup...')

    try {
      // Ensure backup directory exists
      await fs.mkdir(this.backupDir, { recursive: true })

      // Generate backup info
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupId = `backup_${timestamp}`
      const filename = `${backupId}.sql`
      const filepath = path.join(this.backupDir, filename)

      // Get database URL
      const databaseUrl = process.env.DATABASE_URL
      if (!databaseUrl) {
        throw new Error('DATABASE_URL environment variable not set')
      }

      // Parse database URL
      const dbUrl = new URL(databaseUrl)
      const dbName = dbUrl.pathname.slice(1)
      const host = dbUrl.hostname
      const port = dbUrl.port || '5432'
      const username = dbUrl.username
      const password = dbUrl.password

      // Create pg_dump command
      const dumpCommand = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${username} -d ${dbName} --no-owner --no-privileges --clean --if-exists > "${filepath}"`

      // Execute backup
      console.log('   Executing pg_dump...')
      await execAsync(dumpCommand)

      // Get file size
      const stats = await fs.stat(filepath)
      const size = stats.size

      // Get table information
      const tables = await this.getTableNames()
      const recordCounts = await this.getRecordCounts(tables)

      // Calculate checksum
      const checksum = await this.calculateChecksum(filepath)

      // Create backup info
      const backupInfo: BackupInfo = {
        id: backupId,
        filename,
        filepath,
        size,
        createdAt: new Date(),
        tables,
        recordCounts,
        checksum
      }

      // Save backup metadata
      await this.saveBackupMetadata(backupInfo, description)

      // Log backup to database
      await this.logBackup(backupInfo, description)

      console.log(`✅ Backup created successfully: ${filename} (${this.formatFileSize(size)})`)
      return backupInfo

    } catch (error) {
      console.error('❌ Backup creation failed:', error)
      throw error
    }
  }

  /**
   * Restore database from backup
   */
  async restoreBackup(backupId: string): Promise<void> {
    console.log(`🔄 Restoring backup: ${backupId}`)

    try {
      // Find backup file
      const backupInfo = await this.getBackupInfo(backupId)
      if (!backupInfo) {
        throw new Error(`Backup not found: ${backupId}`)
      }

      // Verify backup file exists
      try {
        await fs.access(backupInfo.filepath)
      } catch {
        throw new Error(`Backup file not found: ${backupInfo.filepath}`)
      }

      // Verify checksum
      const currentChecksum = await this.calculateChecksum(backupInfo.filepath)
      if (currentChecksum !== backupInfo.checksum) {
        throw new Error('Backup file checksum mismatch - file may be corrupted')
      }

      // Get database connection info
      const databaseUrl = process.env.DATABASE_URL
      if (!databaseUrl) {
        throw new Error('DATABASE_URL environment variable not set')
      }

      const dbUrl = new URL(databaseUrl)
      const dbName = dbUrl.pathname.slice(1)
      const host = dbUrl.hostname
      const port = dbUrl.port || '5432'
      const username = dbUrl.username
      const password = dbUrl.password

      // Create restore command
      const restoreCommand = `PGPASSWORD="${password}" psql -h ${host} -p ${port} -U ${username} -d ${dbName} < "${backupInfo.filepath}"`

      // Execute restore
      console.log('   Executing restore...')
      await execAsync(restoreCommand)

      // Verify restore
      await this.verifyRestore(backupInfo)

      console.log('✅ Backup restored successfully')

    } catch (error) {
      console.error('❌ Backup restore failed:', error)
      throw error
    }
  }

  /**
   * List available backups
   */
  async listBackups(): Promise<BackupInfo[]> {
    try {
      const backups: BackupInfo[] = []
      
      // Read backup directory
      const files = await fs.readdir(this.backupDir)
      const metadataFiles = files.filter(f => f.endsWith('.metadata.json'))

      for (const metadataFile of metadataFiles) {
        try {
          const metadataPath = path.join(this.backupDir, metadataFile)
          const metadata = await fs.readFile(metadataPath, 'utf-8')
          const backupInfo = JSON.parse(metadata)
          backups.push(backupInfo)
        } catch (error) {
          console.warn(`Failed to read backup metadata: ${metadataFile}`)
        }
      }

      // Sort by creation date (newest first)
      backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      return backups

    } catch (error) {
      console.error('❌ Failed to list backups:', error)
      return []
    }
  }

  /**
   * Delete a backup
   */
  async deleteBackup(backupId: string): Promise<void> {
    try {
      const backupInfo = await this.getBackupInfo(backupId)
      if (!backupInfo) {
        throw new Error(`Backup not found: ${backupId}`)
      }

      // Delete backup file
      await fs.unlink(backupInfo.filepath)

      // Delete metadata file
      const metadataPath = `${backupInfo.filepath}.metadata.json`
      await fs.unlink(metadataPath)

      console.log(`✅ Backup deleted: ${backupId}`)

    } catch (error) {
      console.error('❌ Failed to delete backup:', error)
      throw error
    }
  }

  /**
   * Create incremental backup (only changed data)
   */
  async createIncrementalBackup(baseBackupId: string): Promise<BackupInfo> {
    console.log('💾 Creating incremental backup...')

    try {
      const baseBackup = await this.getBackupInfo(baseBackupId)
      if (!baseBackup) {
        throw new Error(`Base backup not found: ${baseBackupId}`)
      }

      // Get current record counts
      const currentCounts = await this.getRecordCounts(baseBackup.tables)
      
      // Find tables with changes
      const changedTables = baseBackup.tables.filter(table => {
        const baseCount = baseBackup.recordCounts[table] || 0
        const currentCount = currentCounts[table] || 0
        return currentCount !== baseCount
      })

      if (changedTables.length === 0) {
        console.log('✅ No changes detected - skipping incremental backup')
        return baseBackup
      }

      console.log(`   Changed tables: ${changedTables.join(', ')}`)

      // Create incremental backup (this is a simplified version)
      // In a real implementation, you would backup only the changed records
      return await this.createBackup(`Incremental backup based on ${baseBackupId}`)

    } catch (error) {
      console.error('❌ Incremental backup failed:', error)
      throw error
    }
  }

  /**
   * Get backup information
   */
  private async getBackupInfo(backupId: string): Promise<BackupInfo | null> {
    try {
      const metadataPath = path.join(this.backupDir, `${backupId}.sql.metadata.json`)
      const metadata = await fs.readFile(metadataPath, 'utf-8')
      return JSON.parse(metadata)
    } catch {
      return null
    }
  }

  /**
   * Save backup metadata
   */
  private async saveBackupMetadata(backupInfo: BackupInfo, description?: string): Promise<void> {
    const metadata = {
      ...backupInfo,
      description: description || 'Database backup'
    }

    const metadataPath = `${backupInfo.filepath}.metadata.json`
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))
  }

  /**
   * Log backup to database
   */
  private async logBackup(backupInfo: BackupInfo, description?: string): Promise<void> {
    try {
      await this.prisma.backupLog.create({
        data: {
          filename: backupInfo.filename,
          size: BigInt(backupInfo.size),
          type: 'FULL',
          status: 'COMPLETED',
          startedAt: backupInfo.createdAt,
          completedAt: new Date(),
          checksum: backupInfo.checksum,
          location: backupInfo.filepath
        }
      })
    } catch (error) {
      console.warn('Failed to log backup to database:', error)
    }
  }

  /**
   * Get all table names
   */
  private async getTableNames(): Promise<string[]> {
    const result = await this.prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `
    return result.map(row => row.tablename)
  }

  /**
   * Get record counts for all tables
   */
  private async getRecordCounts(tables: string[]): Promise<Record<string, number>> {
    const counts: Record<string, number> = {}

    for (const table of tables) {
      try {
        const result = await this.prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${table}"`)
        counts[table] = Number((result as any)[0]?.count || 0)
      } catch (error) {
        console.warn(`Failed to get count for table ${table}:`, error)
        counts[table] = 0
      }
    }

    return counts
  }

  /**
   * Calculate file checksum
   */
  private async calculateChecksum(filepath: string): Promise<string> {
    try {
      const { stdout } = await execAsync(`sha256sum "${filepath}"`)
      return stdout.split(' ')[0]
    } catch {
      // Fallback for systems without sha256sum
      const content = await fs.readFile(filepath)
      const crypto = require('crypto')
      return crypto.createHash('sha256').update(content).digest('hex')
    }
  }

  /**
   * Verify restore operation
   */
  private async verifyRestore(backupInfo: BackupInfo): Promise<void> {
    console.log('   Verifying restore...')

    const currentCounts = await this.getRecordCounts(backupInfo.tables)
    
    for (const table of backupInfo.tables) {
      const expectedCount = backupInfo.recordCounts[table] || 0
      const actualCount = currentCounts[table] || 0
      
      if (actualCount !== expectedCount) {
        console.warn(`   Warning: Table ${table} count mismatch - expected: ${expectedCount}, actual: ${actualCount}`)
      }
    }
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`
  }
}