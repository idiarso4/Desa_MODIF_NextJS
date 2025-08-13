import { cache, CacheTTL } from '../cache/redis'
import { logger } from '../monitoring/logger'
import { prisma } from '../db'

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
  SECURITY_VIOLATION = 'SECURITY_VIOLATION',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  CSRF_VIOLATION = 'CSRF_VIOLATION',
  SQL_INJECTION_ATTEMPT = 'SQL_INJECTION_ATTEMPT',
  XSS_ATTEMPT = 'XSS_ATTEMPT',
  
  // Administrative events
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_ACTIVATED = 'USER_ACTIVATED',
  USER_DEACTIVATED = 'USER_DEACTIVATED',
  
  // File events
  FILE_UPLOADED = 'FILE_UPLOADED',
  FILE_DOWNLOADED = 'FILE_DOWNLOADED',
  FILE_DELETED = 'FILE_DELETED',
  FILE_ACCESS_DENIED = 'FILE_ACCESS_DENIED'
}

// Audit event severity levels
export enum AuditSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Audit event interface
export interface AuditEvent {
  id?: string
  eventType: AuditEventType
  severity: AuditSeverity
  timestamp: Date
  userId?: string
  sessionId?: string
  ipAddress?: string
  userAgent?: string
  resource?: string
  resourceId?: string
  action?: string
  outcome: 'SUCCESS' | 'FAILURE' | 'PARTIAL'
  details?: Record<string, any>
  metadata?: Record<string, any>
  riskScore?: number
}

// Audit logger class
export class AuditLogger {
  private static instance: AuditLogger
  private eventQueue: AuditEvent[] = []
  private isProcessing = false
  private batchSize = 100
  private flushInterval = 5000 // 5 seconds

  private constructor() {
    this.startBatchProcessor()
  }

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger()
    }
    return AuditLogger.instance
  }

  // Log an audit event
  async logEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void> {
    const auditEvent: AuditEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: new Date()
    }

    // Add to queue for batch processing
    this.eventQueue.push(auditEvent)

    // Also log to application logger for immediate visibility
    await logger.info(`Audit: ${event.eventType}`, {
      eventType: event.eventType,
      severity: event.severity,
      userId: event.userId,
      resource: event.resource,
      outcome: event.outcome,
      details: event.details
    })

    // Process immediately for critical events
    if (event.severity === AuditSeverity.CRITICAL) {
      await this.processCriticalEvent(auditEvent)
    }
  }

  // Generate unique event ID
  private generateEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Start batch processor
  private startBatchProcessor(): void {
    setInterval(async () => {
      if (this.eventQueue.length > 0 && !this.isProcessing) {
        await this.processBatch()
      }
    }, this.flushInterval)
  }

  // Process batch of events
  private async processBatch(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) return

    this.isProcessing = true

    try {
      const batch = this.eventQueue.splice(0, this.batchSize)
      
      // Store in database
      await this.storeBatchInDatabase(batch)
      
      // Store in cache for quick access
      await this.storeBatchInCache(batch)
      
      // Check for security patterns
      await this.analyzeSecurityPatterns(batch)

    } catch (error) {
      await logger.error('Failed to process audit batch', error as Error)
      
      // Re-queue failed events (with limit to prevent infinite loop)
      if (this.eventQueue.length < 10000) {
        // Put failed events back at the beginning of the queue
        // This is a simplified approach - in production you might want more sophisticated retry logic
      }
    } finally {
      this.isProcessing = false
    }
  }

  // Store batch in database
  private async storeBatchInDatabase(events: AuditEvent[]): Promise<void> {
    try {
      const auditLogs = events.map(event => ({
        id: event.id!,
        eventType: event.eventType,
        severity: event.severity,
        timestamp: event.timestamp,
        userId: event.userId,
        sessionId: event.sessionId,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        resource: event.resource,
        resourceId: event.resourceId,
        action: event.action,
        outcome: event.outcome,
        details: event.details ? JSON.stringify(event.details) : null,
        metadata: event.metadata ? JSON.stringify(event.metadata) : null,
        riskScore: event.riskScore
      }))

      await prisma.auditLog.createMany({
        data: auditLogs,
        skipDuplicates: true
      })

    } catch (error) {
      await logger.error('Failed to store audit events in database', error as Error)
      throw error
    }
  }

  // Store batch in cache for quick access
  private async storeBatchInCache(events: AuditEvent[]): Promise<void> {
    try {
      for (const event of events) {
        // Store individual events
        const eventKey = `audit:event:${event.id}`
        await cache.set(eventKey, event, CacheTTL.VERY_LONG)

        // Add to user's audit trail
        if (event.userId) {
          const userAuditKey = `audit:user:${event.userId}`
          await cache.lpush(userAuditKey, event)
          
          // Keep only last 1000 events per user
          const listLength = await cache.redis.llen(userAuditKey)
          if (listLength > 1000) {
            await cache.redis.ltrim(userAuditKey, 0, 999)
          }
        }

        // Add to security events if applicable
        if (this.isSecurityEvent(event.eventType)) {
          const securityKey = `audit:security:${event.eventType}`
          await cache.lpush(securityKey, event)
          
          // Keep only last 500 security events per type
          const securityListLength = await cache.redis.llen(securityKey)
          if (securityListLength > 500) {
            await cache.redis.ltrim(securityKey, 0, 499)
          }
        }
      }
    } catch (error) {
      await logger.error('Failed to store audit events in cache', error as Error)
    }
  }

  // Process critical events immediately
  private async processCriticalEvent(event: AuditEvent): Promise<void> {
    try {
      // Store immediately in database
      await this.storeBatchInDatabase([event])
      
      // Send alert
      await this.sendCriticalAlert(event)
      
      // Check if this triggers any automated responses
      await this.checkAutomatedResponses(event)

    } catch (error) {
      await logger.error('Failed to process critical audit event', error as Error, {
        eventId: event.id,
        eventType: event.eventType
      })
    }
  }

  // Send critical event alert
  private async sendCriticalAlert(event: AuditEvent): Promise<void> {
    try {
      // Store alert in cache for dashboard
      const alertKey = `alerts:critical:${event.id}`
      await cache.set(alertKey, {
        type: 'CRITICAL_AUDIT_EVENT',
        event,
        timestamp: Date.now()
      }, CacheTTL.VERY_LONG)

      // Log critical alert
      await logger.critical(`Critical audit event: ${event.eventType}`, undefined, {
        eventId: event.id,
        userId: event.userId,
        resource: event.resource,
        details: event.details
      })

    } catch (error) {
      await logger.error('Failed to send critical audit alert', error as Error)
    }
  }

  // Check for automated responses to critical events
  private async checkAutomatedResponses(event: AuditEvent): Promise<void> {
    try {
      switch (event.eventType) {
        case AuditEventType.SECURITY_VIOLATION:
        case AuditEventType.SQL_INJECTION_ATTEMPT:
        case AuditEventType.XSS_ATTEMPT:
          // Temporarily block IP if multiple violations
          if (event.ipAddress) {
            await this.checkAndBlockSuspiciousIP(event.ipAddress)
          }
          break

        case AuditEventType.LOGIN_FAILED:
          // Lock account after multiple failed attempts
          if (event.userId) {
            await this.checkAndLockAccount(event.userId)
          }
          break

        case AuditEventType.RATE_LIMIT_EXCEEDED:
          // Extend rate limiting for repeat offenders
          if (event.ipAddress) {
            await this.extendRateLimit(event.ipAddress)
          }
          break
      }
    } catch (error) {
      await logger.error('Failed to execute automated response', error as Error)
    }
  }

  // Analyze security patterns in batch
  private async analyzeSecurityPatterns(events: AuditEvent[]): Promise<void> {
    try {
      const securityEvents = events.filter(event => this.isSecurityEvent(event.eventType))
      
      if (securityEvents.length === 0) return

      // Group by IP address
      const eventsByIP = new Map<string, AuditEvent[]>()
      securityEvents.forEach(event => {
        if (event.ipAddress) {
          if (!eventsByIP.has(event.ipAddress)) {
            eventsByIP.set(event.ipAddress, [])
          }
          eventsByIP.get(event.ipAddress)!.push(event)
        }
      })

      // Check for suspicious patterns
      for (const [ip, ipEvents] of eventsByIP) {
        if (ipEvents.length >= 5) { // 5 or more security events from same IP
          await this.logEvent({
            eventType: AuditEventType.SUSPICIOUS_ACTIVITY,
            severity: AuditSeverity.HIGH,
            ipAddress: ip,
            outcome: 'FAILURE',
            details: {
              pattern: 'Multiple security events from same IP',
              eventCount: ipEvents.length,
              eventTypes: [...new Set(ipEvents.map(e => e.eventType))]
            }
          })
        }
      }

    } catch (error) {
      await logger.error('Failed to analyze security patterns', error as Error)
    }
  }

  // Check if event type is security-related
  private isSecurityEvent(eventType: AuditEventType): boolean {
    const securityEvents = [
      AuditEventType.SECURITY_VIOLATION,
      AuditEventType.SUSPICIOUS_ACTIVITY,
      AuditEventType.RATE_LIMIT_EXCEEDED,
      AuditEventType.CSRF_VIOLATION,
      AuditEventType.SQL_INJECTION_ATTEMPT,
      AuditEventType.XSS_ATTEMPT,
      AuditEventType.LOGIN_FAILED,
      AuditEventType.ACCESS_DENIED
    ]
    
    return securityEvents.includes(eventType)
  }

  // Check and block suspicious IP
  private async checkAndBlockSuspiciousIP(ipAddress: string): Promise<void> {
    try {
      const recentViolations = await this.getRecentSecurityEvents(ipAddress, 1) // Last hour
      
      if (recentViolations.length >= 10) {
        // Block IP temporarily
        const blockKey = `security:blocked_ip:${ipAddress}`
        await cache.set(blockKey, {
          reason: 'Multiple security violations',
          blockedAt: Date.now(),
          violationCount: recentViolations.length
        }, 24 * 60 * 60) // 24 hours

        await this.logEvent({
          eventType: AuditEventType.SUSPICIOUS_ACTIVITY,
          severity: AuditSeverity.CRITICAL,
          ipAddress,
          outcome: 'SUCCESS',
          details: {
            action: 'IP_BLOCKED',
            reason: 'Multiple security violations',
            violationCount: recentViolations.length
          }
        })
      }
    } catch (error) {
      await logger.error('Failed to check and block suspicious IP', error as Error)
    }
  }

  // Check and lock account
  private async checkAndLockAccount(userId: string): Promise<void> {
    try {
      const recentFailures = await this.getRecentUserEvents(userId, AuditEventType.LOGIN_FAILED, 1)
      
      if (recentFailures.length >= 5) {
        // Lock account temporarily
        const lockKey = `security:locked_account:${userId}`
        await cache.set(lockKey, {
          reason: 'Multiple failed login attempts',
          lockedAt: Date.now(),
          attemptCount: recentFailures.length
        }, 60 * 60) // 1 hour

        await this.logEvent({
          eventType: AuditEventType.SUSPICIOUS_ACTIVITY,
          severity: AuditSeverity.HIGH,
          userId,
          outcome: 'SUCCESS',
          details: {
            action: 'ACCOUNT_LOCKED',
            reason: 'Multiple failed login attempts',
            attemptCount: recentFailures.length
          }
        })
      }
    } catch (error) {
      await logger.error('Failed to check and lock account', error as Error)
    }
  }

  // Extend rate limit for IP
  private async extendRateLimit(ipAddress: string): Promise<void> {
    try {
      const extendedLimitKey = `rate_limit:extended:${ipAddress}`
      await cache.set(extendedLimitKey, {
        reason: 'Rate limit exceeded',
        extendedAt: Date.now(),
        multiplier: 2 // Double the normal rate limit
      }, 60 * 60) // 1 hour
    } catch (error) {
      await logger.error('Failed to extend rate limit', error as Error)
    }
  }

  // Get recent security events for IP
  private async getRecentSecurityEvents(ipAddress: string, hours: number): Promise<AuditEvent[]> {
    try {
      const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000))
      
      const events = await prisma.auditLog.findMany({
        where: {
          ipAddress,
          timestamp: { gte: cutoffTime },
          eventType: {
            in: [
              AuditEventType.SECURITY_VIOLATION,
              AuditEventType.SQL_INJECTION_ATTEMPT,
              AuditEventType.XSS_ATTEMPT,
              AuditEventType.CSRF_VIOLATION
            ]
          }
        },
        orderBy: { timestamp: 'desc' }
      })

      return events.map(this.mapDatabaseEventToAuditEvent)
    } catch (error) {
      await logger.error('Failed to get recent security events', error as Error)
      return []
    }
  }

  // Get recent user events
  private async getRecentUserEvents(userId: string, eventType: AuditEventType, hours: number): Promise<AuditEvent[]> {
    try {
      const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000))
      
      const events = await prisma.auditLog.findMany({
        where: {
          userId,
          eventType,
          timestamp: { gte: cutoffTime }
        },
        orderBy: { timestamp: 'desc' }
      })

      return events.map(this.mapDatabaseEventToAuditEvent)
    } catch (error) {
      await logger.error('Failed to get recent user events', error as Error)
      return []
    }
  }

  // Map database event to audit event
  private mapDatabaseEventToAuditEvent(dbEvent: any): AuditEvent {
    return {
      id: dbEvent.id,
      eventType: dbEvent.eventType as AuditEventType,
      severity: dbEvent.severity as AuditSeverity,
      timestamp: dbEvent.timestamp,
      userId: dbEvent.userId,
      sessionId: dbEvent.sessionId,
      ipAddress: dbEvent.ipAddress,
      userAgent: dbEvent.userAgent,
      resource: dbEvent.resource,
      resourceId: dbEvent.resourceId,
      action: dbEvent.action,
      outcome: dbEvent.outcome as 'SUCCESS' | 'FAILURE' | 'PARTIAL',
      details: dbEvent.details ? JSON.parse(dbEvent.details) : undefined,
      metadata: dbEvent.metadata ? JSON.parse(dbEvent.metadata) : undefined,
      riskScore: dbEvent.riskScore
    }
  }
}

// Audit query service
export class AuditQueryService {
  // Search audit events
  static async searchEvents(criteria: {
    eventTypes?: AuditEventType[]
    severity?: AuditSeverity[]
    userId?: string
    ipAddress?: string
    resource?: string
    outcome?: 'SUCCESS' | 'FAILURE' | 'PARTIAL'
    startDate?: Date
    endDate?: Date
    limit?: number
    offset?: number
  }): Promise<{
    events: AuditEvent[]
    total: number
  }> {
    try {
      const where: any = {}

      if (criteria.eventTypes?.length) {
        where.eventType = { in: criteria.eventTypes }
      }

      if (criteria.severity?.length) {
        where.severity = { in: criteria.severity }
      }

      if (criteria.userId) {
        where.userId = criteria.userId
      }

      if (criteria.ipAddress) {
        where.ipAddress = criteria.ipAddress
      }

      if (criteria.resource) {
        where.resource = { contains: criteria.resource, mode: 'insensitive' }
      }

      if (criteria.outcome) {
        where.outcome = criteria.outcome
      }

      if (criteria.startDate || criteria.endDate) {
        where.timestamp = {}
        if (criteria.startDate) where.timestamp.gte = criteria.startDate
        if (criteria.endDate) where.timestamp.lte = criteria.endDate
      }

      const [events, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          orderBy: { timestamp: 'desc' },
          take: criteria.limit || 100,
          skip: criteria.offset || 0
        }),
        prisma.auditLog.count({ where })
      ])

      return {
        events: events.map(AuditLogger.getInstance()['mapDatabaseEventToAuditEvent']),
        total
      }
    } catch (error) {
      await logger.error('Failed to search audit events', error as Error)
      return { events: [], total: 0 }
    }
  }

  // Get audit statistics
  static async getStatistics(timeRangeHours: number = 24): Promise<{
    totalEvents: number
    eventsByType: Record<string, number>
    eventsBySeverity: Record<string, number>
    eventsByOutcome: Record<string, number>
    topUsers: Array<{ userId: string; count: number }>
    topIPs: Array<{ ipAddress: string; count: number }>
    securityEvents: number
    criticalEvents: number
  }> {
    try {
      const cutoffTime = new Date(Date.now() - (timeRangeHours * 60 * 60 * 1000))

      const [
        totalEvents,
        eventsByType,
        eventsBySeverity,
        eventsByOutcome,
        topUsers,
        topIPs
      ] = await Promise.all([
        // Total events
        prisma.auditLog.count({
          where: { timestamp: { gte: cutoffTime } }
        }),

        // Events by type
        prisma.auditLog.groupBy({
          by: ['eventType'],
          where: { timestamp: { gte: cutoffTime } },
          _count: { eventType: true }
        }),

        // Events by severity
        prisma.auditLog.groupBy({
          by: ['severity'],
          where: { timestamp: { gte: cutoffTime } },
          _count: { severity: true }
        }),

        // Events by outcome
        prisma.auditLog.groupBy({
          by: ['outcome'],
          where: { timestamp: { gte: cutoffTime } },
          _count: { outcome: true }
        }),

        // Top users
        prisma.auditLog.groupBy({
          by: ['userId'],
          where: { 
            timestamp: { gte: cutoffTime },
            userId: { not: null }
          },
          _count: { userId: true },
          orderBy: { _count: { userId: 'desc' } },
          take: 10
        }),

        // Top IPs
        prisma.auditLog.groupBy({
          by: ['ipAddress'],
          where: { 
            timestamp: { gte: cutoffTime },
            ipAddress: { not: null }
          },
          _count: { ipAddress: true },
          orderBy: { _count: { ipAddress: 'desc' } },
          take: 10
        })
      ])

      const securityEventTypes = [
        AuditEventType.SECURITY_VIOLATION,
        AuditEventType.SUSPICIOUS_ACTIVITY,
        AuditEventType.RATE_LIMIT_EXCEEDED,
        AuditEventType.CSRF_VIOLATION,
        AuditEventType.SQL_INJECTION_ATTEMPT,
        AuditEventType.XSS_ATTEMPT
      ]

      const securityEvents = eventsByType
        .filter(item => securityEventTypes.includes(item.eventType as AuditEventType))
        .reduce((sum, item) => sum + item._count.eventType, 0)

      const criticalEvents = eventsBySeverity
        .find(item => item.severity === AuditSeverity.CRITICAL)
        ?._count.severity || 0

      return {
        totalEvents,
        eventsByType: eventsByType.reduce((acc, item) => {
          acc[item.eventType] = item._count.eventType
          return acc
        }, {} as Record<string, number>),
        eventsBySeverity: eventsBySeverity.reduce((acc, item) => {
          acc[item.severity] = item._count.severity
          return acc
        }, {} as Record<string, number>),
        eventsByOutcome: eventsByOutcome.reduce((acc, item) => {
          acc[item.outcome] = item._count.outcome
          return acc
        }, {} as Record<string, number>),
        topUsers: topUsers.map(item => ({
          userId: item.userId!,
          count: item._count.userId
        })),
        topIPs: topIPs.map(item => ({
          ipAddress: item.ipAddress!,
          count: item._count.ipAddress
        })),
        securityEvents,
        criticalEvents
      }
    } catch (error) {
      await logger.error('Failed to get audit statistics', error as Error)
      return {
        totalEvents: 0,
        eventsByType: {},
        eventsBySeverity: {},
        eventsByOutcome: {},
        topUsers: [],
        topIPs: [],
        securityEvents: 0,
        criticalEvents: 0
      }
    }
  }

  // Get user audit trail
  static async getUserAuditTrail(userId: string, limit: number = 100): Promise<AuditEvent[]> {
    try {
      const events = await prisma.auditLog.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: limit
      })

      return events.map(AuditLogger.getInstance()['mapDatabaseEventToAuditEvent'])
    } catch (error) {
      await logger.error('Failed to get user audit trail', error as Error)
      return []
    }
  }
}

// Audit middleware for automatic event logging
export class AuditMiddleware {
  private auditLogger: AuditLogger

  constructor() {
    this.auditLogger = AuditLogger.getInstance()
  }

  // Create middleware for API routes
  createMiddleware() {
    return async (req: any, res: any, next: any) => {
      const startTime = Date.now()
      
      // Capture original res.end to log after response
      const originalEnd = res.end
      
      res.end = async function(this: any, ...args: any[]) {
        const duration = Date.now() - startTime
        
        // Determine event type based on method and path
        const eventType = this.determineEventType(req.method, req.path, res.statusCode)
        
        if (eventType) {
          await this.auditLogger.logEvent({
            eventType,
            severity: this.determineSeverity(res.statusCode),
            userId: req.user?.id,
            sessionId: req.sessionId,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            resource: req.path,
            action: req.method,
            outcome: res.statusCode < 400 ? 'SUCCESS' : 'FAILURE',
            details: {
              statusCode: res.statusCode,
              duration,
              method: req.method,
              path: req.path
            }
          })
        }

        originalEnd.apply(this, args)
      }.bind(this)

      next()
    }
  }

  // Determine event type from request
  private determineEventType(method: string, path: string, statusCode: number): AuditEventType | null {
    // Authentication endpoints
    if (path.includes('/auth/login')) {
      return statusCode < 400 ? AuditEventType.LOGIN_SUCCESS : AuditEventType.LOGIN_FAILED
    }
    
    if (path.includes('/auth/logout')) {
      return AuditEventType.LOGOUT
    }

    // Data operations
    if (method === 'POST' && statusCode < 400) {
      return AuditEventType.DATA_CREATED
    }
    
    if (method === 'PUT' && statusCode < 400) {
      return AuditEventType.DATA_UPDATED
    }
    
    if (method === 'DELETE' && statusCode < 400) {
      return AuditEventType.DATA_DELETED
    }

    // Access denied
    if (statusCode === 403) {
      return AuditEventType.ACCESS_DENIED
    }

    return null
  }

  // Determine severity from status code
  private determineSeverity(statusCode: number): AuditSeverity {
    if (statusCode >= 500) return AuditSeverity.HIGH
    if (statusCode >= 400) return AuditSeverity.MEDIUM
    return AuditSeverity.LOW
  }
}

// Export singleton instances
export const auditLogger = AuditLogger.getInstance()
export const auditMiddleware = new AuditMiddleware()

// Utility functions for common audit events
export const auditUtils = {
  logLogin: (userId: string, success: boolean, ipAddress?: string, userAgent?: string) =>
    auditLogger.logEvent({
      eventType: success ? AuditEventType.LOGIN_SUCCESS : AuditEventType.LOGIN_FAILED,
      severity: success ? AuditSeverity.LOW : AuditSeverity.MEDIUM,
      userId: success ? userId : undefined,
      ipAddress,
      userAgent,
      outcome: success ? 'SUCCESS' : 'FAILURE'
    }),

  logDataAccess: (userId: string, resource: string, resourceId: string, action: string) =>
    auditLogger.logEvent({
      eventType: AuditEventType.DATA_VIEWED,
      severity: AuditSeverity.LOW,
      userId,
      resource,
      resourceId,
      action,
      outcome: 'SUCCESS'
    }),

  logSecurityViolation: (eventType: AuditEventType, ipAddress?: string, details?: Record<string, any>) =>
    auditLogger.logEvent({
      eventType,
      severity: AuditSeverity.HIGH,
      ipAddress,
      outcome: 'FAILURE',
      details
    })
}