/**
 * Redis Client Configuration
 * Centralized Redis client for caching
 */

import Redis from 'ioredis'

class RedisClient {
  private static instance: Redis | null = null
  private static isConnected = false

  static getInstance(): Redis {
    if (!RedisClient.instance) {
      RedisClient.instance = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 10000,
        commandTimeout: 5000,
        onConnect: () => {
          console.log('Redis connected successfully')
          RedisClient.isConnected = true
        },
        onError: (error) => {
          console.error('Redis connection error:', error)
          RedisClient.isConnected = false
        },
        onClose: () => {
          console.log('Redis connection closed')
          RedisClient.isConnected = false
        }
      })

      // Handle graceful shutdown
      process.on('SIGINT', () => {
        RedisClient.disconnect()
      })

      process.on('SIGTERM', () => {
        RedisClient.disconnect()
      })
    }

    return RedisClient.instance
  }

  static async connect(): Promise<void> {
    const client = RedisClient.getInstance()
    
    if (!RedisClient.isConnected) {
      try {
        await client.connect()
        console.log('Redis client connected')
      } catch (error) {
        console.error('Failed to connect to Redis:', error)
        throw error
      }
    }
  }

  static async disconnect(): Promise<void> {
    if (RedisClient.instance && RedisClient.isConnected) {
      try {
        await RedisClient.instance.disconnect()
        console.log('Redis client disconnected')
      } catch (error) {
        console.error('Error disconnecting Redis:', error)
      } finally {
        RedisClient.instance = null
        RedisClient.isConnected = false
      }
    }
  }

  static isRedisConnected(): boolean {
    return RedisClient.isConnected
  }

  static async ping(): Promise<boolean> {
    try {
      const client = RedisClient.getInstance()
      const result = await client.ping()
      return result === 'PONG'
    } catch (error) {
      console.error('Redis ping failed:', error)
      return false
    }
  }
}

export default RedisClient
