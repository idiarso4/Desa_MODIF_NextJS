#!/usr/bin/env tsx

/**
 * Data Migration Script
 * Migrates data from MySQL OpenSID to PostgreSQL
 */

import { PrismaClient } from '@prisma/client'
import { createMySQLConnection } from '../src/lib/migration/mysql-connection'
import { MigrationEngine, MigrationConfig } from '../src/lib/migration/migration-engine'
import fs from 'fs/promises'
import path from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 OpenSID Data Migration Tool')
  console.log('================================')

  // Parse command line arguments
  const args = process.argv.slice(2)
  const options = parseArguments(args)

  try {
    // Validate environment variables
    validateEnvironment()

    // Create MySQL connection
    const mysql = createMySQLConnection()

    // Test connections
    console.log('🔍 Testing database connections...')
    await testConnections(mysql)

    // Configure migration
    const config: MigrationConfig = {
      batchSize: options.batchSize || 1000,
      validateData: options.validate !== false,
      createBackup: options.backup !== false,
      skipExisting: options.skipExisting || false
    }

    console.log('⚙️  Migration Configuration:')
    console.log(`   Batch Size: ${config.batchSize}`)
    console.log(`   Validate Data: ${config.validateData}`)
    console.log(`   Create Backup: ${config.createBackup}`)
    console.log(`   Skip Existing: ${config.skipExisting}`)
    console.log('')

    // Confirm before proceeding
    if (!options.force) {
      const confirmed = await confirmMigration()
      if (!confirmed) {
        console.log('❌ Migration cancelled by user')
        process.exit(0)
      }
    }

    // Run migration
    const engine = new MigrationEngine(prisma, mysql, config)
    const report = await engine.migrate()

    // Display results
    console.log('\n📊 Migration Report')
    console.log('==================')
    displayReport(report)

    // Save report to file
    await saveReport(report)

    // Validate migration
    if (options.validate !== false) {
      console.log('\n🔍 Validating migration...')
      const issues = await engine.validateMigration()
      
      if (issues.length > 0) {
        console.log('⚠️  Validation Issues:')
        issues.forEach(issue => console.log(`   - ${issue}`))
      } else {
        console.log('✅ Migration validation passed')
      }
    }

    // Exit with appropriate code
    const exitCode = report.overallStatus === 'success' ? 0 : 1
    process.exit(exitCode)

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

function parseArguments(args: string[]): any {
  const options: any = {}

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    
    switch (arg) {
      case '--batch-size':
        options.batchSize = parseInt(args[++i])
        break
      case '--no-validate':
        options.validate = false
        break
      case '--no-backup':
        options.backup = false
        break
      case '--skip-existing':
        options.skipExisting = true
        break
      case '--force':
        options.force = true
        break
      case '--help':
        displayHelp()
        process.exit(0)
        break
    }
  }

  return options
}

function displayHelp() {
  console.log(`
OpenSID Data Migration Tool

Usage: npm run migrate [options]

Options:
  --batch-size <number>    Number of records to process in each batch (default: 1000)
  --no-validate           Skip data validation during migration
  --no-backup             Skip creating backup before migration
  --skip-existing         Skip records that already exist in target database
  --force                 Skip confirmation prompt
  --help                  Display this help message

Environment Variables:
  MYSQL_HOST              MySQL host (default: localhost)
  MYSQL_PORT              MySQL port (default: 3306)
  MYSQL_USER              MySQL username (default: root)
  MYSQL_PASSWORD          MySQL password
  MYSQL_DATABASE          MySQL database name (default: opensid)
  DATABASE_URL            PostgreSQL connection string

Examples:
  npm run migrate                           # Run with default settings
  npm run migrate --batch-size 500         # Use smaller batch size
  npm run migrate --no-backup --force      # Skip backup and confirmation
  npm run migrate --skip-existing          # Skip existing records
`)
}

function validateEnvironment() {
  const required = ['DATABASE_URL']
  const missing = required.filter(env => !process.env[env])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  console.log('✅ Environment validation passed')
}

async function testConnections(mysql: any) {
  try {
    // Test PostgreSQL
    await prisma.$connect()
    console.log('✅ PostgreSQL connection successful')

    // Test MySQL
    await mysql.connect()
    const isConnected = await mysql.testConnection()
    if (!isConnected) {
      throw new Error('MySQL connection test failed')
    }
    console.log('✅ MySQL connection successful')
    await mysql.disconnect()

  } catch (error) {
    throw new Error(`Database connection failed: ${error.message}`)
  }
}

async function confirmMigration(): Promise<boolean> {
  // In a real implementation, you would use a library like 'inquirer'
  // For now, we'll just return true
  console.log('⚠️  This will migrate data from MySQL to PostgreSQL.')
  console.log('   Make sure you have backed up your data before proceeding.')
  console.log('   Use --force to skip this confirmation.')
  
  return true // Auto-confirm for now
}

function displayReport(report: any) {
  console.log(`Start Time: ${report.startTime.toISOString()}`)
  console.log(`End Time: ${report.endTime.toISOString()}`)
  console.log(`Duration: ${Math.round(report.totalDuration / 1000)}s`)
  console.log(`Overall Status: ${report.overallStatus.toUpperCase()}`)
  console.log('')

  console.log('Summary:')
  console.log(`  Total Tables: ${report.summary.totalTables}`)
  console.log(`  Successful: ${report.summary.successfulTables}`)
  console.log(`  Partial: ${report.summary.partialTables}`)
  console.log(`  Failed: ${report.summary.failedTables}`)
  console.log(`  Total Records: ${report.summary.totalRecords}`)
  console.log(`  Migrated: ${report.summary.migratedRecords}`)
  console.log(`  Errors: ${report.summary.errorRecords}`)
  console.log('')

  console.log('Table Results:')
  report.results.forEach((result: any) => {
    const status = result.status === 'success' ? '✅' : 
                  result.status === 'partial' ? '⚠️' : '❌'
    console.log(`  ${status} ${result.tableName}: ${result.migratedRecords}/${result.totalRecords} (${Math.round(result.duration / 1000)}s)`)
    
    if (result.errors.length > 0) {
      result.errors.slice(0, 3).forEach((error: string) => {
        console.log(`     Error: ${error}`)
      })
      if (result.errors.length > 3) {
        console.log(`     ... and ${result.errors.length - 3} more errors`)
      }
    }
  })
}

async function saveReport(report: any) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `migration-report-${timestamp}.json`
    const filepath = path.join(process.cwd(), 'logs', filename)
    
    // Ensure logs directory exists
    await fs.mkdir(path.dirname(filepath), { recursive: true })
    
    // Save report
    await fs.writeFile(filepath, JSON.stringify(report, null, 2))
    console.log(`📄 Migration report saved to: ${filepath}`)
    
  } catch (error) {
    console.error('❌ Failed to save migration report:', error)
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  main()
}