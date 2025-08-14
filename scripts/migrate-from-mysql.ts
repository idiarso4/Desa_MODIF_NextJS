/**
 * Migration CLI Script
 * Command line tool for migrating data from MySQL OpenSID to PostgreSQL
 */

import { MySQLToPostgresMigrator, MigrationConfig } from '../src/lib/migration/mysql-to-postgres'
import { config } from 'dotenv'
import { readFileSync } from 'fs'
import { join } from 'path'

// Load environment variables
config()

interface CLIOptions {
  mysqlHost?: string
  mysqlPort?: string
  mysqlUser?: string
  mysqlPassword?: string
  mysqlDatabase?: string
  batchSize?: string
  skipExisting?: string
  validateOnly?: string
  help?: string
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2)
  const options: CLIOptions = {}

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    
    if (arg.startsWith('--')) {
      const key = arg.slice(2) as keyof CLIOptions
      const value = args[i + 1]
      
      if (value && !value.startsWith('--')) {
        options[key] = value
        i++ // Skip next argument as it's the value
      } else {
        options[key] = 'true'
      }
    }
  }

  return options
}

function showHelp(): void {
  console.log(`
OpenSID MySQL to PostgreSQL Migration Tool

Usage: npm run migrate [options]

Options:
  --mysql-host <host>        MySQL host (default: localhost)
  --mysql-port <port>        MySQL port (default: 3306)
  --mysql-user <user>        MySQL username
  --mysql-password <pass>    MySQL password
  --mysql-database <db>      MySQL database name
  --batch-size <size>        Batch size for processing (default: 1000)
  --skip-existing            Skip existing records (default: true)
  --validate-only            Only validate migration, don't migrate
  --help                     Show this help message

Environment Variables:
  MYSQL_HOST                 MySQL host
  MYSQL_PORT                 MySQL port
  MYSQL_USER                 MySQL username
  MYSQL_PASSWORD             MySQL password
  MYSQL_DATABASE             MySQL database name

Examples:
  npm run migrate --mysql-host localhost --mysql-database opensid_db
  npm run migrate --validate-only
  npm run migrate --batch-size 500 --skip-existing
`)
}

async function main(): Promise<void> {
  const options = parseArgs()

  if (options.help) {
    showHelp()
    return
  }

  // Build migration config
  const migrationConfig: MigrationConfig = {
    mysql: {
      host: options.mysqlHost || process.env.MYSQL_HOST || 'localhost',
      port: parseInt(options.mysqlPort || process.env.MYSQL_PORT || '3306'),
      user: options.mysqlUser || process.env.MYSQL_USER || 'root',
      password: options.mysqlPassword || process.env.MYSQL_PASSWORD || '',
      database: options.mysqlDatabase || process.env.MYSQL_DATABASE || 'opensid'
    },
    batchSize: parseInt(options.batchSize || '1000'),
    skipExisting: options.skipExisting !== 'false',
    validateData: true
  }

  console.log('🚀 Starting OpenSID Migration...')
  console.log('Configuration:')
  console.log(`  MySQL: ${migrationConfig.mysql.host}:${migrationConfig.mysql.port}/${migrationConfig.mysql.database}`)
  console.log(`  Batch Size: ${migrationConfig.batchSize}`)
  console.log(`  Skip Existing: ${migrationConfig.skipExisting}`)
  console.log('')

  const migrator = new MySQLToPostgresMigrator(migrationConfig)

  try {
    if (options.validateOnly) {
      console.log('🔍 Validating existing migration...')
      const validation = await migrator.validateMigration()
      
      console.log('\n📊 Validation Results:')
      console.log(`  Valid: ${validation.isValid ? '✅' : '❌'}`)
      console.log('  Record Counts:')
      Object.entries(validation.summary).forEach(([table, count]) => {
        console.log(`    ${table}: ${count}`)
      })
      
      if (validation.issues.length > 0) {
        console.log('  Issues:')
        validation.issues.forEach(issue => {
          console.log(`    ❌ ${issue}`)
        })
      }
      
      return
    }

    // Run migration
    console.log('📦 Starting data migration...')
    const results = await migrator.migrateAll()

    console.log('\n📊 Migration Results:')
    console.log('=' .repeat(80))

    let totalMigrated = 0
    let totalErrors = 0

    results.forEach(result => {
      console.log(`\n📋 ${result.table.toUpperCase()}`)
      console.log(`  Total Records: ${result.totalRecords}`)
      console.log(`  Migrated: ${result.migratedRecords} ✅`)
      console.log(`  Skipped: ${result.skippedRecords} ⏭️`)
      console.log(`  Errors: ${result.errorRecords} ❌`)
      console.log(`  Duration: ${(result.duration / 1000).toFixed(2)}s`)

      if (result.errors.length > 0) {
        console.log('  Error Details:')
        result.errors.slice(0, 5).forEach(error => {
          console.log(`    ❌ ${error}`)
        })
        if (result.errors.length > 5) {
          console.log(`    ... and ${result.errors.length - 5} more errors`)
        }
      }

      totalMigrated += result.migratedRecords
      totalErrors += result.errorRecords
    })

    console.log('\n' + '=' .repeat(80))
    console.log(`🎉 Migration completed!`)
    console.log(`  Total migrated: ${totalMigrated}`)
    console.log(`  Total errors: ${totalErrors}`)

    if (totalErrors === 0) {
      console.log('✅ All data migrated successfully!')
    } else {
      console.log('⚠️  Some errors occurred during migration. Check logs above.')
    }

    // Run validation
    console.log('\n🔍 Running post-migration validation...')
    const validation = await migrator.validateMigration()
    
    if (validation.isValid) {
      console.log('✅ Migration validation passed!')
    } else {
      console.log('❌ Migration validation failed:')
      validation.issues.forEach(issue => {
        console.log(`  ❌ ${issue}`)
      })
    }

  } catch (error) {
    console.error('💥 Migration failed:', error)
    process.exit(1)
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error)
  process.exit(1)
})

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error)
  process.exit(1)
})

// Run migration
if (require.main === module) {
  main().catch(error => {
    console.error('Migration script error:', error)
    process.exit(1)
  })
}
