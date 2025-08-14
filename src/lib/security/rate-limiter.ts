/**
 * Rate Limiter
 * Advanced rate limiting with multiple strategies
 */

import { NextRequest, NextResponse } from 'next/server'
import { cache } from '@/lib/cache/cache-manager'
import { createHash } from 'crypto'

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  keyGenerator?: (request: NextRequest) => string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  message?: string
  headers?: boolean
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  totalHits: number
}

export class RateLimiter {
  private config: Required<RateLimitConfig>

  constructor(config: RateLimitConfig) {
    this.config = {
      windowMs: config.windowMs,
      maxRequests: config.maxRequests,
      keyGenerator: config.keyGenerator || this.defaultKeyGenerator,
      skipSuccessfulRequests: config.skipSuccessfulRequests || false,
      skipFailedRequests: config.skipFailedRequests || false,
      message: config.message || 'Too many requests',
      headers: config.headers !== false
    }
  }

  /**
   * Check rate limit for request
   */
  async checkLimit(request: NextRequest): Promise<RateLimitResult> {
    const key = this.config.keyGenerator(request)
    const windowKey = `ratelimit:${key}:${this.getCurrentWindow()}`
    
    try {
      // Increment counter
      const hits = await cache.increment(windowKey)
      
      // Set expiration on first hit
      if (hits === 1) {
        await cache.expire(windowKey, Math.ceil(this.config.windowMs / 1000))
      }

      const resetTime = Date.now() + this.config.windowMs
      const remaining = Math.max(0, this.config.maxRequests - hits)

      return {
        allowed: hits <= this.config.maxRequests,
        remaining,
        resetTime,
        totalHits: hits
      }
    } catch (error) {
      console.error('Rate limit check error:', error)
      // Allow request if cache fails
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: Date.now() + this.config.windowMs,
        totalHits: 1
      }
    }
  }

  /**
   * Middleware function
   */
  middleware() {
    return async (request: NextRequest): Promise<NextResponse | null> => {
      const result = await this.checkLimit(request)

      if (!result.allowed) {
        const response = NextResponse.json(
          { error: this.config.message },
          { status: 429 }
        )

        if (this.config.headers) {
          response.headers.set('X-RateLimit-Limit', this.config.maxRequests.toString())
          response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
          response.headers.set('X-RateLimit-Reset', result.resetTime.toString())
          response.headers.set('Retry-After', Math.ceil(this.config.windowMs / 1000).toString())
        }

        return response
      }

      return null // Continue to next middleware/handler
    }
  }

  /**
   * Default key generator (IP + User Agent)
   */
  private defaultKeyGenerator(request: NextRequest): string {
    const ip = this.getClientIP(request)
    const userAgent = request.headers.get('user-agent') || ''
    const hash = createHash('md5').update(ip + userAgent).digest('hex')
    return hash.substring(0, 16)
  }

  /**
   * Get client IP address
   */
  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const remoteAddr = request.headers.get('remote-addr')
    
    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }
    
    return realIP || remoteAddr || 'unknown'
  }

  /**
   * Get current time window
   */
  private getCurrentWindow(): number {
    return Math.floor(Date.now() / this.config.windowMs)
  }
}

/**
 * Rate limit decorator
 */
export function withRateLimit(config: RateLimitConfig) {
  const limiter = new RateLimiter(config)
  
  return function <T extends any[], R>(
    handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
  ) {
    return async function (request: NextRequest, ...args: T): Promise<NextResponse> {
      const limitResponse = await limiter.middleware()(request)
      if (limitResponse) {
        return limitResponse
      }
      
      return handler(request, ...args)
    }
  }
}

// Predefined rate limiters
export const RateLimiters = {
  // Strict rate limiting for authentication endpoints
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts',
    keyGenerator: (request) => {
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                 request.headers.get('x-real-ip') || 
                 'unknown'
      return `auth:${ip}`
    }
  }),

  // General API rate limiting
  api: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    message: 'Too many API requests'
  }),

  // File upload rate limiting
  upload: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: 'Too many upload requests'
  }),

  // Document generation rate limiting
  documents: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
    message: 'Too many document generation requests'
  }),

  // Search rate limiting
  search: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50,
    message: 'Too many search requests'
  })
}

/**
 * IP-based rate limiting
 */
export async function rateLimitByIP(
  request: NextRequest,
  maxRequests: number = 100,
  windowMs: number = 60 * 1000
): Promise<RateLimitResult> {
  const limiter = new RateLimiter({
    windowMs,
    maxRequests,
    keyGenerator: (req) => {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                 req.headers.get('x-real-ip') || 
                 'unknown'
      return `ip:${ip}`
    }
  })

  return limiter.checkLimit(request)
}

/**
 * User-based rate limiting
 */
export async function rateLimitByUser(
  request: NextRequest,
  userId: string,
  maxRequests: number = 1000,
  windowMs: number = 60 * 1000
): Promise<RateLimitResult> {
  const limiter = new RateLimiter({
    windowMs,
    maxRequests,
    keyGenerator: () => `user:${userId}`
  })

  return limiter.checkLimit(request)
}

/**
 * Endpoint-specific rate limiting
 */
export async function rateLimitByEndpoint(
  request: NextRequest,
  endpoint: string,
  maxRequests: number = 50,
  windowMs: number = 60 * 1000
): Promise<RateLimitResult> {
  const limiter = new RateLimiter({
    windowMs,
    maxRequests,
    keyGenerator: (req) => {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                 req.headers.get('x-real-ip') || 
                 'unknown'
      return `endpoint:${endpoint}:${ip}`
    }
  })

  return limiter.checkLimit(request)
}

/**
 * Combined rate limiting middleware
 */
export function createRateLimitMiddleware(configs: {
  global?: RateLimitConfig
  perUser?: RateLimitConfig
  perEndpoint?: RateLimitConfig
}) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const session = await getServerSession(authOptions)
    
    // Global rate limiting
    if (configs.global) {
      const globalLimiter = new RateLimiter(configs.global)
      const globalResult = await globalLimiter.checkLimit(request)
      
      if (!globalResult.allowed) {
        return NextResponse.json(
          { error: 'Global rate limit exceeded' },
          { 
            status: 429,
            headers: {
              'X-RateLimit-Global': 'true',
              'X-RateLimit-Remaining': globalResult.remaining.toString(),
              'X-RateLimit-Reset': globalResult.resetTime.toString()
            }
          }
        )
      }
    }

    // Per-user rate limiting
    if (configs.perUser && session?.user?.id) {
      const userLimiter = new RateLimiter({
        ...configs.perUser,
        keyGenerator: () => `user:${session.user.id}`
      })
      const userResult = await userLimiter.checkLimit(request)
      
      if (!userResult.allowed) {
        return NextResponse.json(
          { error: 'User rate limit exceeded' },
          { 
            status: 429,
            headers: {
              'X-RateLimit-User': 'true',
              'X-RateLimit-Remaining': userResult.remaining.toString(),
              'X-RateLimit-Reset': userResult.resetTime.toString()
            }
          }
        )
      }
    }

    // Per-endpoint rate limiting
    if (configs.perEndpoint) {
      const url = new URL(request.url)
      const endpoint = url.pathname
      
      const endpointLimiter = new RateLimiter({
        ...configs.perEndpoint,
        keyGenerator: (req) => {
          const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('x-real-ip') || 
                     'unknown'
          return `endpoint:${endpoint}:${ip}`
        }
      })
      const endpointResult = await endpointLimiter.checkLimit(request)
      
      if (!endpointResult.allowed) {
        return NextResponse.json(
          { error: 'Endpoint rate limit exceeded' },
          { 
            status: 429,
            headers: {
              'X-RateLimit-Endpoint': 'true',
              'X-RateLimit-Remaining': endpointResult.remaining.toString(),
              'X-RateLimit-Reset': endpointResult.resetTime.toString()
            }
          }
        )
      }
    }

    return null // All rate limits passed
  }
}
