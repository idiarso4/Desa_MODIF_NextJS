/**
 * Server-side RBAC Utilities
 * Server-side permission checking and authorization utilities
 */

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/config'
import { RBACManager } from './rbac-manager'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'

/**
 * Get current session on server side
 */
export async function getServerAuthSession() {
  return await getServerSession(authOptions)
}

/**
 * Require authentication on server side
 */
export async function requireServerAuth() {
  const session = await getServerAuthSession()
  
  if (!session?.user) {
    redirect('/login')
  }
  
  return session.user
}

/**
 * Require specific permission on server side
 */
export async function requireServerPermission(resource: string, action: string) {
  const user = await requireServerAuth()
  
  const hasPermission = await RBACManager.userHasPermission(
    user.id,
    resource,
    action
  )
  
  if (!hasPermission) {
    redirect('/unauthorized')
  }
  
  return user
}

/**
 * Require specific role on server side
 */
export async function requireServerRole(roles: string[]) {
  const user = await requireServerAuth()
  
  const hasRole = await RBACManager.userHasRole(user.id, roles)
  
  if (!hasRole) {
    redirect('/unauthorized')
  }
  
  return user
}

/**
 * Check permission on server side (returns boolean)
 */
export async function checkServerPermission(resource: string, action: string): Promise<boolean> {
  try {
    const session = await getServerAuthSession()
    
    if (!session?.user) {
      return false
    }
    
    return await RBACManager.userHasPermission(
      session.user.id,
      resource,
      action
    )
  } catch (error) {
    console.error('Error checking server permission:', error)
    return false
  }
}

/**
 * Check role on server side (returns boolean)
 */
export async function checkServerRole(roles: string[]): Promise<boolean> {
  try {
    const session = await getServerAuthSession()
    
    if (!session?.user) {
      return false
    }
    
    return await RBACManager.userHasRole(session.user.id, roles)
  } catch (error) {
    console.error('Error checking server role:', error)
    return false
  }
}

/**
 * API route permission middleware
 */
export function withApiPermission(resource: string, action: string) {
  return function(handler: (req: NextRequest, context: any) => Promise<Response>) {
    return async function(req: NextRequest, context: any): Promise<Response> {
      try {
        const session = await getServerAuthSession()
        
        if (!session?.user) {
          return new Response(
            JSON.stringify({ error: 'Authentication required' }),
            { 
              status: 401,
              headers: { 'Content-Type': 'application/json' }
            }
          )
        }
        
        const hasPermission = await RBACManager.userHasPermission(
          session.user.id,
          resource,
          action
        )
        
        if (!hasPermission) {
          return new Response(
            JSON.stringify({ error: 'Permission denied' }),
            { 
              status: 403,
              headers: { 'Content-Type': 'application/json' }
            }
          )
        }
        
        return handler(req, context)
      } catch (error) {
        console.error('API permission middleware error:', error)
        return new Response(
          JSON.stringify({ error: 'Internal server error' }),
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
    }
  }
}

/**
 * API route role middleware
 */
export function withApiRole(roles: string[]) {
  return function(handler: (req: NextRequest, context: any) => Promise<Response>) {
    return async function(req: NextRequest, context: any): Promise<Response> {
      try {
        const session = await getServerAuthSession()
        
        if (!session?.user) {
          return new Response(
            JSON.stringify({ error: 'Authentication required' }),
            { 
              status: 401,
              headers: { 'Content-Type': 'application/json' }
            }
          )
        }
        
        const hasRole = await RBACManager.userHasRole(session.user.id, roles)
        
        if (!hasRole) {
          return new Response(
            JSON.stringify({ error: 'Role required' }),
            { 
              status: 403,
              headers: { 'Content-Type': 'application/json' }
            }
          )
        }
        
        return handler(req, context)
      } catch (error) {
        console.error('API role middleware error:', error)
        return new Response(
          JSON.stringify({ error: 'Internal server error' }),
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
    }
  }
}

/**
 * Page-level permission guard
 */
export async function PagePermissionGuard({
  resource,
  action,
  children,
  fallback
}: {
  resource: string
  action: string
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const hasPermission = await checkServerPermission(resource, action)
  
  if (!hasPermission) {
    if (fallback) {
      return fallback
    }
    redirect('/unauthorized')
  }
  
  return children
}

/**
 * Page-level role guard
 */
export async function PageRoleGuard({
  roles,
  children,
  fallback
}: {
  roles: string[]
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const hasRole = await checkServerRole(roles)
  
  if (!hasRole) {
    if (fallback) {
      return fallback
    }
    redirect('/unauthorized')
  }
  
  return children
}

/**
 * Get user permissions for server-side rendering
 */
export async function getServerUserPermissions() {
  try {
    const session = await getServerAuthSession()
    
    if (!session?.user) {
      return []
    }
    
    return await RBACManager.getUserPermissions(session.user.id)
  } catch (error) {
    console.error('Error getting server user permissions:', error)
    return []
  }
}

/**
 * Server-side menu filtering based on permissions
 */
export async function getAuthorizedMenuItems() {
  const permissions = await getServerUserPermissions()
  const session = await getServerAuthSession()
  
  if (!session?.user) {
    return []
  }
  
  const menuItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: 'Home',
      permission: null
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
      permission: { resource: 'families', action: 'read' }
    },
    {
      title: 'Surat Menyurat',
      href: '/letters',
      icon: 'FileText',
      permission: { resource: 'letters', action: 'read' }
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
    if (session.user.role === 'Super Admin') return true
    
    // Check specific permission
    return permissions.some(
      p => p.resource === item.permission!.resource && p.action === item.permission!.action
    )
  })
}