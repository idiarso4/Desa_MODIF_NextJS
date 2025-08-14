/**
 * Cache Manager
 * High-level caching interface with multiple strategies
 */

import RedisClient from './redis-client'
import { Redis } from 'ioredis'

export interface CacheOptions {
  ttl?: number // Time to live in seconds
  tags?: string[] // Cache tags for invalidation
  compress?: boolean // Compress large values
  serialize?: boolean // Auto serialize/deserialize objects
}

export interface CacheStats {
  hits: number
  misses: number
  sets: number
  deletes: number
  errors: number
}

export class CacheManager {
  private redis: Redis
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0
  }

  constructor() {
    this.redis = RedisClient.getInstance()
  }

  /**
   * Get value from cache
   */
  async get<T = any>(key: string, options: CacheOptions = {}): Promise<T | null> {
    try {
      const value = await this.redis.get(this.formatKey(key))
      
      if (value === null) {
        this.stats.misses++
        return null
      }

      this.stats.hits++

      if (options.serialize !== false) {
        try {
          return JSON.parse(value)
        } catch {
          return value as T
        }
      }

      return value as T
    } catch (error) {
      this.stats.errors++
      console.error('Cache get error:', error)
      return null
    }
  }

  /**
   * Set value in cache
   */
  async set(
    key: string, 
    value: any, 
    options: CacheOptions = {}
  ): Promise<boolean> {
    try {
      const formattedKey = this.formatKey(key)
      let serializedValue: string

      if (options.serialize !== false && typeof value === 'object') {
        serializedValue = JSON.stringify(value)
      } else {
        serializedValue = String(value)
      }

      // Set with TTL if provided
      if (options.ttl) {
        await this.redis.setex(formattedKey, options.ttl, serializedValue)
      } else {
        await this.redis.set(formattedKey, serializedValue)
      }

      // Add tags for invalidation
      if (options.tags && options.tags.length > 0) {
        await this.addTags(formattedKey, options.tags)
      }

      this.stats.sets++
      return true
    } catch (error) {
      this.stats.errors++
      console.error('Cache set error:', error)
      return false
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      const result = await this.redis.del(this.formatKey(key))
      this.stats.deletes++
      return result > 0
    } catch (error) {
      this.stats.errors++
      console.error('Cache delete error:', error)
      return false
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(this.formatKey(key))
      return result === 1
    } catch (error) {
      this.stats.errors++
      console.error('Cache exists error:', error)
      return false
    }
  }

  /**
   * Get or set pattern - fetch from cache or execute function and cache result
   */
  async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key, options)
    
    if (cached !== null) {
      return cached
    }

    const value = await fetchFunction()
    await this.set(key, value, options)
    return value
  }

  /**
   * Increment numeric value
   */
  async increment(key: string, amount: number = 1): Promise<number> {
    try {
      return await this.redis.incrby(this.formatKey(key), amount)
    } catch (error) {
      this.stats.errors++
      console.error('Cache increment error:', error)
      return 0
    }
  }

  /**
   * Set expiration for key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const result = await this.redis.expire(this.formatKey(key), seconds)
      return result === 1
    } catch (error) {
      this.stats.errors++
      console.error('Cache expire error:', error)
      return false
    }
  }

  /**
   * Get TTL for key
   */
  async ttl(key: string): Promise<number> {
    try {
      return await this.redis.ttl(this.formatKey(key))
    } catch (error) {
      this.stats.errors++
      console.error('Cache TTL error:', error)
      return -1
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<boolean> {
    try {
      await this.redis.flushdb()
      return true
    } catch (error) {
      this.stats.errors++
      console.error('Cache clear error:', error)
      return false
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    try {
      let deletedCount = 0

      for (const tag of tags) {
        const tagKey = this.formatTagKey(tag)
        const keys = await this.redis.smembers(tagKey)
        
        if (keys.length > 0) {
          const deleted = await this.redis.del(...keys)
          deletedCount += deleted
          await this.redis.del(tagKey)
        }
      }

      return deletedCount
    } catch (error) {
      this.stats.errors++
      console.error('Cache invalidate by tags error:', error)
      return 0
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats }
  }

  /**
   * Reset cache statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0
    }
  }

  /**
   * Get cache info
   */
  async getInfo(): Promise<any> {
    try {
      const info = await this.redis.info('memory')
      const keyspace = await this.redis.info('keyspace')
      
      return {
        memory: info,
        keyspace: keyspace,
        stats: this.getStats()
      }
    } catch (error) {
      console.error('Cache info error:', error)
      return null
    }
  }

  /**
   * Add tags to key for invalidation
   */
  private async addTags(key: string, tags: string[]): Promise<void> {
    for (const tag of tags) {
      const tagKey = this.formatTagKey(tag)
      await this.redis.sadd(tagKey, key)
    }
  }

  /**
   * Format cache key with prefix
   */
  private formatKey(key: string): string {
    const prefix = process.env.CACHE_PREFIX || 'opensid'
    return `${prefix}:${key}`
  }

  /**
   * Format tag key
   */
  private formatTagKey(tag: string): string {
    const prefix = process.env.CACHE_PREFIX || 'opensid'
    return `${prefix}:tag:${tag}`
  }
}

// Singleton instance
let cacheManager: CacheManager | null = null

export function getCacheManager(): CacheManager {
  if (!cacheManager) {
    cacheManager = new CacheManager()
  }
  return cacheManager
}

// Convenience functions
export const cache = {
  get: <T = any>(key: string, options?: CacheOptions) => 
    getCacheManager().get<T>(key, options),
  
  set: (key: string, value: any, options?: CacheOptions) => 
    getCacheManager().set(key, value, options),
  
  delete: (key: string) => 
    getCacheManager().delete(key),
  
  exists: (key: string) => 
    getCacheManager().exists(key),
  
  getOrSet: <T>(key: string, fetchFunction: () => Promise<T>, options?: CacheOptions) => 
    getCacheManager().getOrSet(key, fetchFunction, options),
  
  increment: (key: string, amount?: number) => 
    getCacheManager().increment(key, amount),
  
  expire: (key: string, seconds: number) => 
    getCacheManager().expire(key, seconds),
  
  ttl: (key: string) => 
    getCacheManager().ttl(key),
  
  clear: () => 
    getCacheManager().clear(),
  
  invalidateByTags: (tags: string[]) => 
    getCacheManager().invalidateByTags(tags),
  
  getStats: () => 
    getCacheManager().getStats(),
  
  resetStats: () => 
    getCacheManager().resetStats(),
  
  getInfo: () =>
    getCacheManager().getInfo()
}

// Cache decorators and utilities
export function withCache<T extends any[], R>(
  keyGenerator: (...args: T) => string,
  options: CacheOptions = {}
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value

    descriptor.value = async function (...args: T): Promise<R> {
      const key = keyGenerator(...args)
      const cached = await cache.get<R>(key, options)

      if (cached !== null) {
        return cached
      }

      const result = await method.apply(this, args)
      await cache.set(key, result, options)
      return result
    }

    return descriptor
  }
}

// Cache key generators
export const CacheKeys = {
  citizen: (id: string) => `citizen:${id}`,
  citizens: (page: number, limit: number, filters?: string) =>
    `citizens:${page}:${limit}${filters ? `:${filters}` : ''}`,

  family: (id: string) => `family:${id}`,
  families: (page: number, limit: number) => `families:${page}:${limit}`,

  user: (id: string) => `user:${id}`,
  userByUsername: (username: string) => `user:username:${username}`,

  settings: () => 'settings:all',
  setting: (key: string) => `setting:${key}`,

  stats: (type: string, period?: string) =>
    `stats:${type}${period ? `:${period}` : ''}`,

  reports: (type: string, params?: string) =>
    `reports:${type}${params ? `:${params}` : ''}`,

  documents: (citizenId: string) => `documents:citizen:${citizenId}`,

  permissions: (userId: string) => `permissions:${userId}`,

  session: (sessionId: string) => `session:${sessionId}`
}

// Cache tags for invalidation
export const CacheTags = {
  CITIZENS: 'citizens',
  FAMILIES: 'families',
  USERS: 'users',
  SETTINGS: 'settings',
  STATS: 'stats',
  REPORTS: 'reports',
  DOCUMENTS: 'documents',
  PERMISSIONS: 'permissions',
  SESSIONS: 'sessions'
}
