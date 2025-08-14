import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { Button } from "./button"
import { LucideIcon } from "lucide-react"

interface QuickAction {
  title: string
  description?: string
  icon: LucideIcon
  href: string
  color?: string
  disabled?: boolean
}

interface QuickActionsProps {
  title?: string
  description?: string
  actions: QuickAction[]
  columns?: 2 | 3 | 4
  className?: string
}

export function QuickActions({ 
  title = "Aksi Cepat",
  description = "Akses cepat ke fitur yang sering digunakan",
  actions,
  columns = 2,
  className 
}: QuickActionsProps) {
  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4"
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {title}
        </CardTitle>
        {description && (
          <CardDescription>
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className={cn("grid gap-3", gridCols[columns])}>
          {actions.map((action, index) => {
            const Icon = action.icon
            const colorClasses = {
              blue: "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200",
              green: "bg-green-50 hover:bg-green-100 text-green-700 border-green-200",
              purple: "bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200",
              orange: "bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200",
              red: "bg-red-50 hover:bg-red-100 text-red-700 border-red-200",
              gray: "bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200"
            }
            
            const colorClass = action.color && colorClasses[action.color as keyof typeof colorClasses] 
              ? colorClasses[action.color as keyof typeof colorClasses]
              : colorClasses.blue

            return (
              <Button
                key={index}
                variant="outline"
                className={cn(
                  "h-auto p-4 flex flex-col items-center gap-2 transition-all duration-200 hover:scale-105 hover:shadow-md",
                  colorClass,
                  action.disabled && "opacity-50 cursor-not-allowed"
                )}
                asChild={!action.disabled}
                disabled={action.disabled}
              >
                {action.disabled ? (
                  <div>
                    <Icon className="h-6 w-6 mb-2" />
                    <div className="text-center">
                      <div className="font-medium text-sm">{action.title}</div>
                      {action.description && (
                        <div className="text-xs opacity-75 mt-1">{action.description}</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <a href={action.href}>
                    <Icon className="h-6 w-6 mb-2" />
                    <div className="text-center">
                      <div className="font-medium text-sm">{action.title}</div>
                      {action.description && (
                        <div className="text-xs opacity-75 mt-1">{action.description}</div>
                      )}
                    </div>
                  </a>
                )}
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}