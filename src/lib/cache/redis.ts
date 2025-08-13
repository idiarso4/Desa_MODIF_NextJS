// Redis client configuration and utilities
import Redis from 'ioredis'

// Redis client instance
let redis: Redis | null = null

export function getRedisClient(): Redis {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
    
    redis = new Redis(redisUrl, {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,
      connectTimeout: 10000,
      commandTimeout: 5000,
    })

    redis.on('error', (error) => {
      console.error('Redis connection error:', error)
    })

    redis.on('connect', () => {
      console.log('Redis connected successfully')
    })
  }

  return redis
}

// Cache key generators
export const CacheKeys = {
  // Citizens
  citizen: (id: string) => `citizen:${id}`,
  citizenList: (page: number, limit: number, search?: string) => 
    `citizens:list:${page}:${limit}${search ? `:${search}` : ''}`,
  citizenStats: () => 'citizens:stats',
  citizenSearch: (query: string) => `citizens:search:${query}`,

  // Families
  family: (id: string) => `family:${id}`,
  familyList: (page: number, limit: number) => `families:list:${page}:${limit}`,
  familyMembers: (familyId: string) => `family:${familyId}:members`,

  // Letters
  letter: (id: string) => `letter:${id}`,
  letterList: (status?: string, page?: number) => 
    `letters:list${status ? `:${status}` : ''}${page ? `:${page}` : ''}`,
  letterTemplates: () => 'letters:templates',

  // Finance
  budget: (year: number) => `budget:${year}`,
  expenses: (month: string) => `expenses:${month}`,
  aidPrograms: () => 'aid:programs',
  financialStats: (year: number) => `finance:stats:${year}`,

  // Public content
  articles: (page: number) => `articles:public:${page}`,
  announcements: () => 'announcements:active',
  events: () => 'events:upcoming',

  // System
  userPermissions: (userId: string) => `user:${userId}:permissions`,
  systemStats: () => 'system:stats',
  villageConfig: () => 'village:config',
} as const

// Cache utilities
export class CacheManager {
  private redis: Redis

  constructor() {
    this.redis = getRedisClient()
  }

  // Generic cache operations
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error)
      return null
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<boolean> {
    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(value))
      return true
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error)
      return false
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      await this.redis.del(key)
      return true
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error)
      return false
    }
  }

  async delPattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern)
      if (keys.length > 0) {
        return await this.redis.del(...keys)
      }
      return 0
    } catch (error) {
      console.error(`Cache delete pattern error for ${pattern}:`, error)
      return 0
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key)
      return result === 1
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error)
      return false
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.redis.ttl(key)
    } catch (error) {
      console.error(`Cache TTL error for key ${key}:`, error)
      return -1
    }
  }

  // Specialized cache operations
  async getOrSet<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    ttlSeconds: number = 3600
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cached = await this.get<T>(key)
      if (cached !== null) {
        return cached
      }

      // If not in cache, fetch and cache
      const data = await fetcher()
      await this.set(key, data, ttlSeconds)
      return data
    } catch (error) {
      console.error(`Cache getOrSet error for key ${key}:`, error)
      // Fallback to direct fetch if cache fails
      return await fetcher()
    }
  }

  // Invalidate related caches
  async invalidateCitizenCaches(citizenId?: string): Promise<void> {
    const patterns = [
      'citizens:list:*',
      'citizens:stats',
      'citizens:search:*',
      'system:stats'
    ]

    if (citizenId) {
      patterns.push(`citizen:${citizenId}`)
    }

    await Promise.all(patterns.map(pattern => this.delPattern(pattern)))
  }

  async invalidateFamilyCaches(familyId?: string): Promise<void> {
    const patterns = [
      'families:list:*',
      'citizens:list:*', // Family changes affect citizen lists
      'system:stats'
    ]

    if (familyId) {
      patterns.push(`family:${familyId}`)
      patterns.push(`family:${familyId}:members`)
    }

    await Promise.all(patterns.map(pattern => this.delPattern(pattern)))
  }

  async invalidateLetterCaches(letterId?: string): Promise<void> {
    const patterns = [
      'letters:list:*',
      'system:stats'
    ]

    if (letterId) {
      patterns.push(`letter:${letterId}`)
    }

    await Promise.all(patterns.map(pattern => this.delPattern(pattern)))
  }

  async invalidateFinanceCaches(): Promise<void> {
    const patterns = [
      'budget:*',
      'expenses:*',
      'finance:stats:*',
      'system:stats'
    ]

    await Promise.all(patterns.map(pattern => this.delPattern(pattern)))
  }

  async invalidatePublicCaches(): Promise<void> {
    const patterns = [
      'articles:public:*',
      'announcements:active',
      'events:upcoming'
    ]

    await Promise.all(patterns.map(pattern => this.delPattern(pattern)))
  }

  // Health check
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy', latency?: number }> {
    try {
      const start = Date.now()
      await this.redis.ping()
      const latency = Date.now() - start
      
      return { status: 'healthy', latency }
    } catch (error) {
      console.error('Redis health check failed:', error)
      return { status: 'unhealthy' }
    }
  }
}

// Export singleton instance
export const cacheManager = new CacheManager()

// Cache TTL constants (in seconds)
export const CacheTTL = {
  SHORT: 300,      // 5 minutes
  MEDIUM: 1800,    // 30 minutes  
  LONG: 3600,      // 1 hour
  VERY_LONG: 86400 // 24 hours
} as const