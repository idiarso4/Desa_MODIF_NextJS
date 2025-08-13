// Comprehensive audit and security monitoring system
import { prisma } from '@/lib/db'
import { logger, LogCategory } from '@/lib/monitoring/logger'
import { cacheManager } from '@/lib/cache/redis'

// Audit event types
export enum AuditEventType {
  // Authentication events
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PASSWORD_RESET_REQUESTED = 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_COMPLETED = 'PASSWORD_RESET_COMPLETED',
  
  // Authorization events
  ACCESS_GRANTED = 'ACCESS_GRANTED',
  ACCESS_DENIED = 'ACCESS_DENIED',
  PERMISSION_CHANGED = 'PERMISSION_CHANGED',
  ROLE_ASSIGNED = 'ROLE_ASSIGNED',
  ROLE_REMOVED = 'ROLE_REMOVED',
  
  // Data events
  DATA_CREATED = 'DATA_CREATED',
  DATA_UPDATED = 'DATA_UPDATED',
  DATA_DELETED = 'DATA_DELETED',
  DATA_VIEWED = 'DATA_VIEWED',
  DATA_EXPORTED = 'DATA_EXPORTED',
  DATA_IMPORTED = 'DATA_IMPORTED',
  
  // System events
  SYSTEM_STARTUP = 'SYSTEM_STARTUP',
  SYSTEM_SHUTDOWN = 'SYSTEM_SHUTDOWN',
  CONFIGURATION_CHANGED = 'CONFIGURATION_CHANGED',
  BACKUP_CREATED = 'BACKUP_CREATED',
  BACKUP_RESTORED = 'BACKUP_RESTORED',
  
  // Security events
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  CSRF_ATTACK_DETECTED = 'CSRF_ATTACK_DETECTED',
  SQL_INJECTION_ATTEMPT = 'SQL_INJECTION_ATTEMPT',
  XSS_ATTEMPT = 'XSS_ATTEMPT',
  UNAUTHORIZED_ACCESS_ATTEMPT = 'UNAUTHORIZED_ACCESS_ATTEMPT',
  
  // File events
  FILE_UPLOADED = 'FILE_UPLOADED',
  FILE_DOWNLOADED = 'FILE_DOWNLOADED',
  FILE_DELETED = 'FILE_DELETED',
  MALICIOUS_FILE_DETECTED = 'MALICIOUS_FILE_DETECTED'
}

// Risk levels
export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Audit entry interface
export interface AuditEntry {
  id?: string
  eventType: AuditEventType
  riskLevel: RiskLevel
  userId?: string
  sessionId?: string
  ipAddress: string
  userAgent?: string
  resource?: string
  resourceId?: string
  action: string
  outcome: 'SUCCESS' | 'FAILURE' | 'PARTIAL'
  details: Record<string, any>
  timestamp: Date
  metadata?: Record<string, any>
}

// Security alert interface
export interface SecurityAlert {
  id?: string
  alertType: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  title: string
  description: string
  source: string
  ipAddress?: string
  userId?: string
  count: number
  firstSeen: Date
  lastSeen: Date
  resolved: boolean
  resolvedBy?: string
  resolvedAt?: Date
  metadata?: Record<string, any>
}

// Audit system class
export class AuditSystem {
  // Log audit event
  async logEvent(entry: Omit<AuditEntry, 'id' | 'timestamp'>): Promise<void> {
    try {
      // Create audit entry in database
      const auditEntry = await prisma.auditLog.create({
        data: {
          eventType: entry.eventType,
          riskLevel: entry.riskLevel,
          userId: entry.userId,
          sessionId: entry.sessionId,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          resource: entry.resource,
          resourceId: entry.resourceId,
          action: entry.action,
          outcome: entry.outcome,
          details: entry.details,
          metadata: entry.metadata,
          timestamp: new Date()
        }
      })

      // Log to application logger
      logger.log({
        level: this.getRiskLogLevel(entry.riskLevel),
        category: LogCategory.SECURITY,
        message: `Audit: ${entry.eventType} - ${entry.action}`,
        userId: entry.userId,
        ip: entry.ipAddress,
        metadata: {
          auditId: auditEntry.id,
          eventType: entry.eventType,
          riskLevel: entry.riskLevel,
          resource: entry.resource,
          resourceId: entry.resourceId,
          outcome: entry.outcome,
          ...entry.details
        }
      })

      // Check for security patterns
      await this.analyzeSecurityPatterns(entry)

      // Cache recent high-risk events
      if (entry.riskLevel === RiskLevel.HIGH || entry.riskLevel === RiskLevel.CRITICAL) {
        await this.cacheHighRiskEvent(auditEntry.id, entry)
      }

    } catch (error) {
      console.error('Failed to log audit event:', error)
      // Fallback to application logger
      logger.error('Audit logging failed', error instanceof Error ? error : undefined, {
        eventType: entry.eventType,
        action: entry.action,
        userId: entry.userId
      })
    }
  }

  // Analyze security patterns and generate alerts
  private async analyzeSecurityPatterns(entry: Omit<AuditEntry, 'id' | 'timestamp'>): Promise<void> {
    // Check for multiple failed login attempts
    if (entry.eventType === AuditEventType.LOGIN_FAILED) {
      await this.checkFailedLoginPattern(entry.ipAddress, entry.userId)
    }

    // Check for suspicious data access patterns
    if (entry.eventType === AuditEventType.DATA_VIEWED && entry.riskLevel === RiskLevel.HIGH) {
      await this.checkSuspiciousDataAccess(entry.userId, entry.resource)
    }

    // Check for privilege escalation attempts
    if (entry.eventType === AuditEventType.ACCESS_DENIED) {
      await this.checkPrivilegeEscalation(entry.userId, entry.resource)
    }

    // Check for bulk operations
    if (entry.eventType === AuditEventType.DATA_EXPORTED) {
      await this.checkBulkDataAccess(entry.userId, entry.details)
    }
  }

  // Check failed login patterns
  private async checkFailedLoginPattern(ipAddress: string, userId?: string): Promise<void> {
    const timeWindow = 15 * 60 * 1000 // 15 minutes
    const threshold = 5
    const since = new Date(Date.now() - timeWindow)

    // Count failed attempts from IP
    const ipFailures = await prisma.auditLog.count({
      where: {
        eventType: AuditEventType.LOGIN_FAILED,
        ipAddress,
        timestamp: { gte: since }
      }
    })

    if (ipFailures >= threshold) {
      await this.createSecurityAlert({
        alertType: 'BRUTE_FORCE_ATTACK',
        severity: 'HIGH',
        title: 'Brute Force Attack Detected',
        description: `${ipFailures} failed login attempts from IP ${ipAddress} in the last 15 minutes`,
        source: 'audit_system',
        ipAddress,
        userId,
        count: ipFailures,
        firstSeen: since,
        lastSeen: new Date(),
        resolved: false
      })
    }
  }

  // Check suspicious data access
  private async checkSuspiciousDataAccess(userId?: string, resource?: string): Promise<void> {
    if (!userId || !resource) return

    const timeWindow = 60 * 60 * 1000 // 1 hour
    const threshold = 100
    const since = new Date(Date.now() - timeWindow)

    const accessCount = await prisma.auditLog.count({
      where: {
        eventType: AuditEventType.DATA_VIEWED,
        userId,
        resource,
        timestamp: { gte: since }
      }
    })

    if (accessCount >= threshold) {
      await this.createSecurityAlert({
        alertType: 'SUSPICIOUS_DATA_ACCESS',
        severity: 'MEDIUM',
        title: 'Suspicious Data Access Pattern',
        description: `User accessed ${resource} ${accessCount} times in the last hour`,
        source: 'audit_system',
        userId,
        count: accessCount,
        firstSeen: since,
        lastSeen: new Date(),
        resolved: false
      })
    }
  }

  // Check privilege escalation attempts
  private async checkPrivilegeEscalation(userId?: string, resource?: string): Promise<void> {
    if (!userId) return

    const timeWindow = 30 * 60 * 1000 // 30 minutes
    const threshold = 10
    const since = new Date(Date.now() - timeWindow)

    const deniedCount = await prisma.auditLog.count({
      where: {
        eventType: AuditEventType.ACCESS_DENIED,
        userId,
        timestamp: { gte: since }
      }
    })

    if (deniedCount >= threshold) {
      await this.createSecurityAlert({
        alertType: 'PRIVILEGE_ESCALATION_ATTEMPT',
        severity: 'HIGH',
        title: 'Privilege Escalation Attempt',
        description: `User attempted to access restricted resources ${deniedCount} times`,
        source: 'audit_system',
        userId,
        count: deniedCount,
        firstSeen: since,
        lastSeen: new Date(),
        resolved: false
      })
    }
  }

  // Check bulk data access
  private async checkBulkDataAccess(userId?: string, details: Record<string, any>): Promise<void> {
    if (!userId) return

    const recordCount = details.recordCount || 0
    const threshold = 1000

    if (recordCount >= threshold) {
      await this.createSecurityAlert({
        alertType: 'BULK_DATA_EXPORT',
        severity: 'MEDIUM',
        title: 'Large Data Export',
        description: `User exported ${recordCount} records`,
        source: 'audit_system',
        userId,
        count: recordCount,
        firstSeen: new Date(),
        lastSeen: new Date(),
        resolved: false,
        metadata: details
      })
    }
  }

  // Create security alert
  async createSecurityAlert(alert: Omit<SecurityAlert, 'id'>): Promise<void> {
    try {
      // Check if similar alert already exists
      const existingAlert = await prisma.securityAlert.findFirst({
        where: {
          alertType: alert.alertType,
          source: alert.source,
          ipAddress: alert.ipAddress,
          userId: alert.userId,
          resolved: false,
          lastSeen: {
            gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
          }
        }
      })

      if (existingAlert) {
        // Update existing alert
        await prisma.securityAlert.update({
          where: { id: existingAlert.id },
          data: {
            count: existingAlert.count + alert.count,
            lastSeen: alert.lastSeen,
            metadata: { ...existingAlert.metadata, ...alert.metadata }
          }
        })
      } else {
        // Create new alert
        await prisma.securityAlert.create({
          data: alert
        })
      }

      // Log critical alerts
      if (alert.severity === 'CRITICAL' || alert.severity === 'HIGH') {
        logger.error(`Security Alert: ${alert.title}`, undefined, {
          alertType: alert.alertType,
          severity: alert.severity,
          description: alert.description,
          userId: alert.userId,
          ipAddress: alert.ipAddress
        })
      }

    } catch (error) {
      console.error('Failed to create security alert:', error)
    }
  }

  // Cache high-risk events for quick access
  private async cacheHighRiskEvent(auditId: string, entry: Omit<AuditEntry, 'id' | 'timestamp'>): Promise<void> {
    const cacheKey = `high_risk_event:${auditId}`
    await cacheManager.set(cacheKey, {
      auditId,
      eventType: entry.eventType,
      riskLevel: entry.riskLevel,
      userId: entry.userId,
      ipAddress: entry.ipAddress,
      action: entry.action,
      timestamp: new Date().toISOString()
    }, 24 * 60 * 60) // 24 hours
  }

  // Get audit statistics
  async getAuditStatistics(timeRangeHours: number = 24): Promise<{
    totalEvents: number
    eventsByType: Record<string, number>
    eventsByRisk: Record<string, number>
    topUsers: Array<{ userId: string; count: number }>
    topIPs: Array<{ ipAddress: string; count: number }>
    securityEvents: number
  }> {
    const since = new Date(Date.now() - (timeRangeHours * 60 * 60 * 1000))

    const [
      totalEvents,
      eventsByType,
      eventsByRisk,
      topUsers,
      topIPs,
      securityEvents
    ] = await Promise.all([
      // Total events
      prisma.auditLog.count({
        where: { timestamp: { gte: since } }
      }),

      // Events by type
      prisma.auditLog.groupBy({
        by: ['eventType'],
        where: { timestamp: { gte: since } },
        _count: { eventType: true }
      }),

      // Events by risk level
      prisma.auditLog.groupBy({
        by: ['riskLevel'],
        where: { timestamp: { gte: since } },
        _count: { riskLevel: true }
      }),

      // Top users
      prisma.auditLog.groupBy({
        by: ['userId'],
        where: { 
          timestamp: { gte: since },
          userId: { not: null }
        },
        _count: { userId: true },
        orderBy: { _count: { userId: 'desc' } },
        take: 10
      }),

      // Top IPs
      prisma.auditLog.groupBy({
        by: ['ipAddress'],
        where: { timestamp: { gte: since } },
        _count: { ipAddress: true },
        orderBy: { _count: { ipAddress: 'desc' } },
        take: 10
      }),

      // Security events count
      prisma.auditLog.count({
        where: {
          timestamp: { gte: since },
          eventType: {
            in: [
              AuditEventType.SUSPICIOUS_ACTIVITY,
              AuditEventType.RATE_LIMIT_EXCEEDED,
              AuditEventType.CSRF_ATTACK_DETECTED,
              AuditEventType.SQL_INJECTION_ATTEMPT,
              AuditEventType.XSS_ATTEMPT,
              AuditEventType.UNAUTHORIZED_ACCESS_ATTEMPT
            ]
          }
        }
      })
    ])

    return {
      totalEvents,
      eventsByType: Object.fromEntries(
        eventsByType.map(item => [item.eventType, item._count.eventType])
      ),
      eventsByRisk: Object.fromEntries(
        eventsByRisk.map(item => [item.riskLevel, item._count.riskLevel])
      ),
      topUsers: topUsers.map(item => ({
        userId: item.userId!,
        count: item._count.userId
      })),
      topIPs: topIPs.map(item => ({
        ipAddress: item.ipAddress,
        count: item._count.ipAddress
      })),
      securityEvents
    }
  }

  // Get security alerts
  async getSecurityAlerts(options: {
    resolved?: boolean
    severity?: string[]
    limit?: number
    offset?: number
  } = {}): Promise<{
    alerts: SecurityAlert[]
    total: number
  }> {
    const {
      resolved,
      severity,
      limit = 50,
      offset = 0
    } = options

    const where: any = {}
    if (resolved !== undefined) where.resolved = resolved
    if (severity?.length) where.severity = { in: severity }

    const [alerts, total] = await Promise.all([
      prisma.securityAlert.findMany({
        where,
        orderBy: { lastSeen: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.securityAlert.count({ where })
    ])

    return { alerts, total }
  }

  // Resolve security alert
  async resolveAlert(alertId: string, resolvedBy: string, notes?: string): Promise<void> {
    await prisma.securityAlert.update({
      where: { id: alertId },
      data: {
        resolved: true,
        resolvedBy,
        resolvedAt: new Date(),
        metadata: notes ? { resolveNotes: notes } : undefined
      }
    })

    // Log the resolution
    await this.logEvent({
      eventType: AuditEventType.SYSTEM_STARTUP, // Would need ALERT_RESOLVED type
      riskLevel: RiskLevel.LOW,
      userId: resolvedBy,
      ipAddress: 'system',
      action: 'RESOLVE_ALERT',
      outcome: 'SUCCESS',
      resource: 'security_alert',
      resourceId: alertId,
      details: { notes }
    })
  }

  // Helper method to convert risk level to log level
  private getRiskLogLevel(riskLevel: RiskLevel): 'error' | 'warn' | 'info' | 'debug' {
    switch (riskLevel) {
      case RiskLevel.CRITICAL:
      case RiskLevel.HIGH:
        return 'error'
      case RiskLevel.MEDIUM:
        return 'warn'
      case RiskLevel.LOW:
      default:
        return 'info'
    }
  }
}

// Audit helper functions
export class AuditHelpers {
  private static auditSystem = new AuditSystem()

  // Authentication audit helpers
  static async logLoginSuccess(userId: string, ipAddress: string, userAgent?: string, sessionId?: string): Promise<void> {
    await this.auditSystem.logEvent({
      eventType: AuditEventType.LOGIN_SUCCESS,
      riskLevel: RiskLevel.LOW,
      userId,
      sessionId,
      ipAddress,
      userAgent,
      action: 'LOGIN',
      outcome: 'SUCCESS',
      details: { timestamp: new Date().toISOString() }
    })
  }

  static async logLoginFailure(username: string, ipAddress: string, reason: string, userAgent?: string): Promise<void> {
    await this.auditSystem.logEvent({
      eventType: AuditEventType.LOGIN_FAILED,
      riskLevel: RiskLevel.MEDIUM,
      ipAddress,
      userAgent,
      action: 'LOGIN',
      outcome: 'FAILURE',
      details: { username, reason, timestamp: new Date().toISOString() }
    })
  }

  // Data access audit helpers
  static async logDataAccess(
    userId: string,
    resource: string,
    resourceId: string,
    action: string,
    ipAddress: string,
    sensitive: boolean = false
  ): Promise<void> {
    await this.auditSystem.logEvent({
      eventType: AuditEventType.DATA_VIEWED,
      riskLevel: sensitive ? RiskLevel.MEDIUM : RiskLevel.LOW,
      userId,
      ipAddress,
      resource,
      resourceId,
      action,
      outcome: 'SUCCESS',
      details: { sensitive, timestamp: new Date().toISOString() }
    })
  }

  // Security event helpers
  static async logSecurityEvent(
    eventType: AuditEventType,
    ipAddress: string,
    details: Record<string, any>,
    userId?: string
  ): Promise<void> {
    await this.auditSystem.logEvent({
      eventType,
      riskLevel: RiskLevel.HIGH,
      userId,
      ipAddress,
      action: 'SECURITY_EVENT',
      outcome: 'FAILURE',
      details
    })
  }
}

// Export singleton instance
export const auditSystem = new AuditSystem()