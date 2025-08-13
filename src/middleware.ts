/**
 * Next.js Middleware
 * Handles authentication and authorization for protected routes
 */

import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default withAuth(
  function middleware(req: NextRequest & { nextauth: { token: any } }) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // Public routes that don't require authentication
    const publicRoutes = [
      '/',
      '/login',
      '/public',
      '/api/auth',
      '/api/public'
    ]

    // Check if route is public
    const isPublicRoute = publicRoutes.some(route => 
      pathname.startsWith(route) || pathname === route
    )

    // Allow public routes
    if (isPublicRoute) {
      return NextResponse.next()
    }

    // Redirect to login if not authenticated
    if (!token) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Check if user is active
    if (!token.isActive) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('error', 'AccountInactive')
      return NextResponse.redirect(loginUrl)
    }

    // Role-based route protection
    const adminRoutes = [
      '/admin',
      '/users',
      '/settings',
      '/system'
    ]

    const operatorRoutes = [
      '/citizens',
      '/families',
      '/documents',
      '/letters'
    ]

    const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))
    const isOperatorRoute = operatorRoutes.some(route => pathname.startsWith(route))

    // Check admin access
    if (isAdminRoute) {
      const hasAdminAccess = token.role === 'Super Admin' || token.role === 'Admin Desa'
      if (!hasAdminAccess) {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }

    // Check operator access
    if (isOperatorRoute) {
      const hasOperatorAccess = ['Super Admin', 'Admin Desa', 'Operator'].includes(token.role as string)
      if (!hasOperatorAccess) {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }

    // Permission-based access control
    const resourcePermissions: Record<string, { resource: string; action: string }> = {
      '/citizens': { resource: 'citizens', action: 'read' },
      '/citizens/create': { resource: 'citizens', action: 'create' },
      '/citizens/edit': { resource: 'citizens', action: 'update' },
      '/letters': { resource: 'letters', action: 'read' },
      '/letters/process': { resource: 'letters', action: 'process' },
      '/finance': { resource: 'finance', action: 'read' },
      '/reports': { resource: 'reports', action: 'read' },
      '/settings': { resource: 'settings', action: 'manage' }
    }

    // Check specific permissions
    for (const [route, permission] of Object.entries(resourcePermissions)) {
      if (pathname.startsWith(route)) {
        const hasPermission = token.permissions?.some((p: any) => 
          p.resource === permission.resource && p.action === permission.action
        )
        
        if (!hasPermission) {
          return NextResponse.redirect(new URL('/unauthorized', req.url))
        }
        break
      }
    }

    // Add security headers
    const response = NextResponse.next()
    
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

    return response
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Always allow public routes
        const publicRoutes = [
          '/',
          '/login',
          '/public',
          '/api/auth',
          '/api/public'
        ]

        const isPublicRoute = publicRoutes.some(route => 
          pathname.startsWith(route) || pathname === route
        )

        if (isPublicRoute) {
          return true
        }

        // Require authentication for protected routes
        return !!token
      }
    }
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}