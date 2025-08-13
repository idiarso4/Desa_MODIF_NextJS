// Advanced logging system for OpenSID
import path from 'path'
import { createLogger, format, Logger, transports } from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'

// Log levels
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  DEBUG = 'debug'
}

// Log categories
export enum LogCategory {
  AUTH = 'auth',
  API = 'api',
  DATABASE = 'database',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  SYSTEM = 'system',
  USER_ACTION = 'user_action',
  ERROR = 'error'
}

// Structured log entry interface
export interface LogEntry {
  level: LogLevel
  category: LogCategory
  message: string
  timestamp: string
  userId?: string
  sessionId?: string
  ip?: string
  userAgent?: string
  endpoint?: string
  method?: string
  statusCode?: number
  responseTime?: number
  error?: {
    name: string
    message: string
    stack?: string
  }
  metadata?: Record<string, any>
}

// Custom log format
const customFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.json(),
  format.printf((info) => {
    const { timestamp, level, category, message, ...meta } = info
    return JSON.stringify({
      timestamp,
      level,
      category,
      message,
      ...meta
    })
  })
)

// Logger configuration
class OpenSIDLogger {
  private logger: Logger
  private logDir: string

  constructor() {
    this.logDir = process.env.LOG_DIR || 'logs'
    this.logger = this.createLogger()
  }

  private createLogger(): Logger {
    const isDevelopment = process.env.NODE_ENV === 'development'

    return createLogger({
      level: isDevelopment ? 'debug' : 'info',
      format: customFormat,
      defaultMeta: {
        service: 'opensid-nextjs',
        version: process.env.npm_package_version || '1.0.0'
      },
      transports: [
        // Console transport for development
        ...(isDevelopment ? [
          new transports.Console({
            format: format.combine(
              format.colorize(),
              format.simple(),
              format.printf((info) => {
                const { timestamp, level, category, message } = info
                return `${timestamp} [${level}] [${category}] ${message}`
              })
            )
          })
        ] : []),

        // Error log file
        new DailyRotateFile({
          filename: path.join(this.logDir, 'error-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxSize: '20m',
          maxFiles: '30d',
          zippedArchive: true
        }),

        // Combined log file
        new DailyRotateFile({
          filename: path.join(this.logDir, 'combined-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
          zippedArchive: true
        }),

        // Security log file
        new DailyRotateFile({
          filename: path.join(this.logDir, 'security-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          level: 'warn',
          maxSize: '20m',
          maxFiles: '90d', // Keep security logs longer
          zippedArchive: true,
          format: format.combine(
            customFormat,
            format((info) => {
              return info.category === LogCategory.SECURITY ? info : false
            })()
          )
        }),

        // Performance log file
        new DailyRotateFile({
          filename: path.join(this.logDir, 'performance-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '7d',
          zippedArchive: true,
          format: format.combine(
            customFormat,
            format((info) => {
              return info.category === LogCategory.PERFORMANCE ? info : false
            })()
          )
        })
      ]
    })
  }

  // Core logging methods
  log(entry: Partial<LogEntry>): void {
    this.logger.log({
      level: entry.level || LogLevel.INFO,
      category: entry.category || LogCategory.SYSTEM,
      message: entry.message || '',
      ...entry
    })
  }

  error(message: string, error?: Error, metadata?: Record<string, any>): void {
    this.log({
      level: LogLevel.ERROR,
      category: LogCategory.ERROR,
      message,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined,
      metadata
    })
  }

  warn(message: string, category: LogCategory = LogCategory.SYSTEM, metadata?: Record<string, any>): void {
    this.log({
      level: LogLevel.WARN,
      category,
      message,
      metadata
    })
  }

  info(message: string, category: LogCategory = LogCategory.SYSTEM, metadata?: Record<string, any>): void {
    this.log({
      level: LogLevel.INFO,
      category,
      message,
      metadata
    })
  }

  debug(message: string, category: LogCategory = LogCategory.SYSTEM, metadata?: Record<string, any>): void {
    this.log({
      level: LogLevel.DEBUG,
      category,
      message,
      metadata
    })
  }

  // Specialized logging methods
  logAuth(action: string, userId?: string, success: boolean = true, metadata?: Record<string, any>): void {
    this.log({
      level: success ? LogLevel.INFO : LogLevel.WARN,
      category: LogCategory.AUTH,
      message: `Authentication ${action}: ${success ? 'success' : 'failed'}`,
      userId,
      metadata: {
        action,
        success,
        ...metadata
      }
    })
  }

  logApiRequest(
    method: string,
    endpoint: string,
    statusCode: number,
    responseTime: number,
    userId?: string,
    ip?: string,
    userAgent?: string
  ): void {
    const level = statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO
    
    this.log({
      level,
      category: LogCategory.API,
      message: `${method} ${endpoint} - ${statusCode} (${responseTime}ms)`,
      userId,
      ip,
      userAgent,
      endpoint,
      method,
      statusCode,
      responseTime
    })
  }

  logDatabaseQuery(query: string, duration: number, success: boolean, error?: string): void {
    this.log({
      level: success ? LogLevel.DEBUG : LogLevel.ERROR,
      category: LogCategory.DATABASE,
      message: `Database query ${success ? 'completed' : 'failed'} in ${duration}ms`,
      metadata: {
        query: query.substring(0, 200), // Truncate long queries
        duration,
        success,
        error
      }
    })
  }

  logSecurity(event: string, severity: 'low' | 'medium' | 'high', userId?: string, ip?: string, metadata?: Record<string, any>): void {
    const level = severity === 'high' ? LogLevel.ERROR : severity === 'medium' ? LogLevel.WARN : LogLevel.INFO
    
    this.log({
      level,
      category: LogCategory.SECURITY,
      message: `Security event: ${event}`,
      userId,
      ip,
      metadata: {
        event,
        severity,
        ...metadata
      }
    })
  }

  logUserAction(action: string, userId: string, resourceType?: string, resourceId?: string, metadata?: Record<string, any>): void {
    this.log({
      level: LogLevel.INFO,
      category: LogCategory.USER_ACTION,
      message: `User action: ${action}`,
      userId,
      metadata: {
        action,
        resourceType,
        resourceId,
        ...metadata
      }
    })
  }

  logPerformance(metric: string, value: number, unit: string = 'ms', metadata?: Record<string, any>): void {
    this.log({
      level: LogLevel.INFO,
      category: LogCategory.PERFORMANCE,
      message: `Performance metric: ${metric} = ${value}${unit}`,
      metadata: {
        metric,
        value,
        unit,
        ...metadata
      }
    })
  }

  // Query logs
  async queryLogs(options: {
    level?: LogLevel
    category?: LogCategory
    startDate?: Date
    endDate?: Date
    userId?: string
    limit?: number
  }): Promise<LogEntry[]> {
    // This would typically query a log aggregation service
    // For now, return empty array as placeholder
    return []
  }

  // Log analysis
  async getLogStats(timeRangeHours: number = 24): Promise<{
    totalLogs: number
    errorCount: number
    warnCount: number
    topCategories: Array<{ category: string; count: number }>
    topUsers: Array<{ userId: string; count: number }>
  }> {
    // This would typically analyze log files or query log service
    // For now, return placeholder data
    return {
      totalLogs: 0,
      errorCount: 0,
      warnCount: 0,
      topCategories: [],
      topUsers: []
    }
  }
}

// Request logging middleware
export function createRequestLogger() {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now()
    
    // Log request start
    logger.debug(`Request started: ${req.method} ${req.url}`, LogCategory.API, {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    })

    // Override res.end to log response
    const originalEnd = res.end
    res.end = function(...args: any[]) {
      const responseTime = Date.now() - startTime
      
      logger.logApiRequest(
        req.method,
        req.url,
        res.statusCode,
        responseTime,
        req.user?.id,
        req.ip,
        req.get('User-Agent')
      )

      originalEnd.apply(res, args)
    }

    next()
  }
}

// Error logging middleware
export function createErrorLogger() {
  return (error: Error, req: any, res: any, next: any) => {
    logger.error(`Unhandled error in ${req.method} ${req.url}`, error, {
      method: req.method,
      url: req.url,
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    })

    next(error)
  }
}

// Log rotation and cleanup
export class LogManager {
  static async cleanupOldLogs(olderThanDays: number = 30): Promise<void> {
    // This would typically clean up old log files
    // Implementation depends on log storage strategy
    console.log(`Cleaning up logs older than ${olderThanDays} days`)
  }

  static async archiveLogs(date: Date): Promise<void> {
    // Archive logs for a specific date
    console.log(`Archiving logs for ${date.toISOString()}`)
  }

  static async exportLogs(startDate: Date, endDate: Date, format: 'json' | 'csv' = 'json'): Promise<string> {
    // Export logs in specified format
    return JSON.stringify([])
  }
}

// Export singleton logger instance
export const logger = new OpenSIDLogger()