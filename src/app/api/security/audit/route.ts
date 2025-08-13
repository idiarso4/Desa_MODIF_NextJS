// Security audit API endpoints
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { checkServerPermission } from '@/lib/rbac/server-utils'
import { auditSystem, AuditEventType, RiskLevel } from '@/lib/security/audit-system'
import { z } from 'zod'

// Validation schemas
const auditQuerySchema = z.object({
  eventType: z.nativeEnum(AuditEventType).optional(),
  riskLevel: z.nativeEnum(RiskLevel).optional(),
  userId: z.string().uuid().optional(),
  ipAddress: z.string().ip().optional(),
  resource: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50)
})

const createAuditEventSchema = z.object({
  eventType: z.nativeEnum(AuditEventType),
  riskLevel: z.nativeEnum(RiskLevel),
  userId: z.string().uuid().optional(),
  resource: z.string().optional(),
  resourceId: z.string().optional(),
  action: z.string().min(1).max(100),
  outcome: z.enum(['SUCCESS', 'FAILURE', 'PARTIAL']),
  details: z.record(z.any()).default({}),
  metadata: z.record(z.any()).optional()
})

// GET /api/security/audit - Query audit logs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    const hasPermission = await checkServerPermission('security', 'read')
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    
    const validatedParams = auditQuerySchema.parse(queryParams)

    // Get audit logs
    const auditLogs = await queryAuditLogs(validatedParams)
    const statistics = await auditSystem.getAuditStatistics(24)

    return NextResponse.json({
      success: true,
      data: {
        logs: auditLogs.logs,
        pagination: auditLogs.pagination,
        statistics
      }
    })

  } catch (error) {
    console.error('Audit query error:', error)
    
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

// POST /api/security/audit - Create audit event (for testing or manual logging)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    const hasPermission = await checkServerPermission('security', 'create')
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createAuditEventSchema.parse(body)

    // Get client IP
    const ipAddress = getClientIP(request)

    // Log audit event
    await auditSystem.logEvent({
      ...validatedData,
      ipAddress,
      userAgent: request.headers.get('user-agent') || undefined,
      sessionId: request.cookies.get('session-id')?.value
    })

    return NextResponse.json({
      success: true,
      message: 'Audit event logged successfully'
    })

  } catch (error) {
    console.error('Audit creation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid audit data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to query audit logs
async function queryAuditLogs(params: z.infer<typeof auditQuerySchema>) {
  const { prisma } = await import('@/lib/db')
  
  // Build where clause
  const where: any = {}
  
  if (params.eventType) where.eventType = params.eventType
  if (params.riskLevel) where.riskLevel = params.riskLevel
  if (params.userId) where.userId = params.userId
  if (params.ipAddress) where.ipAddress = params.ipAddress
  if (params.resource) where.resource = params.resource
  
  if (params.startDate || params.endDate) {
    where.timestamp = {}
    if (params.startDate) where.timestamp.gte = new Date(params.startDate)
    if (params.endDate) where.timestamp.lte = new Date(params.endDate)
  }

  // Get total count
  const total = await prisma.auditLog.count({ where })

  // Get logs with pagination
  const logs = await prisma.auditLog.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          username: true,
          name: true
        }
      }
    },
    orderBy: { timestamp: 'desc' },
    skip: (params.page - 1) * params.limit,
    take: params.limit
  })

  return {
    logs,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      pages: Math.ceil(total / params.limit)
    }
  }
}

// Helper function to get client IP
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  if (cfConnectingIP) return cfConnectingIP
  if (realIP) return realIP
  if (forwarded) return forwarded.split(',')[0].trim()
  
  return request.ip || 'unknown'
}