/**
 * Cache Middleware
 * Middleware for caching API responses
 */

import { NextRequest, NextResponse } from 'next/server'
import { cache, CacheOptions } from './cache-manager'
import { createHash } from 'crypto'

export interface CacheMiddlewareOptions extends CacheOptions {
  keyGenerator?: (request: NextRequest) => string
  shouldCache?: (request: NextRequest, response: NextResponse) => boolean
  varyBy?: string[] // Headers to vary cache by
}

/**
 * Create cache key from request
 */
function createCacheKey(request: NextRequest, options: CacheMiddlewareOptions): string {
  if (options.keyGenerator) {
    return options.keyGenerator(request)
  }

  const url = new URL(request.url)
  const method = request.method
  const pathname = url.pathname
  const searchParams = url.searchParams.toString()
  
  // Include vary headers in cache key
  const varyHeaders: Record<string, string> = {}
  if (options.varyBy) {
    options.varyBy.forEach(header => {
      const value = request.headers.get(header)
      if (value) {
        varyHeaders[header] = value
      }
    })
  }

  const keyData = {
    method,
    pathname,
    searchParams,
    varyHeaders
  }

  const keyString = JSON.stringify(keyData)
  const hash = createHash('md5').update(keyString).digest('hex')
  
  return `api:${method}:${pathname}:${hash}`
}

/**
 * Cache middleware for API routes
 */
export function withCache(options: CacheMiddlewareOptions = {}) {
  return function <T extends any[], R>(
    handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
  ) {
    return async function (request: NextRequest, ...args: T): Promise<NextResponse> {
      // Only cache GET requests by default
      if (request.method !== 'GET') {
        return handler(request, ...args)
      }

      const cacheKey = createCacheKey(request, options)
      
      try {
        // Try to get from cache
        const cached = await cache.get(cacheKey)
        
        if (cached) {
          // Return cached response
          return new NextResponse(cached.body, {
            status: cached.status,
            statusText: cached.statusText,
            headers: {
              ...cached.headers,
              'X-Cache': 'HIT',
              'X-Cache-Key': cacheKey
            }
          })
        }

        // Execute handler
        const response = await handler(request, ...args)
        
        // Check if response should be cached
        const shouldCache = options.shouldCache 
          ? options.shouldCache(request, response)
          : response.status === 200

        if (shouldCache) {
          // Cache the response
          const responseData = {
            body: await response.text(),
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
          }

          await cache.set(cacheKey, responseData, {
            ttl: options.ttl || 300, // 5 minutes default
            tags: options.tags
          })

          // Return response with cache headers
          return new NextResponse(responseData.body, {
            status: responseData.status,
            statusText: responseData.statusText,
            headers: {
              ...responseData.headers,
              'X-Cache': 'MISS',
              'X-Cache-Key': cacheKey
            }
          })
        }

        return response
      } catch (error) {
        console.error('Cache middleware error:', error)
        // Fallback to handler if cache fails
        return handler(request, ...args)
      }
    }
  }
}

/**
 * Cache invalidation middleware
 */
export function withCacheInvalidation(tags: string[]) {
  return function <T extends any[], R>(
    handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
  ) {
    return async function (request: NextRequest, ...args: T): Promise<NextResponse> {
      const response = await handler(request, ...args)
      
      // Invalidate cache tags on successful mutations
      if (
        ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method) &&
        response.status >= 200 && 
        response.status < 300
      ) {
        try {
          await cache.invalidateByTags(tags)
        } catch (error) {
          console.error('Cache invalidation error:', error)
        }
      }

      return response
    }
  }
}

/**
 * Rate limiting with cache
 */
export async function rateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const key = `ratelimit:${identifier}`
  
  try {
    const current = await cache.increment(key)
    
    if (current === 1) {
      // First request in window, set expiration
      await cache.expire(key, windowSeconds)
    }

    const ttl = await cache.ttl(key)
    const resetTime = Date.now() + (ttl * 1000)
    
    return {
      allowed: current <= limit,
      remaining: Math.max(0, limit - current),
      resetTime
    }
  } catch (error) {
    console.error('Rate limit error:', error)
    // Allow request if cache fails
    return {
      allowed: true,
      remaining: limit - 1,
      resetTime: Date.now() + (windowSeconds * 1000)
    }
  }
}

/**
 * Session cache utilities
 */
export const SessionCache = {
  async get(sessionId: string): Promise<any> {
    return cache.get(`session:${sessionId}`)
  },

  async set(sessionId: string, data: any, ttl: number = 3600): Promise<boolean> {
    return cache.set(`session:${sessionId}`, data, { ttl })
  },

  async delete(sessionId: string): Promise<boolean> {
    return cache.delete(`session:${sessionId}`)
  },

  async extend(sessionId: string, ttl: number = 3600): Promise<boolean> {
    return cache.expire(`session:${sessionId}`, ttl)
  }
}

/**
 * Query result cache utilities
 */
export const QueryCache = {
  async getOrSet<T>(
    query: string,
    params: any[],
    fetchFunction: () => Promise<T>,
    ttl: number = 300
  ): Promise<T> {
    const key = `query:${createHash('md5').update(query + JSON.stringify(params)).digest('hex')}`
    return cache.getOrSet(key, fetchFunction, { ttl })
  },

  async invalidatePattern(pattern: string): Promise<void> {
    // This would require Redis SCAN command for pattern matching
    // For now, we'll use tags for invalidation
    await cache.invalidateByTags([pattern])
  }
}

/**
 * Cache warming utilities
 */
export const CacheWarmer = {
  async warmCitizensCache(): Promise<void> {
    // Warm frequently accessed citizen data
    console.log('Warming citizens cache...')
    // Implementation would fetch and cache popular citizen data
  },

  async warmStatsCache(): Promise<void> {
    // Warm dashboard statistics
    console.log('Warming stats cache...')
    // Implementation would fetch and cache dashboard stats
  },

  async warmSettingsCache(): Promise<void> {
    // Warm application settings
    console.log('Warming settings cache...')
    // Implementation would fetch and cache settings
  },

  async warmAll(): Promise<void> {
    await Promise.all([
      this.warmCitizensCache(),
      this.warmStatsCache(),
      this.warmSettingsCache()
    ])
  }
}
