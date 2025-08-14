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

    // Add comprehensive security headers
    const response = NextResponse.next()
    
    // Basic security headers
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    
    // Permissions policy
    response.headers.set('Permissions-Policy', [
      'camera=()',
      'microphone=()',
      'geolocation=(self)',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'accelerometer=()',
      'gyroscope=()'
    ].join(', '))
    
    // HTTPS enforcement (only in production)
    if (process.env.NODE_ENV === 'production') {
      response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
    }
    
    // Content Security Policy
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://unpkg.com https://fonts.googleapis.com",
      "img-src 'self' data: blob: https: https://*.tile.openstreetmap.org https://*.openstreetmap.org",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://api.openstreetmap.org https://nominatim.openstreetmap.org",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ]
    
    if (process.env.NODE_ENV === 'production') {
      cspDirectives.push("report-uri /api/security/csp-report")
    }
    
    response.headers.set('Content-Security-Policy', cspDirectives.join('; '))
    
    // Cross-origin policies
    response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp')
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
    response.headers.set('Cross-Origin-Resource-Policy', 'same-origin')

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