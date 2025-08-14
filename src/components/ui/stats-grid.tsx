import * as React from "react"
import { cn } from "@/lib/utils"
import { EnhancedCard } from "./enhanced-card"
import { LucideIcon } from "lucide-react"

interface StatItem {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  iconColor?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  href?: string
}

interface StatsGridProps {
  stats: StatItem[]
  loading?: boolean
  columns?: 1 | 2 | 3 | 4
  className?: string
}

export function StatsGrid({ 
  stats, 
  loading = false, 
  columns = 4,
  className 
}: StatsGridProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
  }

  return (
    <div className={cn("grid gap-6", gridCols[columns], className)}>
      {stats.map((stat, index) => {
        const CardComponent = stat.href ? 'a' : 'div'
        const cardProps = stat.href ? { href: stat.href } : {}
        
        return (
          <CardComponent key={index} {...cardProps} className={stat.href ? "block" : ""}>
            <EnhancedCard
              title={stat.title}
              description={stat.description}
              value={stat.value}
              icon={stat.icon}
              iconColor={stat.iconColor}
              trend={stat.trend}
              loading={loading}
              className={stat.href ? "cursor-pointer hover:scale-105" : ""}
            />
          </CardComponent>
        )
      })}
    </div>
  )
}