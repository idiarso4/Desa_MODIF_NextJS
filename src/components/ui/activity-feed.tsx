import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { Badge } from "./badge"
import { Avatar, AvatarFallback, AvatarImage } from "./avatar"
import { formatDistanceToNow } from "date-fns"
import { id } from "date-fns/locale"

interface ActivityItem {
  id: string
  user?: {
    name: string
    avatar?: string
  }
  action: string
  resource?: string
  description?: string
  timestamp: Date
  type?: 'create' | 'update' | 'delete' | 'login' | 'system'
  metadata?: Record<string, any>
}

interface ActivityFeedProps {
  title?: string
  description?: string
  activities: ActivityItem[]
  maxItems?: number
  showAvatars?: boolean
  className?: string
}

export function ActivityFeed({ 
  title = "Aktivitas Terbaru",
  description = "Log aktivitas sistem terbaru",
  activities,
  maxItems = 10,
  showAvatars = true,
  className 
}: ActivityFeedProps) {
  const displayActivities = activities.slice(0, maxItems)

  const getActivityColor = (type?: string) => {
    switch (type) {
      case 'create':
        return 'bg-green-500'
      case 'update':
        return 'bg-blue-500'
      case 'delete':
        return 'bg-red-500'
      case 'login':
        return 'bg-purple-500'
      case 'system':
        return 'bg-gray-500'
      default:
        return 'bg-blue-500'
    }
  }

  const getActivityBadge = (type?: string) => {
    switch (type) {
      case 'create':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Buat</Badge>
      case 'update':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Update</Badge>
      case 'delete':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Hapus</Badge>
      case 'login':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Login</Badge>
      case 'system':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">System</Badge>
      default:
        return <Badge variant="secondary">Aktivitas</Badge>
    }
  }

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          {activities.length > maxItems && (
            <Badge variant="outline">
              {maxItems} dari {activities.length}
            </Badge>
          )}
        </CardTitle>
        {description && (
          <CardDescription>
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayActivities.length > 0 ? (
            displayActivities.map((activity, index) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                {/* Timeline dot */}
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "w-3 h-3 rounded-full flex-shrink-0 mt-1",
                    getActivityColor(activity.type)
                  )} />
                  {index < displayActivities.length - 1 && (
                    <div className="w-px h-8 bg-gray-200 mt-2" />
                  )}
                </div>

                {/* Avatar */}
                {showAvatars && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={activity.user?.avatar} />
                    <AvatarFallback className="text-xs">
                      {activity.user?.name ? getUserInitials(activity.user.name) : 'SY'}
                    </AvatarFallback>
                  </Avatar>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">
                        {activity.user?.name || 'System'}
                      </span>
                      {' '}
                      <span className="text-gray-600">
                        {activity.description || `${activity.action} ${activity.resource || ''}`}
                      </span>
                    </p>
                    {getActivityBadge(activity.type)}
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <time dateTime={activity.timestamp.toISOString()}>
                      {formatDistanceToNow(activity.timestamp, { 
                        addSuffix: true,
                        locale: id 
                      })}
                    </time>
                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        Detail
                      </Badge>
                    )}
                  </div>

                  {/* Metadata */}
                  {activity.metadata && (
                    <div className="text-xs text-gray-500 bg-gray-50 rounded p-2 mt-2">
                      {Object.entries(activity.metadata).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="font-medium">{key}:</span>
                          <span>{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">
                Belum ada aktivitas terbaru
              </p>
            </div>
          )}
        </div>

        {activities.length > maxItems && (
          <div className="mt-4 text-center">
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              Lihat semua aktivitas ({activities.length})
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}