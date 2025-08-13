// API response caching middleware and utilities
import { NextRequest, NextResponse } from 'next/server'
import { cacheManager, CacheKeys, CacheTTL } from './redis'

// Cache configuration for different endpoints
export const CacheConfig = {
  // Citizens endpoints
  '/api/citizens': { ttl: CacheTTL.MEDIUM, varyBy: ['page', 'limit', 'search'] },
  '/api/citizens/statistics': { ttl: CacheTTL.LONG, varyBy: [] },
  '/api/citizens/search': { ttl: CacheTTL.SHORT, varyBy: ['q'] },
  
  // Families endpoints
  '/api/families': { ttl: CacheTTL.MEDIUM, varyBy: ['page', 'limit'] },
  
  // Letters endpoints
  '/api/letters': { ttl: CacheTTL.SHORT, varyBy: ['status', 'page'] },
  '/api/letters/templates': { ttl: CacheTTL.VERY_LONG, varyBy: [] },
  
  // Finance endpoints
  '/api/finance/budgets': { ttl: CacheTTL.LONG, varyBy: ['year'] },
  '/api/finance/expenses': { ttl: CacheTTL.MEDIUM, varyBy: ['month', 'year'] },
  '/api/finance/aid-programs': { ttl: CacheTTL.LONG, varyBy: [] },
  
  // Public endpoints
  '/api/public/articles': { ttl: CacheTTL.LONG, varyBy: ['page', 'category'] },
  '/api/public/events': { ttl: CacheTTL.MEDIUM, varyBy: [] },
  '/api/public/statistics': { ttl: CacheTTL.VERY_LONG, varyBy: [] },
  
  // System endpoints
  '/api/dashboard/stats': { ttl: CacheTTL.MEDIUM, varyBy: [] },
  '/api/village/config': { ttl: CacheTTL.VERY_LONG, varyBy: [] },
} as const

// Generate cache key for API request
function generateCacheKey(pathname: string, searchParams: URLSearchParams): string {
  const config = CacheConfig[pathname as keyof typeof CacheConfig]
  if (!config) return `api:${pathname}`

  const varyParams = config.varyBy
    .map(param => `${param}=${searchParams.get(param) || ''}`)
    .join(':')

  return `api:${pathname}${varyParams ? `:${varyParams}` : ''}`
}

// Cache response wrapper
export async function withCache<T>(
  request: NextRequest,
  handler: () => Promise<NextResponse<T>>
): Promise<NextResponse<T>> {
  const { pathname, searchParams } = new URL(request.url)
  
  // Skip caching for non-GET requests
  if (request.method !== 'GET') {
    return handler()
  }

  // Skip caching if no config found
  const config = CacheConfig[pathname as keyof typeof CacheConfig]
  if (!config) {
    return handler()
  }

  const cacheKey = generateCacheKey(pathname, searchParams)

  try {
    // Try to get from cache
    const cached = await cacheManager.get<any>(cacheKey)
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': `public, max-age=${config.ttl}`
        }
      })
    }

    // Execute handler and cache result
    const response = await handler()
    
    if (response.ok) {
      const data = await response.json()
      await cacheManager.set(cacheKey, data, config.ttl)
      
      return NextResponse.json(data, {
        headers: {
          'X-Cache': 'MISS',
          'Cache-Control': `public, max-age=${config.ttl}`
        }
      })
    }

    return response
  } catch (error) {
    console.error('Cache middleware error:', error)
    // Fallback to handler if cache fails
    return handler()
  }
}

// Cache invalidation utilities
export class ApiCacheInvalidator {
  static async invalidateEndpoint(pathname: string): Promise<void> {
    const pattern = `api:${pathname}*`
    await cacheManager.delPattern(pattern)
  }

  static async invalidateCitizenEndpoints(): Promise<void> {
    const patterns = [
      'api:/api/citizens*',
      'api:/api/dashboard/stats*',
      'api:/api/public/statistics*'
    ]
    
    await Promise.all(patterns.map(pattern => cacheManager.delPattern(pattern)))
  }

  static async invalidateFamilyEndpoints(): Promise<void> {
    const patterns = [
      'api:/api/families*',
      'api:/api/citizens*', // Family changes affect citizen data
      'api:/api/dashboard/stats*'
    ]
    
    await Promise.all(patterns.map(pattern => cacheManager.delPattern(pattern)))
  }

  static async invalidateLetterEndpoints(): Promise<void> {
    const patterns = [
      'api:/api/letters*',
      'api:/api/dashboard/stats*'
    ]
    
    await Promise.all(patterns.map(pattern => cacheManager.delPattern(pattern)))
  }

  static async invalidateFinanceEndpoints(): Promise<void> {
    const patterns = [
      'api:/api/finance*',
      'api:/api/dashboard/stats*'
    ]
    
    await Promise.all(patterns.map(pattern => cacheManager.delPattern(pattern)))
  }

  static async invalidatePublicEndpoints(): Promise<void> {
    const patterns = [
      'api:/api/public*'
    ]
    
    await Promise.all(patterns.map(pattern => cacheManager.delPattern(pattern)))
  }
}

// Cache warming utilities
export class CacheWarmer {
  static async warmCitizenCaches(): Promise<void> {
    try {
      // Warm up citizen statistics
      const statsKey = CacheKeys.citizenStats()
      if (!(await cacheManager.exists(statsKey))) {
        // This would typically call the actual API endpoint
        console.log('Warming citizen statistics cache...')
      }

      // Warm up first page of citizens
      const listKey = CacheKeys.citizenList(1, 10)
      if (!(await cacheManager.exists(listKey))) {
        console.log('Warming citizen list cache...')
      }
    } catch (error) {
      console.error('Error warming citizen caches:', error)
    }
  }

  static async warmPublicCaches(): Promise<void> {
    try {
      // Warm up public articles
      const articlesKey = CacheKeys.articles(1)
      if (!(await cacheManager.exists(articlesKey))) {
        console.log('Warming public articles cache...')
      }

      // Warm up announcements
      const announcementsKey = CacheKeys.announcements()
      if (!(await cacheManager.exists(announcementsKey))) {
        console.log('Warming announcements cache...')
      }
    } catch (error) {
      console.error('Error warming public caches:', error)
    }
  }

  static async warmSystemCaches(): Promise<void> {
    try {
      // Warm up system stats
      const statsKey = CacheKeys.systemStats()
      if (!(await cacheManager.exists(statsKey))) {
        console.log('Warming system stats cache...')
      }

      // Warm up village config
      const configKey = CacheKeys.villageConfig()
      if (!(await cacheManager.exists(configKey))) {
        console.log('Warming village config cache...')
      }
    } catch (error) {
      console.error('Error warming system caches:', error)
    }
  }
}

// Cache health monitoring
export class CacheMonitor {
  static async getCacheStats(): Promise<{
    totalKeys: number
    memoryUsage: string
    hitRate: number
    connections: number
  }> {
    try {
      const redis = cacheManager['redis']
      const info = await redis.info('memory')
      const keyspace = await redis.info('keyspace')
      
      // Parse memory info
      const memoryMatch = info.match(/used_memory_human:(.+)/)
      const memoryUsage = memoryMatch ? memoryMatch[1].trim() : 'Unknown'
      
      // Parse keyspace info to get total keys
      const dbMatch = keyspace.match(/db0:keys=(\d+)/)
      const totalKeys = dbMatch ? parseInt(dbMatch[1]) : 0
      
      return {
        totalKeys,
        memoryUsage,
        hitRate: 0, // Would need to track this separately
        connections: 1 // Single connection in this implementation
      }
    } catch (error) {
      console.error('Error getting cache stats:', error)
      return {
        totalKeys: 0,
        memoryUsage: 'Unknown',
        hitRate: 0,
        connections: 0
      }
    }
  }

  static async clearAllCaches(): Promise<void> {
    try {
      const redis = cacheManager['redis']
      await redis.flushdb()
      console.log('All caches cleared successfully')
    } catch (error) {
      console.error('Error clearing caches:', error)
      throw error
    }
  }
}

// Export cache middleware for easy use in API routes
export { withCache as cacheMiddleware }