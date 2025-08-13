// Monitoring dashboard API endpoints
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { checkPermission } from '@/lib/rbac/server-utils'
import { performanceMonitor, healthChecker } from '@/lib/monitoring/performance-monitor'
import { cacheManager } from '@/lib/cache/redis'
import { prisma } from '@/lib/db'

// GET /api/monitoring/dashboard - Get monitoring dashboard data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    const hasPermission = await checkPermission(session.user.id, 'monitoring', 'read')
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const timeRange = parseInt(searchParams.get('timeRange') || '60') // minutes

    // Get performance statistics
    const apiStats = performanceMonitor.getApiStats(timeRange)
    const dbStats = performanceMonitor.getDatabaseStats(timeRange)
    const systemMetrics = await performanceMonitor.getSystemMetrics()

    // Get health check results
    const healthStatus = await healthChecker.runHealthChecks()

    // Get cache statistics
    const cacheStats = await getCacheStatistics()

    // Get database connection info
    const dbConnectionInfo = await getDatabaseConnectionInfo()

    // Get recent errors
    const recentErrors = await getRecentErrors(timeRange)

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          status: healthStatus.status,
          uptime: process.uptime(),
          timestamp: Date.now()
        },
        api: apiStats,
        database: {
          ...dbStats,
          connections: dbConnectionInfo
        },
        system: systemMetrics,
        cache: cacheStats,
        health: healthStatus,
        errors: recentErrors
      }
    })

  } catch (error) {
    console.error('Monitoring dashboard error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to get cache statistics
async function getCacheStatistics() {
  try {
    const health = await cacheManager.healthCheck()
    
    // Get Redis info if available
    const redis = cacheManager['redis']
    const info = await redis.info('memory')
    const keyspace = await redis.info('keyspace')
    
    // Parse memory usage
    const memoryMatch = info.match(/used_memory_human:(.+)/)
    const memoryUsage = memoryMatch ? memoryMatch[1].trim() : 'Unknown'
    
    // Parse total keys
    const dbMatch = keyspace.match(/db0:keys=(\d+)/)
    const totalKeys = dbMatch ? parseInt(dbMatch[1]) : 0
    
    return {
      status: health.status,
      latency: health.latency,
      memoryUsage,
      totalKeys,
      connected: true
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      latency: null,
      memoryUsage: 'Unknown',
      totalKeys: 0,
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Helper function to get database connection info
async function getDatabaseConnectionInfo() {
  try {
    const connections = await prisma.$queryRaw<Array<{
      state: string
      count: bigint
    }>>`
      SELECT state, COUNT(*) as count
      FROM pg_stat_activity 
      WHERE datname = current_database()
      GROUP BY state
    `

    const totalConnections = connections.reduce((sum, conn) => sum + Number(conn.count), 0)
    const activeConnections = connections.find(conn => conn.state === 'active')
    const idleConnections = connections.find(conn => conn.state === 'idle')

    return {
      total: totalConnections,
      active: activeConnections ? Number(activeConnections.count) : 0,
      idle: idleConnections ? Number(idleConnections.count) : 0,
      details: connections.map(conn => ({
        state: conn.state,
        count: Number(conn.count)
      }))
    }
  } catch (error) {
    return {
      total: 0,
      active: 0,
      idle: 0,
      details: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Helper function to get recent errors
async function getRecentErrors(timeRangeMinutes: number) {
  try {
    // This would typically query error logs
    // For now, return placeholder data
    return {
      total: 0,
      critical: 0,
      warnings: 0,
      recent: []
    }
  } catch (error) {
    return {
      total: 0,
      critical: 0,
      warnings: 0,
      recent: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// POST /api/monitoring/dashboard/clear-cache - Clear application cache
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    const hasPermission = await checkPermission(session.user.id, 'monitoring', 'manage')
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'clear_all_cache':
        await clearAllCache()
        break
      case 'clear_api_cache':
        await clearApiCache()
        break
      case 'clear_citizen_cache':
        await cacheManager.invalidateCitizenCaches()
        break
      case 'clear_letter_cache':
        await cacheManager.invalidateLetterCaches()
        break
      case 'clear_finance_cache':
        await cacheManager.invalidateFinanceCaches()
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `Cache cleared: ${action}`
    })

  } catch (error) {
    console.error('Cache clear error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper functions for cache clearing
async function clearAllCache() {
  const redis = cacheManager['redis']
  await redis.flushdb()
}

async function clearApiCache() {
  await cacheManager.delPattern('api:*')
}