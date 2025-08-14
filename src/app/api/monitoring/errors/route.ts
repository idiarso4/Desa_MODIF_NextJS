import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { checkPermission } from '@/lib/rbac/server-utils'
import { errorTracker } from '@/lib/monitoring/error-tracker'
import { z } from 'zod'

const errorQuerySchema = z.object({
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
  context: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  resolved: z.boolean().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20)
})

const trackErrorSchema = z.object({
  message: z.string().min(1),
  stack: z.string().optional(),
  context: z.string().min(1),
  url: z.string().optional(),
  userAgent: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  metadata: z.record(z.any()).optional()
})

// GET /api/monitoring/errors
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
    const query = errorQuerySchema.parse({
      startDate: searchParams.get('startDate') || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: searchParams.get('endDate') || new Date().toISOString(),
      context: searchParams.get('context') || undefined,
      severity: searchParams.get('severity') || undefined,
      resolved: searchParams.get('resolved') ? searchParams.get('resolved') === 'true' : undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20')
    })

    // Check if requesting stats
    if (searchParams.get('stats') === 'true') {
      const stats = await errorTracker.getErrorStats(query.startDate, query.endDate)
      return NextResponse.json({
        success: true,
        data: stats
      })
    }

    // Get error list with filters
    const errors = await prisma.errorLog.findMany({
      where: {
        timestamp: {
          gte: query.startDate,
          lte: query.endDate
        },
        ...(query.context && { context: query.context }),
        ...(query.severity && { severity: query.severity }),
        ...(query.resolved !== undefined && { resolved: query.resolved })
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      skip: (query.page - 1) * query.limit,
      take: query.limit
    })

    // Get total count
    const total = await prisma.errorLog.count({
      where: {
        timestamp: {
          gte: query.startDate,
          lte: query.endDate
        },
        ...(query.context && { context: query.context }),
        ...(query.severity && { severity: query.severity }),
        ...(query.resolved !== undefined && { resolved: query.resolved })
      }
    })

    return NextResponse.json({
      success: true,
      data: errors,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit)
      }
    })

  } catch (error) {
    console.error('Get errors error:', error)
    
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

// POST /api/monitoring/errors - Track client-side error
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    const data = trackErrorSchema.parse(body)

    await errorTracker.trackError({
      ...data,
      userId: session?.user?.id,
      sessionId: session?.user?.id, // Use user ID as session ID for simplicity
      userAgent: request.headers.get('user-agent') || undefined,
      timestamp: new Date()
    })

    return NextResponse.json({
      success: true,
      message: 'Error tracked successfully'
    })

  } catch (error) {
    console.error('Track error failed:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid error data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}