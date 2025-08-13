/**
 * Higher-Order Components for RBAC
 * HOCs for component-level authorization
 */

'use client'

import React, { ComponentType } from 'react'
import { useAuth, usePermission, useRole } from '@/lib/auth/hooks'
import { Loader2, Shield } from 'lucide-react'

interface WithAuthOptions {
  fallback?: React.ComponentType
  loading?: React.ComponentType
  redirectTo?: string
}

interface WithPermissionOptions extends WithAuthOptions {
  resource: string
  action: string
}

interface WithRoleOptions extends WithAuthOptions {
  roles: string[]
}

/**
 * Default loading component
 */
const DefaultLoading: React.FC = () => (
  <div className="flex items-center justify-center p-8">
    <div className="flex items-center space-x-2">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="text-sm text-gray-600">Memuat...</span>
    </div>
  </div>
)

/**
 * Default unauthorized component
 */
const DefaultUnauthorized: React.FC = () => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center">
      <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Akses Ditolak
      </h3>
      <p className="text-sm text-gray-600">
        Anda tidak memiliki izin untuk melihat konten ini.
      </p>
    </div>
  </div>
)

/**
 * HOC that requires authentication
 */
export function withAuth<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: WithAuthOptions = {}
): ComponentType<P> {
  const {
    fallback: FallbackComponent = DefaultUnauthorized,
    loading: LoadingComponent = DefaultLoading
  } = options

  return function WithAuthComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth()

    if (isLoading) {
      return <LoadingComponent />
    }

    if (!isAuthenticated) {
      return <FallbackComponent />
    }

    return <WrappedComponent {...props} />
  }
}

/**
 * HOC that requires specific permission
 */
export function withPermission<P extends object>(
  WrappedComponent: ComponentType<P>,
  resource: string,
  action: string,
  options: WithAuthOptions = {}
): ComponentType<P> {
  const {
    fallback: FallbackComponent = DefaultUnauthorized,
    loading: LoadingComponent = DefaultLoading
  } = options

  return function WithPermissionComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth()
    const { hasPermission } = usePermission(resource, action)

    if (isLoading) {
      return <LoadingComponent />
    }

    if (!isAuthenticated || !hasPermission) {
      return <FallbackComponent />
    }

    return <WrappedComponent {...props} />
  }
}

/**
 * HOC that requires specific role
 */
export function withRole<P extends object>(
  WrappedComponent: ComponentType<P>,
  roles: string[],
  options: WithAuthOptions = {}
): ComponentType<P> {
  const {
    fallback: FallbackComponent = DefaultUnauthorized,
    loading: LoadingComponent = DefaultLoading
  } = options

  return function WithRoleComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth()
    const { hasRole } = useRole(roles)

    if (isLoading) {
      return <LoadingComponent />
    }

    if (!isAuthenticated || !hasRole) {
      return <FallbackComponent />
    }

    return <WrappedComponent {...props} />
  }
}

/**
 * HOC for admin-only components
 */
export function withAdmin<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: WithAuthOptions = {}
): ComponentType<P> {
  return withRole(WrappedComponent, ['Super Admin', 'Admin Desa'], options)
}

/**
 * HOC for operator-level components
 */
export function withOperator<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: WithAuthOptions = {}
): ComponentType<P> {
  return withRole(WrappedComponent, ['Super Admin', 'Admin Desa', 'Operator'], options)
}

/**
 * Utility function to create permission-based HOC
 */
export function createPermissionHOC(resource: string, action: string) {
  return function<P extends object>(
    WrappedComponent: ComponentType<P>,
    options: WithAuthOptions = {}
  ): ComponentType<P> {
    return withPermission(WrappedComponent, resource, action, options)
  }
}

/**
 * Common permission HOCs
 */
export const withCitizenRead = createPermissionHOC('citizens', 'read')
export const withCitizenCreate = createPermissionHOC('citizens', 'create')
export const withCitizenUpdate = createPermissionHOC('citizens', 'update')
export const withCitizenDelete = createPermissionHOC('citizens', 'delete')
export const withCitizenManage = createPermissionHOC('citizens', 'manage')

export const withLetterRead = createPermissionHOC('letters', 'read')
export const withLetterProcess = createPermissionHOC('letters', 'process')
export const withLetterManage = createPermissionHOC('letters', 'manage')

export const withFinanceRead = createPermissionHOC('finance', 'read')
export const withFinanceManage = createPermissionHOC('finance', 'manage')

export const withUserManage = createPermissionHOC('users', 'manage')
export const withSettingsManage = createPermissionHOC('settings', 'manage')

export const withReportsRead = createPermissionHOC('reports', 'read')
export const withReportsExport = createPermissionHOC('reports', 'export')

/**
 * Compose multiple HOCs
 */
export function compose<P extends object>(
  ...hocs: Array<(component: ComponentType<P>) => ComponentType<P>>
) {
  return function(WrappedComponent: ComponentType<P>): ComponentType<P> {
    return hocs.reduceRight((acc, hoc) => hoc(acc), WrappedComponent)
  }
}

/**
 * Example usage:
 * 
 * // Simple permission check
 * const ProtectedComponent = withPermission(MyComponent, 'citizens', 'read')
 * 
 * // Role-based protection
 * const AdminComponent = withAdmin(MyComponent)
 * 
 * // Multiple protections
 * const SuperProtectedComponent = compose(
 *   withAuth,
 *   withPermission('citizens', 'manage'),
 *   withRole(['Super Admin'])
 * )(MyComponent)
 * 
 * // Using predefined HOCs
 * const CitizenManager = withCitizenManage(CitizenManagementComponent)
 */