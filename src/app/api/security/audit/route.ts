import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { checkPermission } from '@/lib/rbac/server-utils'
import { AuditQueryService, AuditEventType, AuditSeverity } from '@/lib/security/audit-system'
import { logger } from '@/lib/monitoring/logger'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check permissions - only admins can access audit logs
    const hasPermission = await checkPermission(session.user.id, 'audit', 'read')
    if (!hasPermission) {
      await logger.warn('Unauthorized audit access attempt', {
        userId: session.user.id,
        username: session.user.username
      })
      
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    
    const eventTypes = searchParams.get('eventTypes')?.split(',') as AuditEventType[] | undefined
    const severity = searchParams.get('severity')?.split(',') as AuditSeverity[] | undefined
    const userId = searchParams.get('userId') || undefined
    const ipAddress = searchParams.get('ipAddress') || undefined
    const resource = searchParams.get('resource') || undefined
    const outcome = searchParams.get('outcome') as 'SUCCESS' | 'FAILURE' | 'PARTIAL' | undefined
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Validate parameters
    if (limit > 1000) {
      return NextResponse.json(
        { error: 'Limit cannot exceed 1000' },
        { status: 400 }
      )
    }

    // Search audit events
    const result = await AuditQueryService.searchEvents({
      eventTypes,
      severity,
      userId,
      ipAddress,
      resource,
      outcome,
      startDate,
      endDate,
      limit,
      offset
    })

    const duration = Date.now() - startTime

    await logger.info('Audit events retrieved', {
      userId: session.user.id,
      filters: {
        eventTypes,
        severity,
        userId: userId,
        ipAddress,
        resource,
        outcome,
        startDate,
        endDate
      },
      resultCount: result.events.length,
      totalCount: result.total,
      duration
    })

    return NextResponse.json({
      events: result.events,
      pagination: {
        limit,
        offset,
        total: result.total,
        hasMore: offset + limit < result.total
      },
      timestamp: Date.now()
    })

  } catch (error) {
    const duration = Date.now() - startTime
    
    await logger.error('Failed to retrieve audit events', error as Error, {
      duration,
      userId: session?.user?.id
    })

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get audit statistics
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const hasPermission = await checkPermission(session.user.id, 'audit', 'read')
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { timeRangeHours = 24, statsType = 'general' } = body

    let result: any

    switch (statsType) {
      case 'general':
        result = await AuditQueryService.getStatistics(timeRangeHours)
        break
        
      case 'user':
        if (!body.userId) {
          return NextResponse.json(
            { error: 'User ID required for user statistics' },
            { status: 400 }
          )
        }
        result = {
          userAuditTrail: await AuditQueryService.getUserAuditTrail(body.userId, body.limit || 100)
        }
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid statistics type' },
          { status: 400 }
        )
    }

    const duration = Date.now() - startTime

    await logger.info('Audit statistics retrieved', {
      userId: session.user.id,
      statsType,
      timeRangeHours,
      duration
    })

    return NextResponse.json({
      statistics: result,
      timeRangeHours,
      timestamp: Date.now()
    })

  } catch (error) {
    const duration = Date.now() - startTime
    
    await logger.error('Failed to retrieve audit statistics', error as Error, {
      duration,
      userId: session?.user?.id
    })

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}