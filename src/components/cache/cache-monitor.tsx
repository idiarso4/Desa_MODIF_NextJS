/**
 * Cache Monitor Component
 * Dashboard for monitoring cache performance
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Activity, 
  Database, 
  Trash2, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown,
  Zap,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

interface CacheStats {
  hits: number
  misses: number
  sets: number
  deletes: number
  errors: number
  hitRate: number
}

interface RedisInfo {
  connected: boolean
  ping: boolean
  info: any
}

interface CacheData {
  stats: CacheStats
  redis: RedisInfo
  timestamp: string
}

export function CacheMonitor() {
  const [data, setData] = useState<CacheData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const fetchCacheStats = async () => {
    try {
      const response = await fetch('/api/cache/stats')
      if (!response.ok) {
        throw new Error('Failed to fetch cache stats')
      }
      const result = await response.json()
      setData(result.data)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchCacheStats()
  }

  const handleClearCache = async () => {
    if (!confirm('Are you sure you want to clear all cache?')) return

    try {
      const response = await fetch('/api/cache/stats?action=clear', {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to clear cache')
      }

      await fetchCacheStats()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear cache')
    }
  }

  const handleResetStats = async () => {
    if (!confirm('Are you sure you want to reset cache statistics?')) return

    try {
      const response = await fetch('/api/cache/stats?action=reset-stats', {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to reset stats')
      }

      await fetchCacheStats()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset stats')
    }
  }

  useEffect(() => {
    fetchCacheStats()
    
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchCacheStats, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!data) return null

  const { stats, redis } = data
  const totalRequests = stats.hits + stats.misses

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cache Monitor</h2>
          <p className="text-muted-foreground">
            Monitor cache performance and Redis status
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetStats}
          >
            <Activity className="h-4 w-4 mr-2" />
            Reset Stats
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleClearCache}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Cache
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Redis Status</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {redis.connected && redis.ping ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <Badge variant="default">Connected</Badge>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <Badge variant="destructive">Disconnected</Badge>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hit Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.hitRate}%</div>
            <Progress value={stats.hitRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {stats.hits} hits / {totalRequests} requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Operations</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sets}</div>
            <p className="text-xs text-muted-foreground">
              Sets: {stats.sets} | Deletes: {stats.deletes}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.errors}</div>
            <p className="text-xs text-muted-foreground">
              Cache operation errors
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cache Performance</CardTitle>
            <CardDescription>
              Detailed cache hit/miss statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Cache Hits</span>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-lg font-bold">{stats.hits}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Cache Misses</span>
                <div className="flex items-center space-x-2">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span className="text-lg font-bold">{stats.misses}</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Requests</span>
                <span className="text-lg font-bold">{totalRequests}</span>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Hit Rate</span>
                  <Badge variant={stats.hitRate > 80 ? "default" : stats.hitRate > 60 ? "secondary" : "destructive"}>
                    {stats.hitRate}%
                  </Badge>
                </div>
                <Progress value={stats.hitRate} className="mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Redis Information</CardTitle>
            <CardDescription>
              Redis server status and memory usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Connection Status</span>
                <Badge variant={redis.connected ? "default" : "destructive"}>
                  {redis.connected ? "Connected" : "Disconnected"}
                </Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Ping Response</span>
                <Badge variant={redis.ping ? "default" : "destructive"}>
                  {redis.ping ? "OK" : "Failed"}
                </Badge>
              </div>

              {redis.info && (
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">Memory Usage</h4>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Used Memory: {redis.info.used_memory_human || 'N/A'}</div>
                    <div>Peak Memory: {redis.info.used_memory_peak_human || 'N/A'}</div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <div className="text-xs text-muted-foreground">
                  Last Updated: {new Date(data.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
