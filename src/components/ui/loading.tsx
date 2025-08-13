/**
 * Loading Components
 * Various loading states and spinners
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className, size = 'md', ...props }, ref) => {
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-8 w-8'
    }

    return (
      <div
        ref={ref}
        className={cn("flex items-center justify-center", className)}
        {...props}
      >
        <Loader2 className={cn("animate-spin", sizeClasses[size])} />
      </div>
    )
  }
)
LoadingSpinner.displayName = "LoadingSpinner"

interface LoadingOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  show: boolean
  message?: string
}

const LoadingOverlay = React.forwardRef<HTMLDivElement, LoadingOverlayProps>(
  ({ className, show, message = "Memuat...", ...props }, ref) => {
    if (!show) return null

    return (
      <div
        ref={ref}
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm",
          className
        )}
        {...props}
      >
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center space-x-3">
            <LoadingSpinner size="md" />
            <span className="text-sm font-medium">{message}</span>
          </div>
        </div>
      </div>
    )
  }
)
LoadingOverlay.displayName = "LoadingOverlay"

interface LoadingCardProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string
}

const LoadingCard = React.forwardRef<HTMLDivElement, LoadingCardProps>(
  ({ className, message = "Memuat data...", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center p-8 space-y-4 bg-white rounded-lg border",
          className
        )}
        {...props}
      >
        <LoadingSpinner size="lg" />
        <p className="text-sm text-gray-600">{message}</p>
      </div>
    )
  }
)
LoadingCard.displayName = "LoadingCard"

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  loadingText?: string
}

const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ className, loading = false, loadingText, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        disabled={loading || disabled}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? (loadingText || "Memproses...") : children}
      </button>
    )
  }
)
LoadingButton.displayName = "LoadingButton"

export {
  LoadingSpinner,
  LoadingOverlay,
  LoadingCard,
  LoadingButton,
}