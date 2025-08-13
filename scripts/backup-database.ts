#!/usr/bin/env tsx

/**
 * Database Backup Script
 * Creates backups and manages backup operations
 */

import { PrismaClient } from '@prisma/client'
import { BackupManager } from '../src/lib/migration/backup-manager'

const prisma = new PrismaClient()

async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  const backupManager = new BackupManager(prisma)

  try {
    switch (command) {
      case 'create':
        await createBackup(args.slice(1))
        break
      case 'list':
        await listBackups()
        break
      case 'restore':
        await restoreBackup(args[1])
        break
      case 'delete':
        await deleteBackup(args[1])
        break
      case 'incremental':
        await createIncrementalBackup(args[1])
        break
      default:
        displayHelp()
        break
    }
  } catch (error) {
    console.error('❌ Operation failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

async function createBackup(args: string[]) {
  const description = args.join(' ') || 'Manual backup'
  console.log(`Creating backup: ${description}`)
  
  const backup = await new BackupManager(prisma).createBackup(description)
  console.log(`✅ Backup created: ${backup.id}`)
}

async function listBackups() {
  console.log('📋 Available Backups:')
  console.log('====================')
  
  const backups = await new BackupManager(prisma).listBackups()
  
  if (backups.length === 0) {
    console.log('No backups found.')
    return
  }

  backups.forEach(backup => {
    console.log(`ID: ${backup.id}`)
    console.log(`Created: ${backup.createdAt.toISOString()}`)
    console.log(`Size: ${formatFileSize(backup.size)}`)
    console.log(`Tables: ${backup.tables.length}`)
    console.log(`Records: ${Object.values(backup.recordCounts).reduce((sum, count) => sum + count, 0)}`)
    console.log('---')
  })
}

async function restoreBackup(backupId: string) {
  if (!backupId) {
    console.error('❌ Backup ID required')
    process.exit(1)
  }

  console.log(`Restoring backup: ${backupId}`)
  await new BackupManager(prisma).restoreBackup(backupId)
}

async function deleteBackup(backupId: string) {
  if (!backupId) {
    console.error('❌ Backup ID required')
    process.exit(1)
  }

  console.log(`Deleting backup: ${backupId}`)
  await new BackupManager(prisma).deleteBackup(backupId)
}

async function createIncrementalBackup(baseBackupId: string) {
  if (!baseBackupId) {
    console.error('❌ Base backup ID required')
    process.exit(1)
  }

  console.log(`Creating incremental backup based on: ${baseBackupId}`)
  const backup = await new BackupManager(prisma).createIncrementalBackup(baseBackupId)
  console.log(`✅ Incremental backup created: ${backup.id}`)
}

function displayHelp() {
  console.log(`
Database Backup Manager

Usage: npm run backup <command> [options]

Commands:
  create [description]     Create a new backup
  list                     List all available backups
  restore <backup-id>      Restore from a backup
  delete <backup-id>       Delete a backup
  incremental <base-id>    Create incremental backup

Examples:
  npm run backup create "Before migration"
  npm run backup list
  npm run backup restore backup_2024-01-01T10-00-00-000Z
  npm run backup delete backup_2024-01-01T10-00-00-000Z
  npm run backup incremental backup_2024-01-01T10-00-00-000Z
`)
}

function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`
}

if (require.main === module) {
  main()
}