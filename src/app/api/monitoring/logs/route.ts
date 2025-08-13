// Logs API endpoints for monitoring
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { checkPermission } from '@/lib/rbac/server-utils'
import { logger, LogLevel, LogCategory } from '@/lib/monitoring/logger'
import { z } from 'zod'

// Validation schemas
const logQuerySchema = z.object({
  level: z.nativeEnum(LogLevel).optional(),
  category: z.nativeEnum(LogCategory).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  userId: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50)
})

// GET /api/monitoring/logs - Query application logs
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
    const queryParams = Object.fromEntries(searchParams.entries())
    
    const validatedParams = logQuerySchema.parse(queryParams)

    // Query logs (this would typically query a log aggregation service)
    const logs = await queryLogs(validatedParams)
    const stats = await getLogStatistics(validatedParams)

    return NextResponse.json({
      success: true,
      data: {
        logs: logs.logs,
        pagination: logs.pagination,
        statistics: stats
      }
    })

  } catch (error) {
    console.error('Logs query error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/monitoring/logs/export - Export logs
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    const hasPermission = await checkPermission(session.user.id, 'monitoring', 'export')
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { startDate, endDate, format = 'json', filters = {} } = body

    // Validate date range
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start >= end) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      )
    }

    // Check date range limit (max 30 days)
    const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    if (daysDiff > 30) {
      return NextResponse.json(
        { error: 'Date range cannot exceed 30 days' },
        { status: 400 }
      )
    }

    // Export logs
    const exportData = await exportLogs(start, end, format, filters)

    // Log the export action
    logger.logUserAction(
      'export_logs',
      session.user.id,
      'logs',
      undefined,
      { startDate, endDate, format, filters }
    )

    return NextResponse.json({
      success: true,
      data: {
        downloadUrl: exportData.downloadUrl,
        filename: exportData.filename,
        size: exportData.size,
        recordCount: exportData.recordCount
      }
    })

  } catch (error) {
    console.error('Log export error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to query logs
async function queryLogs(params: z.infer<typeof logQuerySchema>) {
  // This would typically query a log aggregation service like ELK, Splunk, etc.
  // For now, return mock data
  
  const mockLogs = [
    {
      id: '1',
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      category: LogCategory.API,
      message: 'GET /api/citizens - 200 (45ms)',
      userId: 'user123',
      ip: '192.168.1.1',
      metadata: {
        method: 'GET',
        endpoint: '/api/citizens',
        statusCode: 200,
        responseTime: 45
      }
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 60000).toISOString(),
      level: LogLevel.WARN,
      category: LogCategory.SECURITY,
      message: 'Multiple failed login attempts',
      ip: '192.168.1.100',
      metadata: {
        attempts: 5,
        username: 'admin'
      }
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 120000).toISOString(),
      level: LogLevel.ERROR,
      category: LogCategory.DATABASE,
      message: 'Database query timeout',
      metadata: {
        query: 'SELECT * FROM citizens WHERE...',
        duration: 5000,
        error: 'Connection timeout'
      }
    }
  ]

  // Apply filters
  let filteredLogs = mockLogs

  if (params.level) {
    filteredLogs = filteredLogs.filter(log => log.level === params.level)
  }

  if (params.category) {
    filteredLogs = filteredLogs.filter(log => log.category === params.category)
  }

  if (params.userId) {
    filteredLogs = filteredLogs.filter(log => log.userId === params.userId)
  }

  if (params.search) {
    const searchLower = params.search.toLowerCase()
    filteredLogs = filteredLogs.filter(log => 
      log.message.toLowerCase().includes(searchLower)
    )
  }

  // Apply pagination
  const total = filteredLogs.length
  const offset = (params.page - 1) * params.limit
  const paginatedLogs = filteredLogs.slice(offset, offset + params.limit)

  return {
    logs: paginatedLogs,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      pages: Math.ceil(total / params.limit)
    }
  }
}

// Helper function to get log statistics
async function getLogStatistics(params: z.infer<typeof logQuerySchema>) {
  // This would typically analyze logs from the aggregation service
  // For now, return mock statistics
  
  return {
    totalLogs: 1250,
    errorCount: 15,
    warnCount: 45,
    infoCount: 1190,
    levelDistribution: {
      [LogLevel.ERROR]: 15,
      [LogLevel.WARN]: 45,
      [LogLevel.INFO]: 1100,
      [LogLevel.DEBUG]: 90
    },
    categoryDistribution: {
      [LogCategory.API]: 800,
      [LogCategory.AUTH]: 150,
      [LogCategory.DATABASE]: 100,
      [LogCategory.SECURITY]: 50,
      [LogCategory.SYSTEM]: 150
    },
    topUsers: [
      { userId: 'user123', count: 200 },
      { userId: 'admin', count: 150 },
      { userId: 'user456', count: 100 }
    ],
    topEndpoints: [
      { endpoint: '/api/citizens', count: 300 },
      { endpoint: '/api/letters', count: 200 },
      { endpoint: '/api/auth/me', count: 150 }
    ],
    errorTrends: [
      { hour: 0, count: 2 },
      { hour: 1, count: 1 },
      { hour: 2, count: 0 },
      { hour: 3, count: 3 }
    ]
  }
}

// Helper function to export logs
async function exportLogs(
  startDate: Date,
  endDate: Date,
  format: string,
  filters: any
) {
  // This would typically export logs from the aggregation service
  // For now, return mock export data
  
  const filename = `opensid-logs-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}.${format}`
  
  return {
    downloadUrl: `/api/monitoring/logs/download/${filename}`,
    filename,
    size: 1024 * 1024, // 1MB
    recordCount: 5000
  }
}

// DELETE /api/monitoring/logs/cleanup - Clean up old logs
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const olderThanDays = parseInt(searchParams.get('olderThanDays') || '30')

    if (olderThanDays < 7) {
      return NextResponse.json(
        { error: 'Cannot delete logs newer than 7 days' },
        { status: 400 }
      )
    }

    // Clean up old logs
    const deletedCount = await cleanupOldLogs(olderThanDays)

    // Log the cleanup action
    logger.logUserAction(
      'cleanup_logs',
      session.user.id,
      'logs',
      undefined,
      { olderThanDays, deletedCount }
    )

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deletedCount} old log entries`,
      deletedCount
    })

  } catch (error) {
    console.error('Log cleanup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to clean up old logs
async function cleanupOldLogs(olderThanDays: number): Promise<number> {
  // This would typically clean up logs from the aggregation service
  // For now, return mock count
  return Math.floor(Math.random() * 1000)
}