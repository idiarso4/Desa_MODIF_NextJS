#!/usr/bin/env tsx

/**
 * Database Optimization Script
 * Applies additional constraints, indexes, and optimizations to the OpenSID database
 */

import { PrismaClient } from '@prisma/client';
import { 
  constraintSQL, 
  performanceOptimizations, 
  maintenanceFunctions 
} from '../src/lib/database/additional-constraints';

const prisma = new PrismaClient();

async function applyDatabaseOptimizations() {
  console.log('🚀 Starting database optimization process...');

  try {
    // 1. Create composite indexes
    console.log('📊 Creating composite indexes...');
    for (const query of constraintSQL.createCompositeIndexes) {
      try {
        await prisma.$executeRawUnsafe(query);
        console.log('✅ Created composite index');
      } catch (error) {
        console.warn('⚠️ Index may already exist:', error.message);
      }
    }

    // 2. Create partial indexes for performance
    console.log('🎯 Creating partial indexes...');
    for (const query of performanceOptimizations.partialIndexes) {
      try {
        await prisma.$executeRawUnsafe(query);
        console.log('✅ Created partial index');
      } catch (error) {
        console.warn('⚠️ Partial index may already exist:', error.message);
      }
    }

    // 3. Create check constraints
    console.log('🔒 Creating check constraints...');
    for (const query of constraintSQL.createCheckConstraints) {
      try {
        await prisma.$executeRawUnsafe(query);
        console.log('✅ Created check constraint');
      } catch (error) {
        console.warn('⚠️ Constraint may already exist:', error.message);
      }
    }

    // 4. Create unique constraints with conditions
    console.log('🔑 Creating conditional unique constraints...');
    for (const query of constraintSQL.createUniqueConstraints) {
      try {
        await prisma.$executeRawUnsafe(query);
        console.log('✅ Created unique constraint');
      } catch (error) {
        console.warn('⚠️ Unique constraint may already exist:', error.message);
      }
    }

    // 5. Create maintenance functions
    console.log('🛠️ Creating maintenance functions...');
    for (const [name, query] of Object.entries(maintenanceFunctions)) {
      try {
        await prisma.$executeRawUnsafe(query);
        console.log(`✅ Created function: ${name}`);
      } catch (error) {
        console.warn(`⚠️ Function ${name} may already exist:`, error.message);
      }
    }

    // 6. Analyze tables for better query planning
    console.log('📈 Analyzing tables for query optimization...');
    for (const query of performanceOptimizations.analyzeQueries) {
      try {
        await prisma.$executeRawUnsafe(query);
        console.log('✅ Analyzed table');
      } catch (error) {
        console.error('❌ Error analyzing table:', error.message);
      }
    }

    // 7. Run initial data integrity check
    console.log('🔍 Running data integrity validation...');
    try {
      const integrityResults = await prisma.$queryRaw`
        SELECT * FROM validate_data_integrity();
      `;
      
      console.log('📋 Data integrity results:');
      console.table(integrityResults);
    } catch (error) {
      console.warn('⚠️ Could not run integrity check:', error.message);
    }

    // 8. Update initial statistics
    console.log('📊 Updating initial statistics...');
    try {
      await prisma.$executeRawUnsafe('SELECT update_citizen_statistics();');
      console.log('✅ Updated citizen statistics');
    } catch (error) {
      console.warn('⚠️ Could not update statistics:', error.message);
    }

    console.log('🎉 Database optimization completed successfully!');

  } catch (error) {
    console.error('❌ Error during database optimization:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Performance monitoring function
async function checkDatabasePerformance() {
  console.log('🔍 Checking database performance metrics...');

  try {
    // Check table sizes
    const tableSizes = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        attname,
        n_distinct,
        correlation
      FROM pg_stats 
      WHERE schemaname = 'public'
      ORDER BY tablename, attname;
    `;

    console.log('📊 Table statistics:');
    console.table(tableSizes);

    // Check index usage
    const indexUsage = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_tup_read,
        idx_tup_fetch
      FROM pg_stat_user_indexes 
      WHERE schemaname = 'public'
      ORDER BY idx_tup_read DESC;
    `;

    console.log('📈 Index usage statistics:');
    console.table(indexUsage);

  } catch (error) {
    console.error('❌ Error checking performance:', error);
  }
}

// Maintenance function
async function runMaintenance() {
  console.log('🧹 Running database maintenance...');

  try {
    // Cleanup old activity logs (keep last 365 days)
    const deletedLogs = await prisma.$queryRaw`
      SELECT cleanup_old_activity_logs(365);
    `;
    console.log('🗑️ Cleaned up activity logs:', deletedLogs);

    // Vacuum and analyze tables
    console.log('🧽 Running vacuum and analyze...');
    for (const query of performanceOptimizations.vacuumQueries) {
      await prisma.$executeRawUnsafe(query);
      console.log('✅ Vacuumed table');
    }

    console.log('✨ Maintenance completed successfully!');

  } catch (error) {
    console.error('❌ Error during maintenance:', error);
  }
}

// Main execution
async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'optimize':
      await applyDatabaseOptimizations();
      break;
    case 'performance':
      await checkDatabasePerformance();
      break;
    case 'maintenance':
      await runMaintenance();
      break;
    case 'all':
      await applyDatabaseOptimizations();
      await checkDatabasePerformance();
      break;
    default:
      console.log(`
Usage: npm run db:optimize [command]

Commands:
  optimize     - Apply database optimizations (indexes, constraints, functions)
  performance  - Check database performance metrics
  maintenance  - Run database maintenance tasks
  all          - Run optimization and performance check

Examples:
  npm run db:optimize optimize
  npm run db:optimize performance
  npm run db:optimize maintenance
  npm run db:optimize all
      `);
      break;
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { applyDatabaseOptimizations, checkDatabasePerformance, runMaintenance };