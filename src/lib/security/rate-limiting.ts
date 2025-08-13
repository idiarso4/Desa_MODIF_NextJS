// Rate limiting and DDoS protection
import { NextRequest } from 'next/server'
import { cacheManager } from '@/lib/cache/redis'

// Rate limit configurations
export const RateLimitConfig = {
  // Authentication endpoints
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 5,
    blockDurationMs: 30 * 60 * 1000 // 30 minutes
  },
  
  // Password reset
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxAttempts: 3,
    blockDurationMs: 60 * 60 * 1000 // 1 hour
  },
  
  // API endpoints
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxAttempts: 100,
    blockDurationMs: 5 * 60 * 1000 // 5 minutes
  },
  
  // Public endpoints
  public: {
    windowMs: 60 * 1000, // 1 minute
    maxAttempts: 30,
    blockDurationMs: 2 * 60 * 1000 // 2 minutes
  },
  
  // File upload
  upload: {
    windowMs: 60 * 1000, // 1 minute
    maxAttempts: 10,
    blockDurationMs: 10 * 60 * 1000 // 10 minutes
  },
  
  // Search endpoints
  search: {
    windowMs: 60 * 1000, // 1 minute
    maxAttempts: 50,
    blockDurationMs: 2 * 60 * 1000 // 2 minutes
  }
} as const

export type RateLimitType = keyof typeof RateLimitConfig

// Rate limiter class
export class RateLimiter {
  private getKey(identifier: string, type: RateLimitType): string {
    return `rate_limit:${type}:${identifier}`
  }

  private getBlockKey(identifier: string, type: RateLimitType): string {
    return `rate_limit_block:${type}:${identifier}`
  }

  // Check if identifier is currently blocked
  async isBlocked(identifier: string, type: RateLimitType): Promise<boolean> {
    const blockKey = this.getBlockKey(identifier, type)
    return await cacheManager.exists(blockKey)
  }

  // Check rate limit and increment counter
  async checkRateLimit(identifier: string, type: RateLimitType): Promise<{
    allowed: boolean
    remaining: number
    resetTime: number
    blocked: boolean
  }> {
    const config = RateLimitConfig[type]
    const key = this.getKey(identifier, type)
    const blockKey = this.getBlockKey(identifier, type)

    // Check if already blocked
    const isBlocked = await cacheManager.exists(blockKey)
    if (isBlocked) {
      const blockTtl = await cacheManager.ttl(blockKey)
      return {
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + (blockTtl * 1000),
        blocked: true
      }
    }

    // Get current count
    const currentCount = await cacheManager.get<number>(key) || 0
    const newCount = currentCount + 1

    // Check if limit exceeded
    if (newCount > config.maxAttempts) {
      // Block the identifier
      await cacheManager.set(blockKey, true, Math.floor(config.blockDurationMs / 1000))
      
      // Clear the rate limit counter
      await cacheManager.del(key)
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + config.blockDurationMs,
        blocked: true
      }
    }

    // Update counter
    await cacheManager.set(key, newCount, Math.floor(config.windowMs / 1000))

    return {
      allowed: true,
      remaining: config.maxAttempts - newCount,
      resetTime: Date.now() + config.windowMs,
      blocked: false
    }
  }

  // Reset rate limit for identifier
  async resetRateLimit(identifier: string, type: RateLimitType): Promise<void> {
    const key = this.getKey(identifier, type)
    const blockKey = this.getBlockKey(identifier, type)
    
    await Promise.all([
      cacheManager.del(key),
      cacheManager.del(blockKey)
    ])
  }

  // Get current rate limit status
  async getRateLimitStatus(identifier: string, type: RateLimitType): Promise<{
    count: number
    remaining: number
    resetTime: number
    blocked: boolean
  }> {
    const config = RateLimitConfig[type]
    const key = this.getKey(identifier, type)
    const blockKey = this.getBlockKey(identifier, type)

    const [currentCount, isBlocked, keyTtl, blockTtl] = await Promise.all([
      cacheManager.get<number>(key),
      cacheManager.exists(blockKey),
      cacheManager.ttl(key),
      cacheManager.ttl(blockKey)
    ])

    const count = currentCount || 0
    const remaining = Math.max(0, config.maxAttempts - count)
    
    if (isBlocked) {
      return {
        count,
        remaining: 0,
        resetTime: Date.now() + (blockTtl * 1000),
        blocked: true
      }
    }

    return {
      count,
      remaining,
      resetTime: keyTtl > 0 ? Date.now() + (keyTtl * 1000) : Date.now() + config.windowMs,
      blocked: false
    }
  }
}

// IP-based rate limiting
export class IPRateLimiter extends RateLimiter {
  async checkIPRateLimit(ip: string, type: RateLimitType) {
    return this.checkRateLimit(ip, type)
  }

  async isIPBlocked(ip: string, type: RateLimitType) {
    return this.isBlocked(ip, type)
  }
}

// User-based rate limiting
export class UserRateLimiter extends RateLimiter {
  async checkUserRateLimit(userId: string, type: RateLimitType) {
    return this.checkRateLimit(userId, type)
  }

  async isUserBlocked(userId: string, type: RateLimitType) {
    return this.isBlocked(userId, type)
  }
}

// Combined rate limiting (IP + User)
export class CombinedRateLimiter {
  private ipLimiter = new IPRateLimiter()
  private userLimiter = new UserRateLimiter()

  async checkCombinedRateLimit(
    ip: string,
    userId: string | null,
    type: RateLimitType
  ): Promise<{
    allowed: boolean
    ipLimit: any
    userLimit?: any
    blocked: boolean
  }> {
    // Always check IP rate limit
    const ipLimit = await this.ipLimiter.checkIPRateLimit(ip, type)
    
    // Check user rate limit if user is authenticated
    let userLimit
    if (userId) {
      userLimit = await this.userLimiter.checkUserRateLimit(userId, type)
    }

    // Block if either IP or user is blocked/exceeded
    const blocked = !ipLimit.allowed || (userLimit && !userLimit.allowed)

    return {
      allowed: !blocked,
      ipLimit,
      userLimit,
      blocked
    }
  }
}

// DDoS protection
export class DDoSProtection {
  private suspiciousIPs = new Set<string>()
  private readonly SUSPICIOUS_THRESHOLD = 1000 // requests per minute
  private readonly BAN_DURATION = 60 * 60 * 1000 // 1 hour

  async checkDDoS(ip: string): Promise<{
    allowed: boolean
    suspicious: boolean
    banned: boolean
  }> {
    const key = `ddos:${ip}`
    const banKey = `ddos_ban:${ip}`

    // Check if IP is banned
    const isBanned = await cacheManager.exists(banKey)
    if (isBanned) {
      return {
        allowed: false,
        suspicious: true,
        banned: true
      }
    }

    // Get current request count
    const currentCount = await cacheManager.get<number>(key) || 0
    const newCount = currentCount + 1

    // Update counter
    await cacheManager.set(key, newCount, 60) // 1 minute window

    // Check if suspicious
    const suspicious = newCount > this.SUSPICIOUS_THRESHOLD

    if (suspicious) {
      // Ban the IP
      await cacheManager.set(banKey, true, Math.floor(this.BAN_DURATION / 1000))
      this.suspiciousIPs.add(ip)
      
      return {
        allowed: false,
        suspicious: true,
        banned: true
      }
    }

    return {
      allowed: true,
      suspicious: false,
      banned: false
    }
  }

  async unbanIP(ip: string): Promise<void> {
    const banKey = `ddos_ban:${ip}`
    await cacheManager.del(banKey)
    this.suspiciousIPs.delete(ip)
  }

  getSuspiciousIPs(): string[] {
    return Array.from(this.suspiciousIPs)
  }
}

// Request fingerprinting for advanced protection
export class RequestFingerprinter {
  generateFingerprint(request: NextRequest): string {
    const ip = this.getClientIP(request)
    const userAgent = request.headers.get('user-agent') || ''
    const acceptLanguage = request.headers.get('accept-language') || ''
    const acceptEncoding = request.headers.get('accept-encoding') || ''
    
    // Create a simple hash of the fingerprint components
    const fingerprint = `${ip}:${userAgent}:${acceptLanguage}:${acceptEncoding}`
    return Buffer.from(fingerprint).toString('base64')
  }

  private getClientIP(request: NextRequest): string {
    // Try various headers to get the real client IP
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const cfConnectingIP = request.headers.get('cf-connecting-ip')
    
    if (cfConnectingIP) return cfConnectingIP
    if (realIP) return realIP
    if (forwarded) return forwarded.split(',')[0].trim()
    
    return request.ip || 'unknown'
  }
}

// Rate limiting middleware factory
export function createRateLimitMiddleware(type: RateLimitType) {
  const limiter = new CombinedRateLimiter()
  const ddosProtection = new DDoSProtection()
  const fingerprinter = new RequestFingerprinter()

  return async (request: NextRequest) => {
    const ip = fingerprinter.getClientIP(request)
    const userId = null // Would extract from session/token
    
    // Check DDoS protection first
    const ddosCheck = await ddosProtection.checkDDoS(ip)
    if (!ddosCheck.allowed) {
      return {
        allowed: false,
        reason: 'DDoS protection triggered',
        headers: {
          'X-RateLimit-Blocked': 'true',
          'X-RateLimit-Reason': 'DDoS'
        }
      }
    }

    // Check rate limits
    const rateCheck = await limiter.checkCombinedRateLimit(ip, userId, type)
    
    if (!rateCheck.allowed) {
      return {
        allowed: false,
        reason: 'Rate limit exceeded',
        headers: {
          'X-RateLimit-Limit': RateLimitConfig[type].maxAttempts.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateCheck.ipLimit.resetTime.toString(),
          'X-RateLimit-Blocked': 'true'
        }
      }
    }

    return {
      allowed: true,
      headers: {
        'X-RateLimit-Limit': RateLimitConfig[type].maxAttempts.toString(),
        'X-RateLimit-Remaining': rateCheck.ipLimit.remaining.toString(),
        'X-RateLimit-Reset': rateCheck.ipLimit.resetTime.toString()
      }
    }
  }
}

// Export singleton instances
export const ipRateLimiter = new IPRateLimiter()
export const userRateLimiter = new UserRateLimiter()
export const combinedRateLimiter = new CombinedRateLimiter()
export const ddosProtection = new DDoSProtection()
export const requestFingerprinter = new RequestFingerprinter()

// Utility function to get client IP from request
export function getClientIP(request: NextRequest): string {
  return requestFingerprinter['getClientIP'](request)
}