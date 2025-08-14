// Session management and suspicious activity detection
import { prisma } from '@/lib/db'
import { logger } from '@/lib/monitoring/logger'
import { auditLogger } from './audit-system'

export interface UserSession {
  id: string
  userId: string
  sessionToken: string
  ipAddress: string
  userAgent: string
  location?: string
  isActive: boolean
  lastActivity: Date
  createdAt: Date
  expiresAt: Date
}

export interface SuspiciousActivity {
  type: 'MULTIPLE_LOGINS' | 'UNUSUAL_LOCATION' | 'RAPID_REQUESTS' | 'FAILED_ATTEMPTS' | 'PRIVILEGE_ESCALATION'
  severity: 'low' | 'medium' | 'high' | 'critical'
  userId: string
  description: string
  metadata: Record<string, any>
  timestamp: Date
}

class SessionManager {
  private readonly MAX_SESSIONS_PER_USER = 5
  private readonly SESSION_TIMEOUT = 8 * 60 * 60 * 1000 // 8 hours
  private readonly SUSPICIOUS_LOGIN_THRESHOLD = 5
  private readonly RAPID_REQUEST_THRESHOLD = 100 // requests per minute

  // Create new session
  async createSession(
    userId: string,
    ipAddress: string,
    userAgent: string,
    location?: string
  ): Promise<UserSession> {
    try {
      // Check for existing sessions
      await this.cleanupExpiredSessions(userId)
      
      const existingSessions = await prisma.userSession.count({
        where: {
          userId,
          isActive: true
        }
      })

      // Limit concurrent sessions
      if (existingSessions >= this.MAX_SESSIONS_PER_USER) {
        // Deactivate oldest session
        const oldestSession = await prisma.userSession.findFirst({
          where: {
            userId,
            isActive: true
          },
          orderBy: {
            lastActivity: 'asc'
          }
        })

        if (oldestSession) {
          await this.terminateSession(oldestSession.id, 'MAX_SESSIONS_EXCEEDED')
        }
      }

      // Check for suspicious login patterns
      await this.detectSuspiciousLogin(userId, ipAddress, userAgent, location)

      const expiresAt = new Date(Date.now() + this.SESSION_TIMEOUT)
      const sessionToken = this.generateSessionToken()

      const session = await prisma.userSession.create({
        data: {
          userId,
          sessionToken,
          ipAddress,
          userAgent,
          location,
          isActive: true,
          lastActivity: new Date(),
          expiresAt
        }
      })

      // Log session creation
      await auditLogger.logActivity({
        userId,
        action: 'SESSION_CREATED',
        resource: 'session',
        resourceId: session.id,
        description: 'User session created',
        metadata: {
          ipAddress,
          userAgent,
          location
        }
      })

      return {
        id: session.id,
        userId: session.userId,
        sessionToken: session.sessionToken,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        location: session.location || undefined,
        isActive: session.isActive,
        lastActivity: session.lastActivity,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt
      }
    } catch (error) {
      logger.error('Create session error', { error, userId, ipAddress })
      throw error
    }
  }

  // Update session activity
  async updateSessionActivity(sessionId: string): Promise<void> {
    try {
      await prisma.userSession.update({
        where: { id: sessionId },
        data: {
          lastActivity: new Date()
        }
      })
    } catch (error) {
      logger.error('Update session activity error', { error, sessionId })
    }
  }

  // Get active session
  async getActiveSession(sessionToken: string): Promise<UserSession | null> {
    try {
      const session = await prisma.userSession.findFirst({
        where: {
          sessionToken,
          isActive: true,
          expiresAt: {
            gt: new Date()
          }
        }
      })

      if (!session) return null

      // Update last activity
      await this.updateSessionActivity(session.id)

      return {
        id: session.id,
        userId: session.userId,
        sessionToken: session.sessionToken,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        location: session.location || undefined,
        isActive: session.isActive,
        lastActivity: session.lastActivity,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt
      }
    } catch (error) {
      logger.error('Get active session error', { error, sessionToken })
      return null
    }
  }

  // Get user sessions
  async getUserSessions(userId: string): Promise<UserSession[]> {
    try {
      const sessions = await prisma.userSession.findMany({
        where: {
          userId,
          isActive: true,
          expiresAt: {
            gt: new Date()
          }
        },
        orderBy: {
          lastActivity: 'desc'
        }
      })

      return sessions.map(session => ({
        id: session.id,
        userId: session.userId,
        sessionToken: session.sessionToken,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        location: session.location || undefined,
        isActive: session.isActive,
        lastActivity: session.lastActivity,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt
      }))
    } catch (error) {
      logger.error('Get user sessions error', { error, userId })
      return []
    }
  }

  // Terminate session
  async terminateSession(sessionId: string, reason: string): Promise<void> {
    try {
      const session = await prisma.userSession.findUnique({
        where: { id: sessionId }
      })

      if (!session) return

      await prisma.userSession.update({
        where: { id: sessionId },
        data: {
          isActive: false,
          terminatedAt: new Date(),
          terminationReason: reason
        }
      })

      // Log session termination
      await auditLogger.logActivity({
        userId: session.userId,
        action: 'SESSION_TERMINATED',
        resource: 'session',
        resourceId: sessionId,
        description: `Session terminated: ${reason}`,
        metadata: {
          reason,
          ipAddress: session.ipAddress
        }
      })
    } catch (error) {
      logger.error('Terminate session error', { error, sessionId, reason })
    }
  }

  // Terminate all user sessions
  async terminateAllUserSessions(userId: string, reason: string): Promise<void> {
    try {
      const sessions = await prisma.userSession.findMany({
        where: {
          userId,
          isActive: true
        }
      })

      await prisma.userSession.updateMany({
        where: {
          userId,
          isActive: true
        },
        data: {
          isActive: false,
          terminatedAt: new Date(),
          terminationReason: reason
        }
      })

      // Log mass session termination
      await auditLogger.logActivity({
        userId,
        action: 'ALL_SESSIONS_TERMINATED',
        resource: 'session',
        description: `All sessions terminated: ${reason}`,
        metadata: {
          reason,
          sessionCount: sessions.length
        }
      })
    } catch (error) {
      logger.error('Terminate all user sessions error', { error, userId, reason })
    }
  }

  // Cleanup expired sessions
  async cleanupExpiredSessions(userId?: string): Promise<void> {
    try {
      const where = {
        OR: [
          { expiresAt: { lt: new Date() } },
          { 
            lastActivity: { 
              lt: new Date(Date.now() - this.SESSION_TIMEOUT) 
            } 
          }
        ],
        ...(userId && { userId })
      }

      await prisma.userSession.updateMany({
        where,
        data: {
          isActive: false,
          terminatedAt: new Date(),
          terminationReason: 'EXPIRED'
        }
      })
    } catch (error) {
      logger.error('Cleanup expired sessions error', { error, userId })
    }
  }

  // Detect suspicious login activity
  private async detectSuspiciousLogin(
    userId: string,
    ipAddress: string,
    userAgent: string,
    location?: string
  ): Promise<void> {
    try {
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

      // Check for multiple failed login attempts
      const failedAttempts = await prisma.loginAttempt.count({
        where: {
          userId,
          success: false,
          timestamp: {
            gte: oneHourAgo
          }
        }
      })

      if (failedAttempts >= this.SUSPICIOUS_LOGIN_THRESHOLD) {
        await this.reportSuspiciousActivity({
          type: 'FAILED_ATTEMPTS',
          severity: 'high',
          userId,
          description: `${failedAttempts} failed login attempts in the last hour`,
          metadata: {
            failedAttempts,
            ipAddress,
            userAgent
          },
          timestamp: now
        })
      }

      // Check for logins from multiple locations
      const recentSessions = await prisma.userSession.findMany({
        where: {
          userId,
          createdAt: {
            gte: oneHourAgo
          }
        },
        select: {
          ipAddress: true,
          location: true
        }
      })

      const uniqueLocations = new Set(
        recentSessions
          .map(s => s.location || s.ipAddress)
          .filter(Boolean)
      )

      if (uniqueLocations.size > 3) {
        await this.reportSuspiciousActivity({
          type: 'MULTIPLE_LOGINS',
          severity: 'medium',
          userId,
          description: `Logins from ${uniqueLocations.size} different locations in the last hour`,
          metadata: {
            locations: Array.from(uniqueLocations),
            ipAddress,
            userAgent
          },
          timestamp: now
        })
      }

      // Check for unusual location (if location data available)
      if (location) {
        const userLocations = await prisma.userSession.findMany({
          where: {
            userId,
            location: { not: null }
          },
          select: { location: true },
          distinct: ['location'],
          take: 10
        })

        const knownLocations = userLocations.map(s => s.location).filter(Boolean)
        
        if (knownLocations.length > 0 && !knownLocations.includes(location)) {
          await this.reportSuspiciousActivity({
            type: 'UNUSUAL_LOCATION',
            severity: 'medium',
            userId,
            description: `Login from unusual location: ${location}`,
            metadata: {
              newLocation: location,
              knownLocations,
              ipAddress,
              userAgent
            },
            timestamp: now
          })
        }
      }
    } catch (error) {
      logger.error('Detect suspicious login error', { error, userId, ipAddress })
    }
  }

  // Detect rapid requests (potential bot activity)
  async detectRapidRequests(userId: string, endpoint: string): Promise<boolean> {
    try {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000)
      
      const requestCount = await prisma.apiRequest.count({
        where: {
          userId,
          endpoint,
          timestamp: {
            gte: oneMinuteAgo
          }
        }
      })

      if (requestCount >= this.RAPID_REQUEST_THRESHOLD) {
        await this.reportSuspiciousActivity({
          type: 'RAPID_REQUESTS',
          severity: 'high',
          userId,
          description: `${requestCount} requests to ${endpoint} in the last minute`,
          metadata: {
            requestCount,
            endpoint,
            timeWindow: '1 minute'
          },
          timestamp: new Date()
        })

        return true // Indicates suspicious activity
      }

      return false
    } catch (error) {
      logger.error('Detect rapid requests error', { error, userId, endpoint })
      return false
    }
  }

  // Report suspicious activity
  private async reportSuspiciousActivity(activity: SuspiciousActivity): Promise<void> {
    try {
      // Store in database
      await prisma.suspiciousActivity.create({
        data: {
          type: activity.type,
          severity: activity.severity,
          userId: activity.userId,
          description: activity.description,
          metadata: activity.metadata,
          timestamp: activity.timestamp
        }
      })

      // Log to audit system
      await auditLogger.logActivity({
        userId: activity.userId,
        action: 'SUSPICIOUS_ACTIVITY_DETECTED',
        resource: 'security',
        description: activity.description,
        metadata: {
          type: activity.type,
          severity: activity.severity,
          ...activity.metadata
        }
      })

      // Send alerts for high/critical severity
      if (['high', 'critical'].includes(activity.severity)) {
        logger.error('SUSPICIOUS ACTIVITY ALERT', {
          type: activity.type,
          severity: activity.severity,
          userId: activity.userId,
          description: activity.description,
          metadata: activity.metadata
        })

        // In production, integrate with alerting systems
        // - Email notifications
        // - Slack/Teams webhooks
        // - SMS alerts
        // - Security incident management systems
      }
    } catch (error) {
      logger.error('Report suspicious activity error', { error, activity })
    }
  }

  // Get suspicious activities
  async getSuspiciousActivities(
    startDate: Date,
    endDate: Date,
    userId?: string,
    severity?: string
  ): Promise<SuspiciousActivity[]> {
    try {
      const activities = await prisma.suspiciousActivity.findMany({
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate
          },
          ...(userId && { userId }),
          ...(severity && { severity })
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
        }
      })

      return activities.map(activity => ({
        type: activity.type as any,
        severity: activity.severity as any,
        userId: activity.userId,
        description: activity.description,
        metadata: activity.metadata as Record<string, any>,
        timestamp: activity.timestamp
      }))
    } catch (error) {
      logger.error('Get suspicious activities error', { error })
      return []
    }
  }

  // Generate secure session token
  private generateSessionToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 64; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  // Cleanup old data
  async cleanupOldData(daysToKeep: number = 90): Promise<void> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

      // Cleanup old sessions
      await prisma.userSession.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          },
          isActive: false
        }
      })

      // Cleanup old suspicious activities
      await prisma.suspiciousActivity.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate
          }
        }
      })

      logger.info('Cleaned up old session and security data', { cutoffDate })
    } catch (error) {
      logger.error('Cleanup old data error', { error })
    }
  }
}

// Export singleton instance
export const sessionManager = new SessionManager()

// Cleanup expired sessions periodically
setInterval(() => {
  sessionManager.cleanupExpiredSessions()
}, 60 * 60 * 1000) // Every hour