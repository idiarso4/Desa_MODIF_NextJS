// CSRF protection implementation
import { NextRequest, NextResponse } from 'next/server'
import { randomBytes, createHmac } from 'crypto'
import { cacheManager } from '@/lib/cache/redis'

// CSRF configuration
const CSRF_CONFIG = {
  tokenLength: 32,
  secretLength: 64,
  cookieName: 'csrf-token',
  headerName: 'x-csrf-token',
  formFieldName: '_csrf',
  tokenTTL: 60 * 60, // 1 hour in seconds
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/'
  }
} as const

// CSRF token manager
export class CSRFTokenManager {
  private secret: string

  constructor() {
    // In production, this should be loaded from environment or secure storage
    this.secret = process.env.CSRF_SECRET || this.generateSecret()
  }

  private generateSecret(): string {
    return randomBytes(CSRF_CONFIG.secretLength).toString('hex')
  }

  // Generate a new CSRF token
  async generateToken(sessionId?: string): Promise<{
    token: string
    hashedToken: string
  }> {
    const token = randomBytes(CSRF_CONFIG.tokenLength).toString('hex')
    const timestamp = Date.now().toString()
    const payload = `${token}:${timestamp}${sessionId ? `:${sessionId}` : ''}`
    
    // Create HMAC hash
    const hashedToken = createHmac('sha256', this.secret)
      .update(payload)
      .digest('hex')

    // Store token in cache for validation
    const cacheKey = `csrf:${hashedToken}`
    await cacheManager.set(cacheKey, {
      token,
      timestamp: parseInt(timestamp),
      sessionId
    }, CSRF_CONFIG.tokenTTL)

    return { token, hashedToken }
  }

  // Validate CSRF token
  async validateToken(
    token: string,
    hashedToken: string,
    sessionId?: string
  ): Promise<{
    valid: boolean
    reason?: string
  }> {
    if (!token || !hashedToken) {
      return { valid: false, reason: 'Missing CSRF token' }
    }

    try {
      // Get token data from cache
      const cacheKey = `csrf:${hashedToken}`
      const tokenData = await cacheManager.get<{
        token: string
        timestamp: number
        sessionId?: string
      }>(cacheKey)

      if (!tokenData) {
        return { valid: false, reason: 'Invalid or expired CSRF token' }
      }

      // Verify token matches
      if (tokenData.token !== token) {
        return { valid: false, reason: 'CSRF token mismatch' }
      }

      // Verify session if provided
      if (sessionId && tokenData.sessionId !== sessionId) {
        return { valid: false, reason: 'CSRF token session mismatch' }
      }

      // Check token age (additional validation)
      const tokenAge = Date.now() - tokenData.timestamp
      if (tokenAge > CSRF_CONFIG.tokenTTL * 1000) {
        return { valid: false, reason: 'CSRF token expired' }
      }

      // Token is valid - remove it to prevent reuse
      await cacheManager.del(cacheKey)

      return { valid: true }
    } catch (error) {
      console.error('CSRF token validation error:', error)
      return { valid: false, reason: 'CSRF validation error' }
    }
  }

  // Invalidate all tokens for a session
  async invalidateSessionTokens(sessionId: string): Promise<void> {
    // This would require scanning all CSRF tokens, which is expensive
    // In practice, tokens expire naturally or we could maintain a session->token mapping
    const pattern = `csrf:*`
    const keys = await cacheManager['redis'].keys(pattern)
    
    for (const key of keys) {
      const tokenData = await cacheManager.get<{
        sessionId?: string
      }>(key)
      
      if (tokenData?.sessionId === sessionId) {
        await cacheManager.del(key)
      }
    }
  }

  // Clean up expired tokens
  async cleanupExpiredTokens(): Promise<number> {
    // Redis TTL handles this automatically, but we can implement manual cleanup if needed
    const pattern = `csrf:*`
    const keys = await cacheManager['redis'].keys(pattern)
    let cleanedCount = 0
    
    for (const key of keys) {
      const ttl = await cacheManager.ttl(key)
      if (ttl <= 0) {
        await cacheManager.del(key)
        cleanedCount++
      }
    }
    
    return cleanedCount
  }
}

// CSRF middleware
export class CSRFMiddleware {
  private tokenManager: CSRFTokenManager

  constructor() {
    this.tokenManager = new CSRFTokenManager()
  }

  // Generate CSRF token for forms
  async generateTokenForResponse(
    response: NextResponse,
    sessionId?: string
  ): Promise<string> {
    const { token, hashedToken } = await this.tokenManager.generateToken(sessionId)
    
    // Set token in cookie
    response.cookies.set(CSRF_CONFIG.cookieName, hashedToken, CSRF_CONFIG.cookieOptions)
    
    // Return token for use in forms/headers
    return token
  }

  // Validate CSRF token from request
  async validateRequest(
    request: NextRequest,
    sessionId?: string
  ): Promise<{
    valid: boolean
    reason?: string
  }> {
    // Skip validation for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return { valid: true }
    }

    // Get hashed token from cookie
    const hashedToken = request.cookies.get(CSRF_CONFIG.cookieName)?.value
    if (!hashedToken) {
      return { valid: false, reason: 'Missing CSRF cookie' }
    }

    // Get token from header or form data
    let token = request.headers.get(CSRF_CONFIG.headerName)
    
    if (!token && request.method === 'POST') {
      // Try to get from form data
      try {
        const formData = await request.clone().formData()
        token = formData.get(CSRF_CONFIG.formFieldName) as string
      } catch {
        // Not form data, continue without token
      }
    }

    if (!token) {
      return { valid: false, reason: 'Missing CSRF token in request' }
    }

    return this.tokenManager.validateToken(token, hashedToken, sessionId)
  }

  // Create CSRF protection middleware
  createMiddleware() {
    return async (request: NextRequest) => {
      const sessionId = request.cookies.get('session-id')?.value
      
      const validation = await this.validateRequest(request, sessionId)
      
      if (!validation.valid) {
        return NextResponse.json(
          { 
            error: 'CSRF validation failed',
            reason: validation.reason 
          },
          { 
            status: 403,
            headers: {
              'X-CSRF-Protection': 'failed'
            }
          }
        )
      }

      return null // Continue to next middleware
    }
  }
}

// CSRF utilities for forms and AJAX
export class CSRFUtils {
  private static tokenManager = new CSRFTokenManager()

  // Get CSRF token for client-side use
  static async getTokenForClient(sessionId?: string): Promise<string> {
    const { token } = await this.tokenManager.generateToken(sessionId)
    return token
  }

  // Generate hidden form field HTML
  static async generateFormField(sessionId?: string): Promise<string> {
    const token = await this.getTokenForClient(sessionId)
    return `<input type="hidden" name="${CSRF_CONFIG.formFieldName}" value="${token}" />`
  }

  // Generate meta tag for AJAX requests
  static async generateMetaTag(sessionId?: string): Promise<string> {
    const token = await this.getTokenForClient(sessionId)
    return `<meta name="csrf-token" content="${token}" />`
  }

  // Client-side JavaScript helper
  static getClientScript(): string {
    return `
      // CSRF protection helper
      window.CSRF = {
        token: document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
        
        // Add CSRF token to fetch requests
        fetch: function(url, options = {}) {
          options.headers = options.headers || {};
          if (this.token) {
            options.headers['${CSRF_CONFIG.headerName}'] = this.token;
          }
          return fetch(url, options);
        },
        
        // Add CSRF token to form
        addToForm: function(form) {
          if (this.token && form) {
            let input = form.querySelector('input[name="${CSRF_CONFIG.formFieldName}"]');
            if (!input) {
              input = document.createElement('input');
              input.type = 'hidden';
              input.name = '${CSRF_CONFIG.formFieldName}';
              form.appendChild(input);
            }
            input.value = this.token;
          }
        }
      };
      
      // Auto-add CSRF token to all forms
      document.addEventListener('DOMContentLoaded', function() {
        document.querySelectorAll('form').forEach(function(form) {
          window.CSRF.addToForm(form);
        });
      });
    `
  }
}

// Double Submit Cookie pattern implementation
export class DoubleSubmitCSRF {
  // Generate token pair for double submit pattern
  static generateTokenPair(): {
    cookieToken: string
    formToken: string
  } {
    const token = randomBytes(CSRF_CONFIG.tokenLength).toString('hex')
    return {
      cookieToken: token,
      formToken: token
    }
  }

  // Validate double submit tokens
  static validateDoubleSubmit(
    cookieToken: string,
    formToken: string
  ): boolean {
    if (!cookieToken || !formToken) {
      return false
    }

    // Use constant-time comparison to prevent timing attacks
    return this.constantTimeEquals(cookieToken, formToken)
  }

  // Constant-time string comparison
  private static constantTimeEquals(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false
    }

    let result = 0
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i)
    }

    return result === 0
  }
}

// Export singleton instances
export const csrfTokenManager = new CSRFTokenManager()
export const csrfMiddleware = new CSRFMiddleware()

// Export configuration for external use
export { CSRF_CONFIG }