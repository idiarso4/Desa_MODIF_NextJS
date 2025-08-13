/**
 * Protected Route Components
 * Components for protecting routes and content based on authentication and authorization
 */

'use client'

import { ReactNode } from 'react'
import { useAuth, usePermission, useRole } from '@/lib/auth/hooks'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: ReactNode
  fallback?: ReactNode
  loadingComponent?: ReactNode
}

interface PermissionGuardProps extends ProtectedRouteProps {
  resource: string
  action: string
}

interface RoleGuardProps extends ProtectedRouteProps {
  roles: string[]
}

/**
 * Loading component
 */
function DefaultLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex items-center space-x-2">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span>Memuat...</span>
      </div>
    </div>
  )
}

/**
 * Unauthorized component
 */
function DefaultUnauthorized() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Akses Ditolak
        </h1>
        <p className="text-gray-600">
          Anda tidak memiliki izin untuk mengakses halaman ini.
        </p>
      </div>
    </div>
  )
}

/**
 * Protect content that requires authentication
 */
export function AuthGuard({ 
  children, 
  fallback = <DefaultUnauthorized />, 
  loadingComponent = <DefaultLoading /> 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <>{loadingComponent}</>
  }

  if (!isAuthenticated) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Protect content that requires specific permission
 */
export function PermissionGuard({ 
  children, 
  resource, 
  action, 
  fallback = <DefaultUnauthorized />,
  loadingComponent = <DefaultLoading />
}: PermissionGuardProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const { hasPermission } = usePermission(resource, action)

  if (isLoading) {
    return <>{loadingComponent}</>
  }

  if (!isAuthenticated || !hasPermission) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Protect content that requires specific role
 */
export function RoleGuard({ 
  children, 
  roles, 
  fallback = <DefaultUnauthorized />,
  loadingComponent = <DefaultLoading />
}: RoleGuardProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const { hasRole } = useRole(roles)

  if (isLoading) {
    return <>{loadingComponent}</>
  }

  if (!isAuthenticated || !hasRole) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Admin-only content guard
 */
export function AdminGuard({ 
  children, 
  fallback = <DefaultUnauthorized />,
  loadingComponent = <DefaultLoading />
}: ProtectedRouteProps) {
  return (
    <RoleGuard 
      roles={['Super Admin', 'Admin Desa']}
      fallback={fallback}
      loadingComponent={loadingComponent}
    >
      {children}
    </RoleGuard>
  )
}

/**
 * Operator-level content guard
 */
export function OperatorGuard({ 
  children, 
  fallback = <DefaultUnauthorized />,
  loadingComponent = <DefaultLoading />
}: ProtectedRouteProps) {
  return (
    <RoleGuard 
      roles={['Super Admin', 'Admin Desa', 'Operator']}
      fallback={fallback}
      loadingComponent={loadingComponent}
    >
      {children}
    </RoleGuard>
  )
}

/**
 * Conditional rendering based on permission
 */
export function IfPermission({ 
  resource, 
  action, 
  children, 
  fallback = null 
}: {
  resource: string
  action: string
  children: ReactNode
  fallback?: ReactNode
}) {
  const { hasPermission } = usePermission(resource, action)
  
  return hasPermission ? <>{children}</> : <>{fallback}</>
}

/**
 * Conditional rendering based on role
 */
export function IfRole({ 
  roles, 
  children, 
  fallback = null 
}: {
  roles: string[]
  children: ReactNode
  fallback?: ReactNode
}) {
  const { hasRole } = useRole(roles)
  
  return hasRole ? <>{children}</> : <>{fallback}</>
}

/**
 * Conditional rendering for authenticated users
 */
export function IfAuthenticated({ 
  children, 
  fallback = null 
}: {
  children: ReactNode
  fallback?: ReactNode
}) {
  const { isAuthenticated } = useAuth()
  
  return isAuthenticated ? <>{children}</> : <>{fallback}</>
}

/**
 * Conditional rendering for unauthenticated users
 */
export function IfGuest({ 
  children, 
  fallback = null 
}: {
  children: ReactNode
  fallback?: ReactNode
}) {
  const { isAuthenticated } = useAuth()
  
  return !isAuthenticated ? <>{children}</> : <>{fallback}</>
}