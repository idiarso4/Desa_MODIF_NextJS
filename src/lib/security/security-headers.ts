// Security headers and Content Security Policy configuration
import { NextResponse } from 'next/server'

export interface SecurityConfig {
  csp: {
    enabled: boolean
    reportOnly: boolean
    directives: Record<string, string[]>
  }
  headers: Record<string, string>
}

export const securityConfig: SecurityConfig = {
  csp: {
    enabled: true,
    reportOnly: false,
    directives: {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-inline'", // Required for Next.js
        "'unsafe-eval'", // Required for development
        'https://unpkg.com', // For Leaflet maps
        'https://cdn.jsdelivr.net' // For external libraries
      ],
      'style-src': [
        "'self'",
        "'unsafe-inline'", // Required for Tailwind CSS
        'https://unpkg.com', // For Leaflet CSS
        'https://fonts.googleapis.com'
      ],
      'img-src': [
        "'self'",
        'data:', // For base64 images
        'blob:', // For generated images
        'https:', // For external images
        'https://*.tile.openstreetmap.org', // For map tiles
        'https://*.openstreetmap.org'
      ],
      'font-src': [
        "'self'",
        'https://fonts.gstatic.com'
      ],
      'connect-src': [
        "'self'",
        'https://api.openstreetmap.org', // For geocoding
        'https://nominatim.openstreetmap.org'
      ],
      'frame-src': ["'none'"],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"],
      'upgrade-insecure-requests': []
    }
  },
  headers: {
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // Enable XSS protection
    'X-XSS-Protection': '1; mode=block',
    
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',
    
    // Strict transport security (HTTPS only)
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    
    // Referrer policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Permissions policy
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=(self)',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'accelerometer=()',
      'gyroscope=()'
    ].join(', '),
    
    // Cross-origin policies
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin'
  }
}

// Generate CSP header value
export function generateCSPHeader(config: SecurityConfig['csp']): string {
  const directives = Object.entries(config.directives)
    .map(([directive, sources]) => {
      if (sources.length === 0) {
        return directive
      }
      return `${directive} ${sources.join(' ')}`
    })
    .join('; ')

  return directives
}

// Apply security headers to response
export function applySecurityHeaders(response: NextResponse): NextResponse {
  // Apply CSP
  if (securityConfig.csp.enabled) {
    const cspHeader = generateCSPHeader(securityConfig.csp)
    const headerName = securityConfig.csp.reportOnly 
      ? 'Content-Security-Policy-Report-Only'
      : 'Content-Security-Policy'
    
    response.headers.set(headerName, cspHeader)
  }

  // Apply other security headers
  Object.entries(securityConfig.headers).forEach(([name, value]) => {
    response.headers.set(name, value)
  })

  return response
}

// Middleware helper for security headers
export function withSecurityHeaders(response: NextResponse): NextResponse {
  return applySecurityHeaders(response)
}

// CSP violation reporting endpoint data
export interface CSPViolationReport {
  'csp-report': {
    'document-uri': string
    'referrer': string
    'violated-directive': string
    'effective-directive': string
    'original-policy': string
    'disposition': string
    'blocked-uri': string
    'line-number': number
    'column-number': number
    'source-file': string
    'status-code': number
    'script-sample': string
  }
}

// Validate CSP report
export function validateCSPReport(data: any): CSPViolationReport | null {
  try {
    if (!data || !data['csp-report']) {
      return null
    }

    const report = data['csp-report']
    
    // Basic validation
    if (typeof report['document-uri'] !== 'string' ||
        typeof report['violated-directive'] !== 'string') {
      return null
    }

    return data as CSPViolationReport
  } catch (error) {
    console.error('CSP report validation error:', error)
    return null
  }
}

// Security headers for different environments
export const getSecurityConfigForEnvironment = (env: string): SecurityConfig => {
  const baseConfig = { ...securityConfig }

  if (env === 'development') {
    // Relax CSP for development
    baseConfig.csp.directives['script-src'].push("'unsafe-eval'")
    baseConfig.csp.reportOnly = true
    
    // Remove HSTS in development
    delete baseConfig.headers['Strict-Transport-Security']
  }

  if (env === 'production') {
    // Stricter CSP for production
    baseConfig.csp.directives['script-src'] = baseConfig.csp.directives['script-src']
      .filter(src => src !== "'unsafe-eval'")
    
    // Add report URI for CSP violations
    baseConfig.csp.directives['report-uri'] = ['/api/security/csp-report']
  }

  return baseConfig
}

// Security audit helpers
export interface SecurityAuditResult {
  score: number
  issues: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical'
    category: string
    description: string
    recommendation: string
  }>
  recommendations: string[]
}

export function auditSecurityHeaders(headers: Record<string, string>): SecurityAuditResult {
  const issues: SecurityAuditResult['issues'] = []
  const recommendations: string[] = []
  let score = 100

  // Check for required security headers
  const requiredHeaders = [
    'X-Content-Type-Options',
    'X-XSS-Protection',
    'X-Frame-Options',
    'Content-Security-Policy',
    'Strict-Transport-Security'
  ]

  requiredHeaders.forEach(header => {
    if (!headers[header]) {
      issues.push({
        severity: 'high',
        category: 'Missing Security Header',
        description: `Missing ${header} header`,
        recommendation: `Add ${header} header for better security`
      })
      score -= 15
    }
  })

  // Check CSP strength
  const csp = headers['Content-Security-Policy']
  if (csp) {
    if (csp.includes("'unsafe-inline'")) {
      issues.push({
        severity: 'medium',
        category: 'CSP',
        description: "CSP allows 'unsafe-inline'",
        recommendation: "Remove 'unsafe-inline' and use nonces or hashes"
      })
      score -= 10
    }

    if (csp.includes("'unsafe-eval'")) {
      issues.push({
        severity: 'high',
        category: 'CSP',
        description: "CSP allows 'unsafe-eval'",
        recommendation: "Remove 'unsafe-eval' to prevent code injection"
      })
      score -= 15
    }
  }

  // Generate recommendations
  if (score < 90) {
    recommendations.push('Review and strengthen Content Security Policy')
  }
  if (score < 80) {
    recommendations.push('Implement all recommended security headers')
  }
  if (score < 70) {
    recommendations.push('Consider security audit by external experts')
  }

  return {
    score: Math.max(0, score),
    issues,
    recommendations
  }
}