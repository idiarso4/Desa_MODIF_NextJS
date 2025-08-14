/**
 * Cache Statistics API
 * Provides cache performance metrics and management
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { getCacheManager } from '@/lib/cache/cache-manager'
import RedisClient from '@/lib/cache/redis-client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'Super Admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const cacheManager = getCacheManager()
    
    // Get cache statistics
    const stats = cacheManager.getStats()
    
    // Get Redis info
    const info = await cacheManager.getInfo()
    
    // Calculate hit rate
    const hitRate = stats.hits + stats.misses > 0 
      ? (stats.hits / (stats.hits + stats.misses)) * 100 
      : 0

    // Get Redis connection status
    const isConnected = RedisClient.isRedisConnected()
    const pingResult = await RedisClient.ping()

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          ...stats,
          hitRate: Math.round(hitRate * 100) / 100
        },
        redis: {
          connected: isConnected,
          ping: pingResult,
          info: info
        },
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Cache stats error:', error)
    return NextResponse.json(
      { error: 'Failed to get cache statistics' },
      { status: 500 }
    )
  }
}

// Clear cache
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'Super Admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    const cacheManager = getCacheManager()

    switch (action) {
      case 'clear':
        await cacheManager.clear()
        break
      
      case 'reset-stats':
        cacheManager.resetStats()
        break
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      message: `Cache ${action} completed`
    })

  } catch (error) {
    console.error('Cache management error:', error)
    return NextResponse.json(
      { error: 'Failed to manage cache' },
      { status: 500 }
    )
  }
}
