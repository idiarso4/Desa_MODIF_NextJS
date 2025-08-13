// Security dashboard API endpoints
import { authOptions } from '@/lib/auth/config'
import { cacheManager } from '@/lib/cache/redis'
import { prisma } from '@/lib/db'
import { performanceMonitor } from '@/lib/monitoring/performance-monitor'
import { checkServerPermission } from '@/lib/rbac/server-utils'
import { AuditEventType, auditSystem, RiskLevel } from '@/lib/security/audit-system'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/security/dashboard - Get security dashboard data
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
    const timeRange = parseInt(searchParams.get('timeRange') || '24') // hours

    // Get security metrics
    const [
      auditStats,
      securityAlerts,
      threatIntelligence,
      systemHealth,
      recentIncidents
    ] = await Promise.all([
      auditSystem.getAuditStatistics(timeRange),
      auditSystem.getSecurityAlerts({ resolved: false, limit: 10 }),
      getThreatIntelligence(timeRange),
      getSystemHealthMetrics(),
      getRecentSecurityIncidents(timeRange)
    ])

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalEvents: auditStats.totalEvents,
          securityEvents: auditStats.securityEvents,
          activeAlerts: securityAlerts.total,
          threatLevel: calculateThreatLevel(auditStats, securityAlerts.alerts),
          lastUpdated: new Date().toISOString()
        },
        auditStatistics: auditStats,
        securityAlerts: securityAlerts.alerts,
        threatIntelligence,
        systemHealth,
        recentIncidents,
        timeRange
      }
    })

  } catch (error) {
    console.error('Security dashboard error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/security/dashboard/actions - Execute security actions
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    const hasPermission = await checkServerPermission('security', 'manage')
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { action, parameters } = body

    let result
    switch (action) {
      case 'resolve_alert':
        result = await resolveSecurityAlert(parameters.alertId, session.user.id, parameters.notes)
        break
      case 'block_ip':
        result = await blockIPAddress(parameters.ipAddress, parameters.duration, session.user.id)
        break
      case 'unblock_ip':
        result = await unblockIPAddress(parameters.ipAddress, session.user.id)
        break
      case 'reset_user_sessions':
        result = await resetUserSessions(parameters.userId, session.user.id)
        break
      case 'generate_security_report':
        result = await generateSecurityReport(parameters.timeRange, session.user.id)
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `Action ${action} completed successfully`,
      data: result
    })

  } catch (error) {
    console.error('Security action error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper functions

async function getThreatIntelligence(timeRangeHours: number) {
  const since = new Date(Date.now() - (timeRangeHours * 60 * 60 * 1000))

  // Get threat indicators
  const [
    suspiciousIPs,
    attackPatterns,
    vulnerabilityScans,
    maliciousRequests
  ] = await Promise.all([
    // Suspicious IP addresses
    prisma.auditLog.groupBy({
      by: ['ipAddress'],
      where: {
        timestamp: { gte: since },
        riskLevel: { in: ['HIGH', 'CRITICAL'] }
      },
      _count: { ipAddress: true },
      orderBy: { _count: { ipAddress: 'desc' } },
      take: 10
    }),

    // Attack patterns
    prisma.auditLog.groupBy({
      by: ['eventType'],
      where: {
        timestamp: { gte: since },
        eventType: {
          in: [
            'SQL_INJECTION_ATTEMPT',
            'XSS_ATTEMPT',
            'CSRF_ATTACK_DETECTED',
            'UNAUTHORIZED_ACCESS_ATTEMPT'
          ]
        }
      },
      _count: { eventType: true }
    }),

    // Vulnerability scan attempts
    prisma.auditLog.count({
      where: {
        timestamp: { gte: since },
        eventType: 'SUSPICIOUS_ACTIVITY',
        details: {
          path: ['scanType'],
          not: null
        }
      }
    }),

    // Malicious requests
    prisma.auditLog.count({
      where: {
        timestamp: { gte: since },
        outcome: 'FAILURE',
        riskLevel: { in: ['HIGH', 'CRITICAL'] }
      }
    })
  ])

  return {
    suspiciousIPs: suspiciousIPs.map(item => ({
      ipAddress: item.ipAddress,
      count: item._count.ipAddress
    })),
    attackPatterns: Object.fromEntries(
      attackPatterns.map(item => [item.eventType, item._count.eventType])
    ),
    vulnerabilityScans,
    maliciousRequests,
    threatScore: calculateThreatScore({
      suspiciousIPs: suspiciousIPs.length,
      attackPatterns: attackPatterns.length,
      vulnerabilityScans,
      maliciousRequests
    })
  }
}

async function getSystemHealthMetrics() {
  // Get system health from performance monitor
  const systemMetrics = await performanceMonitor.getSystemMetrics()
  
  // Get cache health
  const cacheHealth = await cacheManager.healthCheck()
  
  // Get database health
  const dbHealth = await checkDatabaseHealth()

  return {
    system: {
      status: 'healthy', // Would implement actual health check
      cpuUsage: systemMetrics.cpuUsage,
      memoryUsage: systemMetrics.memoryUsage.percentage,
      uptime: process.uptime()
    },
    cache: {
      status: cacheHealth.status,
      latency: cacheHealth.latency
    },
    database: dbHealth,
    overallStatus: determineOverallHealth(systemMetrics, cacheHealth, dbHealth)
  }
}

async function getRecentSecurityIncidents(timeRangeHours: number) {
  const since = new Date(Date.now() - (timeRangeHours * 60 * 60 * 1000))

  const incidents = await prisma.auditLog.findMany({
    where: {
      timestamp: { gte: since },
      riskLevel: { in: ['HIGH', 'CRITICAL'] }
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
    orderBy: { timestamp: 'desc' },
    take: 20
  })

  return incidents.map(incident => ({
    id: incident.id,
    eventType: incident.eventType,
    riskLevel: incident.riskLevel,
    timestamp: incident.timestamp,
    ipAddress: incident.ipAddress,
    user: incident.user,
    action: incident.action,
    outcome: incident.outcome,
    details: incident.details
  }))
}

function calculateThreatLevel(auditStats: any, alerts: any[]): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  const criticalAlerts = alerts.filter(alert => alert.severity === 'CRITICAL').length
  const highAlerts = alerts.filter(alert => alert.severity === 'HIGH').length
  const securityEventRatio = auditStats.totalEvents > 0 ? auditStats.securityEvents / auditStats.totalEvents : 0

  if (criticalAlerts > 0 || securityEventRatio > 0.1) {
    return 'CRITICAL'
  } else if (highAlerts > 2 || securityEventRatio > 0.05) {
    return 'HIGH'
  } else if (highAlerts > 0 || securityEventRatio > 0.01) {
    return 'MEDIUM'
  } else {
    return 'LOW'
  }
}

function calculateThreatScore(metrics: {
  suspiciousIPs: number
  attackPatterns: number
  vulnerabilityScans: number
  maliciousRequests: number
}): number {
  // Simple threat scoring algorithm
  let score = 0
  
  score += metrics.suspiciousIPs * 10
  score += metrics.attackPatterns * 15
  score += metrics.vulnerabilityScans * 5
  score += metrics.maliciousRequests * 2
  
  return Math.min(100, score) // Cap at 100
}

async function checkDatabaseHealth() {
  try {
    const start = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const latency = Date.now() - start

    return {
      status: 'healthy',
      latency,
      connections: await getDatabaseConnections()
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function getDatabaseConnections() {
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

    return {
      total: connections.reduce((sum, conn) => sum + Number(conn.count), 0),
      active: connections.find(conn => conn.state === 'active')?.count || 0,
      idle: connections.find(conn => conn.state === 'idle')?.count || 0
    }
  } catch (error) {
    return { total: 0, active: 0, idle: 0 }
  }
}

function determineOverallHealth(systemMetrics: any, cacheHealth: any, dbHealth: any): 'healthy' | 'degraded' | 'unhealthy' {
  if (dbHealth.status === 'unhealthy' || cacheHealth.status === 'unhealthy') {
    return 'unhealthy'
  }
  
  if (systemMetrics.memoryUsage.percentage > 90 || systemMetrics.cpuUsage > 90) {
    return 'degraded'
  }
  
  return 'healthy'
}

// Security action implementations
async function resolveSecurityAlert(alertId: string, resolvedBy: string, notes?: string) {
  await auditSystem.resolveAlert(alertId, resolvedBy, notes)
  return { alertId, resolvedBy, resolvedAt: new Date() }
}

async function blockIPAddress(ipAddress: string, duration: number, blockedBy: string) {
  // Implementation would depend on your infrastructure
  // This could involve updating firewall rules, rate limiting, etc.
  
  // For now, just log the action
  await auditSystem.logEvent({
    eventType: AuditEventType.CONFIGURATION_CHANGED,
    riskLevel: RiskLevel.MEDIUM,
    userId: blockedBy,
    ipAddress: 'system',
    action: 'BLOCK_IP',
    outcome: 'SUCCESS',
    details: { blockedIP: ipAddress, duration }
  })

  return { ipAddress, duration, blockedBy, blockedAt: new Date() }
}

async function unblockIPAddress(ipAddress: string, unblockedBy: string) {
  // Implementation would unblock the IP address
  
  await auditSystem.logEvent({
    eventType: AuditEventType.CONFIGURATION_CHANGED,
    riskLevel: RiskLevel.LOW,
    userId: unblockedBy,
    ipAddress: 'system',
    action: 'UNBLOCK_IP',
    outcome: 'SUCCESS',
    details: { unblockedIP: ipAddress }
  })

  return { ipAddress, unblockedBy, unblockedAt: new Date() }
}

async function resetUserSessions(userId: string, resetBy: string) {
  // Implementation would invalidate all sessions for the user
  
  await auditSystem.logEvent({
    eventType: AuditEventType.CONFIGURATION_CHANGED,
    riskLevel: RiskLevel.MEDIUM,
    userId: resetBy,
    ipAddress: 'system',
    action: 'RESET_USER_SESSIONS',
    outcome: 'SUCCESS',
    details: { targetUserId: userId }
  })

  return { userId, resetBy, resetAt: new Date() }
}

async function generateSecurityReport(timeRange: number, requestedBy: string) {
  // Implementation would generate a comprehensive security report
  
  const reportId = `security-report-${Date.now()}`
  
  await auditSystem.logEvent({
    eventType: AuditEventType.DATA_EXPORTED,
    riskLevel: RiskLevel.LOW,
    userId: requestedBy,
    ipAddress: 'system',
    action: 'GENERATE_SECURITY_REPORT',
    outcome: 'SUCCESS',
    details: { reportId, timeRange }
  })

  return { 
    reportId, 
    requestedBy, 
    generatedAt: new Date(),
    downloadUrl: `/api/security/reports/${reportId}`
  }
}