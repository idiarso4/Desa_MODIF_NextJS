/**
 * Database Index Management
 * Utility functions for managing database indexes and performance optimization
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Create additional indexes for better query performance
 * These are indexes that can't be defined in the Prisma schema
 */
export async function createAdditionalIndexes() {
  try {
    // Composite indexes for common queries
    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_citizens_name_nik 
      ON citizens (name, nik);
    `

    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_citizens_family_head 
      ON citizens (family_id, is_head_of_family) 
      WHERE is_head_of_family = true;
    `

    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_letter_requests_citizen_status 
      ON letter_requests (citizen_id, status, requested_at DESC);
    `

    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_published_date 
      ON articles (published, published_at DESC) 
      WHERE published = true;
    `

    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_logs_user_date 
      ON activity_logs (user_id, created_at DESC);
    `

    // Full-text search indexes
    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_citizens_name_fulltext 
      ON citizens USING gin(to_tsvector('indonesian', name));
    `

    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_content_fulltext 
      ON articles USING gin(to_tsvector('indonesian', title || ' ' || content));
    `

    console.log('✅ Additional database indexes created successfully')
  } catch (error) {
    console.error('❌ Error creating additional indexes:', error)
    throw error
  }
}

/**
 * Analyze database performance and suggest optimizations
 */
export async function analyzePerformance() {
  try {
    // Get table sizes
    const tableSizes = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        attname,
        n_distinct,
        correlation
      FROM pg_stats 
      WHERE schemaname = 'public'
      ORDER BY n_distinct DESC;
    `

    // Get slow queries (if pg_stat_statements is enabled)
    const slowQueries = await prisma.$queryRaw`
      SELECT 
        query,
        calls,
        total_time,
        mean_time,
        rows
      FROM pg_stat_statements 
      WHERE query NOT LIKE '%pg_stat_statements%'
      ORDER BY mean_time DESC 
      LIMIT 10;
    `

    return {
      tableSizes,
      slowQueries,
    }
  } catch (error) {
    console.error('❌ Error analyzing performance:', error)
    return null
  }
}

/**
 * Update table statistics for better query planning
 */
export async function updateStatistics() {
  try {
    await prisma.$executeRaw`ANALYZE;`
    console.log('✅ Database statistics updated')
  } catch (error) {
    console.error('❌ Error updating statistics:', error)
    throw error
  }
}

/**
 * Check for missing indexes based on query patterns
 */
export async function checkMissingIndexes() {
  try {
    const missingIndexes = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        attname,
        n_distinct,
        correlation,
        most_common_vals
      FROM pg_stats 
      WHERE schemaname = 'public' 
        AND n_distinct > 100 
        AND correlation < 0.1
      ORDER BY n_distinct DESC;
    `

    return missingIndexes
  } catch (error) {
    console.error('❌ Error checking missing indexes:', error)
    return []
  }
}

export { prisma }