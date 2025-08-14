import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { checkPermission } from '@/lib/rbac/server-utils'
import { analytics } from '@/lib/monitoring/analytics'
import { z } from 'zod'

const analyticsQuerySchema = z.object({
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
  type: z.enum(['users', 'system', 'features']).optional().default('users')
})

// GET /api/monitoring/analytics
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
    const query = analyticsQuerySchema.parse({
      startDate: searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: searchParams.get('endDate') || new Date().toISOString(),
      type: searchParams.get('type') || 'users'
    })

    let data

    switch (query.type) {
      case 'users':
        data = await analytics.getUserAnalytics(query.startDate, query.endDate)
        break
      case 'system':
        data = await analytics.getSystemAnalytics(query.startDate, query.endDate)
        break
      case 'features':
        data = await analytics.getFeatureUsage(query.startDate, query.endDate)
        break
      default:
        return NextResponse.json({ error: 'Invalid analytics type' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data,
      period: {
        startDate: query.startDate,
        endDate: query.endDate
      }
    })

  } catch (error) {
    console.error('Get analytics error:', error)
    
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

// POST /api/monitoring/analytics - Track custom event
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { event, properties } = body

    if (!event) {
      return NextResponse.json({ error: 'Event name is required' }, { status: 400 })
    }

    await analytics.trackEvent({
      event,
      userId: session.user.id,
      properties
    })

    return NextResponse.json({
      success: true,
      message: 'Event tracked successfully'
    })

  } catch (error) {
    console.error('Track analytics event error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}