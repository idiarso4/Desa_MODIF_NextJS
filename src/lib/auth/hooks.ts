/**
 * Authentication Hooks
 * React hooks for authentication and authorization
 */

'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import type { AuthUser } from './utils'

/**
 * Hook to get current user session
 */
export function useAuth() {
  const { data: session, status } = useSession()
  
  return {
    user: session?.user as AuthUser | null,
    isLoading: status === 'loading',
    isAuthenticated: !!session?.user,
    session
  }
}

/**
 * Hook to require authentication
 * Redirects to login if not authenticated
 */
export function useRequireAuth() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router])

  return { user, isLoading, isAuthenticated }
}

/**
 * Hook to check if user has specific permission
 */
export function usePermission(resource: string, action: string) {
  const { user } = useAuth()

  const hasPermission = () => {
    if (!user || !user.isActive) return false
    
    // Super Admin has all permissions
    if (user.role === 'Super Admin') return true
    
    // Check specific permission
    return user.permissions.some(
      p => p.resource === resource && p.action === action
    )
  }

  return {
    hasPermission: hasPermission(),
    user
  }
}

/**
 * Hook to check if user has any of the specified roles
 */
export function useRole(roles: string[]) {
  const { user } = useAuth()

  const hasRole = () => {
    if (!user || !user.isActive) return false
    return roles.includes(user.role)
  }

  return {
    hasRole: hasRole(),
    userRole: user?.role,
    user
  }
}

/**
 * Hook to require specific permission
 * Redirects to unauthorized page if permission denied
 */
export function useRequirePermission(resource: string, action: string) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // Super Admin has all permissions
      if (user.role === 'Super Admin') return

      // Check specific permission
      const hasPermission = user.permissions.some(
        p => p.resource === resource && p.action === action
      )

      if (!hasPermission) {
        router.push('/unauthorized')
      }
    }
  }, [isLoading, isAuthenticated, user, resource, action, router])

  return { user, isLoading, isAuthenticated }
}

/**
 * Hook to require specific role
 * Redirects to unauthorized page if role not matched
 */
export function useRequireRole(roles: string[]) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const hasRole = roles.includes(user.role)
      
      if (!hasRole) {
        router.push('/unauthorized')
      }
    }
  }, [isLoading, isAuthenticated, user, roles, router])

  return { user, isLoading, isAuthenticated }
}

/**
 * Hook for admin-only access
 */
export function useRequireAdmin() {
  return useRequireRole(['Super Admin', 'Admin Desa'])
}

/**
 * Hook for operator-level access
 */
export function useRequireOperator() {
  return useRequireRole(['Super Admin', 'Admin Desa', 'Operator'])
}

/**
 * Hook to check if user can access a specific feature
 */
export function useFeatureAccess(feature: string) {
  const { user } = useAuth()

  const featurePermissions: Record<string, { resource: string; action: string }> = {
    'citizen-management': { resource: 'citizens', action: 'read' },
    'citizen-create': { resource: 'citizens', action: 'create' },
    'citizen-edit': { resource: 'citizens', action: 'update' },
    'citizen-delete': { resource: 'citizens', action: 'delete' },
    'letter-management': { resource: 'letters', action: 'read' },
    'letter-process': { resource: 'letters', action: 'process' },
    'finance-management': { resource: 'finance', action: 'read' },
    'user-management': { resource: 'users', action: 'manage' },
    'settings': { resource: 'settings', action: 'manage' },
    'reports': { resource: 'reports', action: 'read' },
    'reports-export': { resource: 'reports', action: 'export' }
  }

  const permission = featurePermissions[feature]
  
  if (!permission) {
    console.warn(`Unknown feature: ${feature}`)
    return false
  }

  if (!user || !user.isActive) return false
  
  // Super Admin has all permissions
  if (user.role === 'Super Admin') return true
  
  // Check specific permission
  return user.permissions.some(
    p => p.resource === permission.resource && p.action === permission.action
  )
}

/**
 * Hook to get user's menu items based on permissions
 */
export function useUserMenu() {
  const { user } = useAuth()

  if (!user) return []

  const menuItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: 'Home',
      permission: null // Always accessible
    },
    {
      title: 'Penduduk',
      href: '/citizens',
      icon: 'Users',
      permission: { resource: 'citizens', action: 'read' }
    },
    {
      title: 'Keluarga',
      href: '/families',
      icon: 'Users',
      permission: { resource: 'citizens', action: 'read' }
    },
    {
      title: 'Surat Menyurat',
      href: '/letters',
      icon: 'FileText',
      permission: { resource: 'letters', action: 'read' }
    },
    {
      title: 'Dokumen',
      href: '/documents',
      icon: 'FileText',
      permission: { resource: 'documents', action: 'read' }
    },
    {
      title: 'Keuangan',
      href: '/finance',
      icon: 'DollarSign',
      permission: { resource: 'finance', action: 'read' }
    },
    {
      title: 'Artikel',
      href: '/articles',
      icon: 'Newspaper',
      permission: { resource: 'content', action: 'read' }
    },
    {
      title: 'Laporan',
      href: '/reports',
      icon: 'BarChart',
      permission: { resource: 'reports', action: 'read' }
    },
    {
      title: 'Pengguna',
      href: '/users',
      icon: 'UserCog',
      permission: { resource: 'users', action: 'manage' }
    },
    {
      title: 'Pengaturan',
      href: '/settings',
      icon: 'Settings',
      permission: { resource: 'settings', action: 'manage' }
    }
  ]

  // Filter menu items based on permissions
  return menuItems.filter(item => {
    if (!item.permission) return true // Always accessible items
    
    // Super Admin has access to everything
    if (user.role === 'Super Admin') return true
    
    // Check specific permission
    return user.permissions.some(
      p => p.resource === item.permission!.resource && p.action === item.permission!.action
    )
  })
}