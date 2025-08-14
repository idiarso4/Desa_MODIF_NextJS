// Error tracking and reporting system
import { prisma } from '@/lib/db'
import { logger } from './logger'

export interface ErrorReport {
  id?: string
  message: string
  stack?: string
  context: string
  userId?: string
  sessionId?: string
  userAgent?: string
  url?: string
  timestamp?: Date
  severity: 'low' | 'medium' | 'high' | 'critical'
  resolved?: boolean
  metadata?: Record<string, any>
}

export interface ErrorStats {
  totalErrors: number
  errorsByType: Record<string, number>
  errorsBySeverity: Record<string, number>
  errorTrends: Array<{ date: string; count: number }>
  topErrors: Array<{ message: string; count: number; lastOccurred: Date }>
}

class ErrorTracker {
  // Track error
  async trackError(error: ErrorReport): Promise<void> {
    try {
      // Save to database
      await prisma.errorLog.create({
        data: {
          message: error.message,
          stack: error.stack,
          context: error.context,
          userId: error.userId,
          sessionId: error.sessionId,
          userAgent: error.userAgent,
          url: error.url,
          severity: error.severity,
          metadata: error.metadata || {},
          timestamp: error.timestamp || new Date()
        }
      })

      // Log to application logger
      logger.error('Error tracked', {
        message: error.message,
        context: error.context,
        userId: error.userId,
        severity: error.severity
      })

      // Send alerts for critical errors
      if (error.severity === 'critical') {
        await this.sendCriticalErrorAlert(error)
      }

    } catch (trackingError) {
      console.error('Error tracking failed:', trackingError)
      // Fallback to console logging
      console.error('Original error:', error)
    }
  }

  // Track JavaScript errors from frontend
  async trackClientError(
    message: string,
    stack: string,
    url: string,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.trackError({
      message,
      stack,
      context: 'client',
      userId,
      url,
      severity: 'medium',
      metadata
    })
  }

  // Track API errors
  async trackApiError(
    error: Error,
    endpoint: string,
    method: string,
    userId?: string,
    requestData?: any
  ): Promise<void> {
    await this.trackError({
      message: error.message,
      stack: error.stack,
      context: 'api',
      userId,
      url: endpoint,
      severity: this.determineSeverity(error),
      metadata: {
        method,
        requestData: requestData ? JSON.stringify(requestData) : undefined
      }
    })
  }

  // Track database errors
  async trackDatabaseError(
    error: Error,
    query: string,
    userId?: string
  ): Promise<void> {
    await this.trackError({
      message: error.message,
      stack: error.stack,
      context: 'database',
      userId,
      severity: 'high',
      metadata: {
        query: query.substring(0, 500) // Limit query length
      }
    })
  }

  // Get error statistics
  async getErrorStats(
    startDate: Date,
    endDate: Date
  ): Promise<ErrorStats> {
    try {
      const [totalErrors, errorsByType, errorsBySeverity, errorTrends, topErrors] = await Promise.all([
        // Total errors
        prisma.errorLog.count({
          where: {
            timestamp: {
              gte: startDate,
              lte: endDate
            }
          }
        }),

        // Errors by type (context)
        prisma.errorLog.groupBy({
          by: ['context'],
          _count: true,
          where: {
            timestamp: {
              gte: startDate,
              lte: endDate
            }
          }
        }),

        // Errors by severity
        prisma.errorLog.groupBy({
          by: ['severity'],
          _count: true,
          where: {
            timestamp: {
              gte: startDate,
              lte: endDate
            }
          }
        }),

        // Error trends (daily)
        this.getErrorTrends(startDate, endDate),

        // Top errors
        prisma.errorLog.groupBy({
          by: ['message'],
          _count: true,
          _max: {
            timestamp: true
          },
          where: {
            timestamp: {
              gte: startDate,
              lte: endDate
            }
          },
          orderBy: {
            _count: {
              message: 'desc'
            }
          },
          take: 10
        })
      ])

      return {
        totalErrors,
        errorsByType: errorsByType.reduce((acc, item) => {
          acc[item.context] = item._count
          return acc
        }, {} as Record<string, number>),
        errorsBySeverity: errorsBySeverity.reduce((acc, item) => {
          acc[item.severity] = item._count
          return acc
        }, {} as Record<string, number>),
        errorTrends,
        topErrors: topErrors.map(item => ({
          message: item.message,
          count: item._count,
          lastOccurred: item._max.timestamp!
        }))
      }
    } catch (error) {
      console.error('Get error stats error:', error)
      throw error
    }
  }

  // Get error details
  async getErrorDetails(
    errorId: string
  ): Promise<ErrorReport | null> {
    try {
      const error = await prisma.errorLog.findUnique({
        where: { id: errorId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true
            }
          }
        }
      })

      if (!error) return null

      return {
        id: error.id,
        message: error.message,
        stack: error.stack || undefined,
        context: error.context,
        userId: error.userId || undefined,
        sessionId: error.sessionId || undefined,
        userAgent: error.userAgent || undefined,
        url: error.url || undefined,
        timestamp: error.timestamp,
        severity: error.severity as any,
        resolved: error.resolved,
        metadata: error.metadata as Record<string, any>
      }
    } catch (error) {
      console.error('Get error details error:', error)
      throw error
    }
  }

  // Mark error as resolved
  async resolveError(errorId: string, userId: string): Promise<void> {
    try {
      await prisma.errorLog.update({
        where: { id: errorId },
        data: {
          resolved: true,
          resolvedAt: new Date(),
          resolvedBy: userId
        }
      })

      logger.info('Error resolved', { errorId, resolvedBy: userId })
    } catch (error) {
      console.error('Resolve error failed:', error)
      throw error
    }
  }

  // Get similar errors
  async getSimilarErrors(
    message: string,
    context: string,
    limit: number = 10
  ): Promise<ErrorReport[]> {
    try {
      const errors = await prisma.errorLog.findMany({
        where: {
          message: {
            contains: message.substring(0, 50),
            mode: 'insensitive'
          },
          context
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: limit
      })

      return errors.map(error => ({
        id: error.id,
        message: error.message,
        stack: error.stack || undefined,
        context: error.context,
        userId: error.userId || undefined,
        timestamp: error.timestamp,
        severity: error.severity as any,
        resolved: error.resolved
      }))
    } catch (error) {
      console.error('Get similar errors failed:', error)
      throw error
    }
  }

  // Cleanup old errors
  async cleanupOldErrors(daysToKeep: number = 90): Promise<void> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

      const result = await prisma.errorLog.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate
          },
          resolved: true
        }
      })

      logger.info('Cleaned up old errors', { deletedCount: result.count })
    } catch (error) {
      console.error('Cleanup old errors failed:', error)
    }
  }

  // Private methods
  private async getErrorTrends(
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ date: string; count: number }>> {
    try {
      const errors = await prisma.errorLog.findMany({
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          timestamp: true
        }
      })

      // Group by date
      const errorsByDate = errors.reduce((acc, error) => {
        const date = error.timestamp.toISOString().split('T')[0]
        acc[date] = (acc[date] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // Fill missing dates with 0
      const trends: Array<{ date: string; count: number }> = []
      const currentDate = new Date(startDate)
      
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0]
        trends.push({
          date: dateStr,
          count: errorsByDate[dateStr] || 0
        })
        currentDate.setDate(currentDate.getDate() + 1)
      }

      return trends
    } catch (error) {
      console.error('Get error trends failed:', error)
      return []
    }
  }

  private determineSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    const message = error.message.toLowerCase()
    
    if (message.includes('database') || message.includes('connection')) {
      return 'critical'
    }
    
    if (message.includes('validation') || message.includes('invalid')) {
      return 'low'
    }
    
    if (message.includes('permission') || message.includes('unauthorized')) {
      return 'medium'
    }
    
    return 'medium'
  }

  private async sendCriticalErrorAlert(error: ErrorReport): Promise<void> {
    try {
      // In production, integrate with email/SMS/Slack notifications
      logger.error('CRITICAL ERROR ALERT', {
        message: error.message,
        context: error.context,
        userId: error.userId,
        timestamp: error.timestamp
      })

      // Could integrate with services like:
      // - Email notifications
      // - Slack webhooks
      // - SMS alerts
      // - PagerDuty
    } catch (alertError) {
      console.error('Failed to send critical error alert:', alertError)
    }
  }
}

// Export singleton instance
export const errorTracker = new ErrorTracker()

// Error boundary for React components
export class ErrorBoundary extends Error {
  constructor(
    message: string,
    public context: string,
    public originalError?: Error
  ) {
    super(message)
    this.name = 'ErrorBoundary'
  }
}

// Utility function to wrap async functions with error tracking
export function withErrorTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: string
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args)
    } catch (error) {
      await errorTracker.trackError({
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context,
        severity: 'medium'
      })
      throw error
    }
  }) as T
}