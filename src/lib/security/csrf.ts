/**
 * CSRF Protection
 * Cross-Site Request Forgery protection utilities
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { createHash, randomBytes } from 'crypto'
import { cache } from '@/lib/cache/cache-manager'

export interface CSRFOptions {
  secret?: string
  tokenLength?: number
  cookieName?: string
  headerName?: string
  ttl?: number
}

export class CSRFProtection {
  private secret: string
  private tokenLength: number
  private cookieName: string
  private headerName: string
  private ttl: number

  constructor(options: CSRFOptions = {}) {
    this.secret = options.secret || process.env.CSRF_SECRET || 'default-csrf-secret'
    this.tokenLength = options.tokenLength || 32
    this.cookieName = options.cookieName || 'csrf-token'
    this.headerName = options.headerName || 'x-csrf-token'
    this.ttl = options.ttl || 3600 // 1 hour
  }

  /**
   * Generate CSRF token
   */
  generateToken(sessionId: string): string {
    const timestamp = Date.now().toString()
    const random = randomBytes(this.tokenLength).toString('hex')
    const payload = `${sessionId}:${timestamp}:${random}`
    
    const hash = createHash('sha256')
      .update(payload + this.secret)
      .digest('hex')
    
    return `${payload}:${hash}`
  }

  /**
   * Validate CSRF token
   */
  async validateToken(token: string, sessionId: string): Promise<boolean> {
    try {
      const parts = token.split(':')
      if (parts.length !== 4) return false

      const [tokenSessionId, timestamp, random, hash] = parts
      
      // Check session ID match
      if (tokenSessionId !== sessionId) return false

      // Check token age (prevent replay attacks)
      const tokenAge = Date.now() - parseInt(timestamp)
      if (tokenAge > this.ttl * 1000) return false

      // Verify hash
      const payload = `${tokenSessionId}:${timestamp}:${random}`
      const expectedHash = createHash('sha256')
        .update(payload + this.secret)
        .digest('hex')

      if (hash !== expectedHash) return false

      // Check if token was already used (prevent replay)
      const usedKey = `csrf:used:${hash}`
      const wasUsed = await cache.exists(usedKey)
      if (wasUsed) return false

      // Mark token as used
      await cache.set(usedKey, true, { ttl: this.ttl })

      return true
    } catch (error) {
      console.error('CSRF token validation error:', error)
      return false
    }
  }

  /**
   * Middleware for CSRF protection
   */
  middleware() {
    return async (request: NextRequest): Promise<NextResponse | null> => {
      // Skip CSRF for GET, HEAD, OPTIONS
      if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
        return null
      }

      // Get session
      const session = await getServerSession(authOptions)
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      // Get CSRF token from header or body
      let token = request.headers.get(this.headerName)
      
      if (!token && request.headers.get('content-type')?.includes('application/json')) {
        try {
          const body = await request.json()
          token = body.csrfToken
        } catch {
          // Ignore JSON parse errors
        }
      }

      if (!token) {
        return NextResponse.json(
          { error: 'CSRF token missing' },
          { status: 403 }
        )
      }

      // Validate token
      const isValid = await this.validateToken(token, session.user.id)
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid CSRF token' },
          { status: 403 }
        )
      }

      return null // Continue to next middleware/handler
    }
  }
}

// Default CSRF instance
export const csrf = new CSRFProtection()

/**
 * CSRF middleware decorator
 */
export function withCSRF<T extends any[], R>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async function (request: NextRequest, ...args: T): Promise<NextResponse> {
    const csrfResponse = await csrf.middleware()(request)
    if (csrfResponse) {
      return csrfResponse
    }
    
    return handler(request, ...args)
  }
}

/**
 * Generate CSRF token for client
 */
export async function generateCSRFToken(sessionId: string): Promise<string> {
  return csrf.generateToken(sessionId)
}

/**
 * CSRF token API endpoint
 */
export async function getCSRFToken(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const token = await generateCSRFToken(session.user.id)
    
    return NextResponse.json({
      success: true,
      data: { csrfToken: token }
    })

  } catch (error) {
    console.error('CSRF token generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    )
  }
}
