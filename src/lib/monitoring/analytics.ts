// Analytics and usage tracking system
import { prisma } from '@/lib/db'

export interface AnalyticsEvent {
  event: string
  userId?: string
  sessionId?: string
  properties?: Record<string, any>
  timestamp?: Date
}

export interface UserAnalytics {
  totalUsers: number
  activeUsers: number
  newUsers: number
  usersByRole: Record<string, number>
  loginFrequency: Record<string, number>
}

export interface SystemAnalytics {
  totalRequests: number
  errorRate: number
  averageResponseTime: number
  popularEndpoints: Array<{ endpoint: string; count: number }>
  systemLoad: {
    cpu: number
    memory: number
    database: number
  }
}

class AnalyticsService {
  private events: AnalyticsEvent[] = []
  private flushInterval: NodeJS.Timeout | null = null

  constructor() {
    // Flush events to database every 30 seconds
    this.flushInterval = setInterval(() => {
      this.flushEvents()
    }, 30000)
  }

  // Track user events
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      const eventData = {
        ...event,
        timestamp: event.timestamp || new Date()
      }

      this.events.push(eventData)

      // If buffer is full, flush immediately
      if (this.events.length >= 100) {
        await this.flushEvents()
      }
    } catch (error) {
      console.error('Analytics tracking error:', error)
    }
  }

  // Track page views
  async trackPageView(
    userId: string | undefined,
    page: string,
    sessionId?: string
  ): Promise<void> {
    await this.trackEvent({
      event: 'page_view',
      userId,
      sessionId,
      properties: { page }
    })
  }

  // Track user actions
  async trackUserAction(
    userId: string,
    action: string,
    resource?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.trackEvent({
      event: 'user_action',
      userId,
      properties: {
        action,
        resource,
        ...metadata
      }
    })
  }

  // Track API usage
  async trackApiUsage(
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number,
    userId?: string
  ): Promise<void> {
    await this.trackEvent({
      event: 'api_request',
      userId,
      properties: {
        endpoint,
        method,
        statusCode,
        responseTime
      }
    })
  }

  // Track errors
  async trackError(
    error: Error,
    context: string,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.trackEvent({
      event: 'error',
      userId,
      properties: {
        error: error.message,
        stack: error.stack,
        context,
        ...metadata
      }
    })
  }

  // Get user analytics
  async getUserAnalytics(
    startDate: Date,
    endDate: Date
  ): Promise<UserAnalytics> {
    try {
      const [totalUsers, activeUsers, newUsers, usersByRole] = await Promise.all([
        // Total users
        prisma.user.count({
          where: { isActive: true }
        }),

        // Active users (logged in within date range)
        prisma.user.count({
          where: {
            isActive: true,
            lastLogin: {
              gte: startDate,
              lte: endDate
            }
          }
        }),

        // New users (created within date range)
        prisma.user.count({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }),

        // Users by role
        prisma.user.groupBy({
          by: ['roleId'],
          _count: true,
          where: { isActive: true }
        })
      ])

      // Get role names
      const roles = await prisma.userRole.findMany()
      const roleMap = roles.reduce((acc, role) => {
        acc[role.id] = role.name
        return acc
      }, {} as Record<string, string>)

      const usersByRoleName = usersByRole.reduce((acc, item) => {
        const roleName = roleMap[item.roleId] || 'Unknown'
        acc[roleName] = item._count
        return acc
      }, {} as Record<string, number>)

      // Get login frequency from analytics events
      const loginEvents = await prisma.analyticsEvent.groupBy({
        by: ['properties'],
        _count: true,
        where: {
          event: 'user_action',
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        }
      })

      const loginFrequency = loginEvents.reduce((acc, event) => {
        const properties = event.properties as any
        if (properties?.action === 'login') {
          const date = new Date().toISOString().split('T')[0]
          acc[date] = (acc[date] || 0) + event._count
        }
        return acc
      }, {} as Record<string, number>)

      return {
        totalUsers,
        activeUsers,
        newUsers,
        usersByRole: usersByRoleName,
        loginFrequency
      }
    } catch (error) {
      console.error('Get user analytics error:', error)
      throw error
    }
  }

  // Get system analytics
  async getSystemAnalytics(
    startDate: Date,
    endDate: Date
  ): Promise<SystemAnalytics> {
    try {
      const apiEvents = await prisma.analyticsEvent.findMany({
        where: {
          event: 'api_request',
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        }
      })

      const totalRequests = apiEvents.length
      const errorRequests = apiEvents.filter(
        event => (event.properties as any)?.statusCode >= 400
      ).length
      const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0

      const responseTimes = apiEvents
        .map(event => (event.properties as any)?.responseTime)
        .filter(time => typeof time === 'number')
      const averageResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
        : 0

      // Popular endpoints
      const endpointCounts = apiEvents.reduce((acc, event) => {
        const endpoint = (event.properties as any)?.endpoint
        if (endpoint) {
          acc[endpoint] = (acc[endpoint] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>)

      const popularEndpoints = Object.entries(endpointCounts)
        .map(([endpoint, count]) => ({ endpoint, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      // System load (mock data - in production, integrate with actual monitoring)
      const systemLoad = {
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        database: Math.random() * 100
      }

      return {
        totalRequests,
        errorRate,
        averageResponseTime,
        popularEndpoints,
        systemLoad
      }
    } catch (error) {
      console.error('Get system analytics error:', error)
      throw error
    }
  }

  // Get feature usage analytics
  async getFeatureUsage(
    startDate: Date,
    endDate: Date
  ): Promise<Record<string, number>> {
    try {
      const featureEvents = await prisma.analyticsEvent.groupBy({
        by: ['properties'],
        _count: true,
        where: {
          event: 'user_action',
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        }
      })

      return featureEvents.reduce((acc, event) => {
        const properties = event.properties as any
        const resource = properties?.resource
        if (resource) {
          acc[resource] = (acc[resource] || 0) + event._count
        }
        return acc
      }, {} as Record<string, number>)
    } catch (error) {
      console.error('Get feature usage error:', error)
      throw error
    }
  }

  // Flush events to database
  private async flushEvents(): Promise<void> {
    if (this.events.length === 0) return

    try {
      const eventsToFlush = [...this.events]
      this.events = []

      await prisma.analyticsEvent.createMany({
        data: eventsToFlush.map(event => ({
          event: event.event,
          userId: event.userId,
          sessionId: event.sessionId,
          properties: event.properties || {},
          timestamp: event.timestamp || new Date()
        }))
      })
    } catch (error) {
      console.error('Flush analytics events error:', error)
      // Put events back if flush failed
      this.events.unshift(...this.events)
    }
  }

  // Cleanup old analytics data
  async cleanupOldData(daysToKeep: number = 90): Promise<void> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

      await prisma.analyticsEvent.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate
          }
        }
      })
    } catch (error) {
      console.error('Cleanup analytics data error:', error)
    }
  }

  // Destroy service
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushInterval = null
    }
    // Flush remaining events
    this.flushEvents()
  }
}

// Export singleton instance
export const analytics = new AnalyticsService()

// Middleware for automatic API tracking
export function withAnalytics<T extends (...args: any[]) => any>(
  handler: T,
  endpoint: string
): T {
  return (async (...args: any[]) => {
    const startTime = Date.now()
    let statusCode = 200
    let userId: string | undefined

    try {
      // Extract user ID from request if available
      const request = args[0]
      if (request?.headers?.authorization) {
        // Extract user from token (simplified)
        userId = 'extracted-user-id'
      }

      const result = await handler(...args)
      return result
    } catch (error) {
      statusCode = 500
      throw error
    } finally {
      const responseTime = Date.now() - startTime
      const method = args[0]?.method || 'GET'

      analytics.trackApiUsage(endpoint, method, statusCode, responseTime, userId)
    }
  }) as T
}