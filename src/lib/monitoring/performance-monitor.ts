// Performance monitoring utilities for OpenSID
import { performance } from 'perf_hooks'

// Performance metrics types
export interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  tags?: Record<string, string>
}

export interface ApiMetrics {
  endpoint: string
  method: string
  statusCode: number
  responseTime: number
  timestamp: number
  userId?: string
  userAgent?: string
}

export interface DatabaseMetrics {
  query: string
  duration: number
  timestamp: number
  success: boolean
  error?: string
}

export interface SystemMetrics {
  cpuUsage: number
  memoryUsage: {
    used: number
    total: number
    percentage: number
  }
  diskUsage: {
    used: number
    total: number
    percentage: number
  }
  timestamp: number
}

// Performance monitoring class
export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private apiMetrics: ApiMetrics[] = []
  private dbMetrics: DatabaseMetrics[] = []
  private maxMetrics = 10000 // Keep last 10k metrics in memory

  // Track API performance
  trackApiCall(
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number,
    userId?: string,
    userAgent?: string
  ): void {
    const metric: ApiMetrics = {
      endpoint,
      method,
      statusCode,
      responseTime,
      timestamp: Date.now(),
      userId,
      userAgent
    }

    this.apiMetrics.push(metric)
    
    // Keep only recent metrics
    if (this.apiMetrics.length > this.maxMetrics) {
      this.apiMetrics = this.apiMetrics.slice(-this.maxMetrics)
    }

    // Log slow requests
    if (responseTime > 1000) {
      console.warn(`Slow API request: ${method} ${endpoint} took ${responseTime}ms`)
    }
  }

  // Track database query performance
  trackDatabaseQuery(
    query: string,
    duration: number,
    success: boolean,
    error?: string
  ): void {
    const metric: DatabaseMetrics = {
      query: query.substring(0, 200), // Truncate long queries
      duration,
      timestamp: Date.now(),
      success,
      error
    }

    this.dbMetrics.push(metric)
    
    if (this.dbMetrics.length > this.maxMetrics) {
      this.dbMetrics = this.dbMetrics.slice(-this.maxMetrics)
    }

    // Log slow queries
    if (duration > 500) {
      console.warn(`Slow database query: ${query.substring(0, 100)}... took ${duration}ms`)
    }
  }

  // Track custom metrics
  trackMetric(name: string, value: number, tags?: Record<string, string>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      tags
    }

    this.metrics.push(metric)
    
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }
  }

  // Get API performance statistics
  getApiStats(timeRangeMinutes: number = 60): {
    totalRequests: number
    averageResponseTime: number
    errorRate: number
    slowRequests: number
    topEndpoints: Array<{ endpoint: string; count: number; avgTime: number }>
  } {
    const cutoff = Date.now() - (timeRangeMinutes * 60 * 1000)
    const recentMetrics = this.apiMetrics.filter(m => m.timestamp > cutoff)

    if (recentMetrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        errorRate: 0,
        slowRequests: 0,
        topEndpoints: []
      }
    }

    const totalRequests = recentMetrics.length
    const averageResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests
    const errorRequests = recentMetrics.filter(m => m.statusCode >= 400).length
    const errorRate = (errorRequests / totalRequests) * 100
    const slowRequests = recentMetrics.filter(m => m.responseTime > 1000).length

    // Calculate top endpoints
    const endpointStats = new Map<string, { count: number; totalTime: number }>()
    
    recentMetrics.forEach(metric => {
      const key = `${metric.method} ${metric.endpoint}`
      const existing = endpointStats.get(key) || { count: 0, totalTime: 0 }
      endpointStats.set(key, {
        count: existing.count + 1,
        totalTime: existing.totalTime + metric.responseTime
      })
    })

    const topEndpoints = Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        count: stats.count,
        avgTime: stats.totalTime / stats.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      totalRequests,
      averageResponseTime,
      errorRate,
      slowRequests,
      topEndpoints
    }
  }

  // Get database performance statistics
  getDatabaseStats(timeRangeMinutes: number = 60): {
    totalQueries: number
    averageQueryTime: number
    slowQueries: number
    errorRate: number
    topSlowQueries: Array<{ query: string; avgTime: number; count: number }>
  } {
    const cutoff = Date.now() - (timeRangeMinutes * 60 * 1000)
    const recentMetrics = this.dbMetrics.filter(m => m.timestamp > cutoff)

    if (recentMetrics.length === 0) {
      return {
        totalQueries: 0,
        averageQueryTime: 0,
        slowQueries: 0,
        errorRate: 0,
        topSlowQueries: []
      }
    }

    const totalQueries = recentMetrics.length
    const averageQueryTime = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / totalQueries
    const slowQueries = recentMetrics.filter(m => m.duration > 500).length
    const errorQueries = recentMetrics.filter(m => !m.success).length
    const errorRate = (errorQueries / totalQueries) * 100

    // Calculate slow queries
    const queryStats = new Map<string, { count: number; totalTime: number }>()
    
    recentMetrics.forEach(metric => {
      const existing = queryStats.get(metric.query) || { count: 0, totalTime: 0 }
      queryStats.set(metric.query, {
        count: existing.count + 1,
        totalTime: existing.totalTime + metric.duration
      })
    })

    const topSlowQueries = Array.from(queryStats.entries())
      .map(([query, stats]) => ({
        query,
        avgTime: stats.totalTime / stats.count,
        count: stats.count
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 10)

    return {
      totalQueries,
      averageQueryTime,
      slowQueries,
      errorRate,
      topSlowQueries
    }
  }

  // Get system metrics
  async getSystemMetrics(): Promise<SystemMetrics> {
    const memUsage = process.memoryUsage()
    
    return {
      cpuUsage: process.cpuUsage().user / 1000000, // Convert to seconds
      memoryUsage: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
      },
      diskUsage: {
        used: 0, // Would need additional library for disk usage
        total: 0,
        percentage: 0
      },
      timestamp: Date.now()
    }
  }

  // Export metrics for external monitoring systems
  exportMetrics(): {
    api: ApiMetrics[]
    database: DatabaseMetrics[]
    custom: PerformanceMetric[]
  } {
    return {
      api: [...this.apiMetrics],
      database: [...this.dbMetrics],
      custom: [...this.metrics]
    }
  }

  // Clear old metrics
  clearOldMetrics(olderThanMinutes: number = 60): void {
    const cutoff = Date.now() - (olderThanMinutes * 60 * 1000)
    
    this.apiMetrics = this.apiMetrics.filter(m => m.timestamp > cutoff)
    this.dbMetrics = this.dbMetrics.filter(m => m.timestamp > cutoff)
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff)
  }
}

// Performance timing utilities
export class PerformanceTimer {
  private startTime: number
  private name: string

  constructor(name: string) {
    this.name = name
    this.startTime = performance.now()
  }

  end(): number {
    const duration = performance.now() - this.startTime
    performanceMonitor.trackMetric(`timer.${this.name}`, duration)
    return duration
  }

  static async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const timer = new PerformanceTimer(name)
    try {
      const result = await fn()
      timer.end()
      return result
    } catch (error) {
      timer.end()
      throw error
    }
  }
}

// API middleware for automatic performance tracking
export function withPerformanceTracking(
  handler: (req: any, res: any) => Promise<any>
) {
  return async (req: any, res: any) => {
    const startTime = performance.now()
    const endpoint = req.url
    const method = req.method

    try {
      const result = await handler(req, res)
      const responseTime = performance.now() - startTime
      
      performanceMonitor.trackApiCall(
        endpoint,
        method,
        res.status || 200,
        responseTime,
        req.user?.id,
        req.headers['user-agent']
      )

      return result
    } catch (error) {
      const responseTime = performance.now() - startTime
      
      performanceMonitor.trackApiCall(
        endpoint,
        method,
        500,
        responseTime,
        req.user?.id,
        req.headers['user-agent']
      )

      throw error
    }
  }
}

// Database query wrapper for performance tracking
export function withDatabaseTracking<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  return PerformanceTimer.measure(`db.${queryName}`, async () => {
    const startTime = performance.now()
    
    try {
      const result = await queryFn()
      const duration = performance.now() - startTime
      
      performanceMonitor.trackDatabaseQuery(queryName, duration, true)
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      
      performanceMonitor.trackDatabaseQuery(
        queryName, 
        duration, 
        false, 
        error instanceof Error ? error.message : 'Unknown error'
      )
      
      throw error
    }
  })
}

// Health check utilities
export class HealthChecker {
  private checks: Map<string, () => Promise<boolean>> = new Map()

  addCheck(name: string, checkFn: () => Promise<boolean>): void {
    this.checks.set(name, checkFn)
  }

  async runHealthChecks(): Promise<{
    status: 'healthy' | 'unhealthy'
    checks: Record<string, { status: 'pass' | 'fail', responseTime: number }>
  }> {
    const results: Record<string, { status: 'pass' | 'fail', responseTime: number }> = {}
    let overallHealthy = true

    for (const [name, checkFn] of this.checks) {
      const startTime = performance.now()
      
      try {
        const passed = await checkFn()
        const responseTime = performance.now() - startTime
        
        results[name] = {
          status: passed ? 'pass' : 'fail',
          responseTime
        }

        if (!passed) {
          overallHealthy = false
        }
      } catch (error) {
        const responseTime = performance.now() - startTime
        
        results[name] = {
          status: 'fail',
          responseTime
        }
        
        overallHealthy = false
      }
    }

    return {
      status: overallHealthy ? 'healthy' : 'unhealthy',
      checks: results
    }
  }
}

// Export singleton instances
export const performanceMonitor = new PerformanceMonitor()
export const healthChecker = new HealthChecker()

// Setup default health checks
healthChecker.addCheck('database', async () => {
  try {
    const { prisma } = await import('@/lib/db')
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch {
    return false
  }
})

healthChecker.addCheck('redis', async () => {
  try {
    const { cacheManager } = await import('@/lib/cache/redis')
    const health = await cacheManager.healthCheck()
    return health.status === 'healthy'
  } catch {
    return false
  }
})