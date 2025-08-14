import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { LucideIcon } from "lucide-react"

interface EnhancedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  value?: string | number
  icon?: LucideIcon
  iconColor?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  loading?: boolean
  children?: React.ReactNode
}

const EnhancedCard = React.forwardRef<HTMLDivElement, EnhancedCardProps>(
  ({ 
    className, 
    title, 
    description, 
    value, 
    icon: Icon, 
    iconColor = "text-blue-600",
    trend,
    loading = false,
    children,
    ...props 
  }, ref) => {
    return (
      <Card 
        ref={ref} 
        className={cn(
          "hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-0 shadow-md",
          className
        )} 
        {...props}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium text-gray-600">
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="text-xs">
                {description}
              </CardDescription>
            )}
          </div>
          {Icon && (
            <div className={cn("p-2 rounded-lg bg-opacity-10", iconColor.replace('text-', 'bg-'))}>
              <Icon className={cn("h-5 w-5", iconColor)} />
            </div>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
          ) : (
            <>
              {value && (
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-bold text-gray-900">
                    {typeof value === 'number' ? value.toLocaleString('id-ID') : value}
                  </div>
                  {trend && (
                    <div className={cn(
                      "flex items-center text-xs font-medium",
                      trend.isPositive ? "text-green-600" : "text-red-600"
                    )}>
                      <span>{trend.isPositive ? "+" : ""}{trend.value}%</span>
                    </div>
                  )}
                </div>
              )}
              {children}
            </>
          )}
        </CardContent>
      </Card>
    )
  }
)
EnhancedCard.displayName = "EnhancedCard"

export { EnhancedCard }