/**
 * Form Components
 * Form wrapper and field components with validation
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import { AlertCircle, CheckCircle } from "lucide-react"

interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode
}

const Form = React.forwardRef<HTMLFormElement, FormProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <form
        ref={ref}
        className={cn("space-y-6", className)}
        {...props}
      >
        {children}
      </form>
    )
  }
)
Form.displayName = "Form"

interface FormFieldProps {
  children: React.ReactNode
  className?: string
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, children }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-2", className)}>
        {children}
      </div>
    )
  }
)
FormField.displayName = "FormField"

interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
}

const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className, required, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
          className
        )}
        {...props}
      >
        {children}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    )
  }
)
FormLabel.displayName = "FormLabel"

interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
  type?: 'error' | 'success' | 'info'
}

const FormMessage = React.forwardRef<HTMLParagraphElement, FormMessageProps>(
  ({ className, type = 'error', children, ...props }, ref) => {
    if (!children) return null

    const Icon = type === 'error' ? AlertCircle : CheckCircle

    return (
      <p
        ref={ref}
        className={cn(
          "flex items-center gap-2 text-sm",
          type === 'error' && "text-red-600",
          type === 'success' && "text-green-600",
          type === 'info' && "text-blue-600",
          className
        )}
        {...props}
      >
        <Icon className="h-4 w-4" />
        {children}
      </p>
    )
  }
)
FormMessage.displayName = "FormMessage"

interface FormDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const FormDescription = React.forwardRef<HTMLParagraphElement, FormDescriptionProps>(
  ({ className, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn("text-sm text-muted-foreground", className)}
        {...props}
      />
    )
  }
)
FormDescription.displayName = "FormDescription"

export {
  Form,
  FormField,
  FormLabel,
  FormMessage,
  FormDescription,
}