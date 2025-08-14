// XSS protection utilities
import DOMPurify from 'isomorphic-dompurify'
import { z } from 'zod'

// HTML sanitization options
export interface SanitizeOptions {
  allowedTags?: string[]
  allowedAttributes?: Record<string, string[]>
  stripTags?: boolean
  allowDataAttributes?: boolean
}

// Default safe HTML tags and attributes
const DEFAULT_ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'code', 'pre'
]

const DEFAULT_ALLOWED_ATTRIBUTES = {
  '*': ['class', 'id'],
  'a': ['href', 'title', 'target'],
  'img': ['src', 'alt', 'width', 'height'],
  'code': ['class'],
  'pre': ['class']
}

// Sanitize HTML content
export function sanitizeHtml(
  html: string,
  options: SanitizeOptions = {}
): string {
  try {
    const {
      allowedTags = DEFAULT_ALLOWED_TAGS,
      allowedAttributes = DEFAULT_ALLOWED_ATTRIBUTES,
      stripTags = false,
      allowDataAttributes = false
    } = options

    if (stripTags) {
      // Strip all HTML tags
      return html.replace(/<[^>]*>/g, '')
    }

    // Configure DOMPurify
    const config: any = {
      ALLOWED_TAGS: allowedTags,
      ALLOWED_ATTR: Object.values(allowedAttributes).flat(),
      KEEP_CONTENT: true,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false,
      RETURN_DOM_IMPORT: false
    }

    if (allowDataAttributes) {
      config.ALLOW_DATA_ATTR = true
    }

    // Sanitize HTML
    const clean = DOMPurify.sanitize(html, config)
    
    return clean
  } catch (error) {
    console.error('HTML sanitization error:', error)
    // Fallback: strip all HTML tags
    return html.replace(/<[^>]*>/g, '')
  }
}

// Escape HTML entities
export function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  }

  return text.replace(/[&<>"'/]/g, (match) => htmlEscapes[match])
}

// Unescape HTML entities
export function unescapeHtml(html: string): string {
  const htmlUnescapes: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#x27;': "'",
    '&#x2F;': '/'
  }

  return html.replace(/&(?:amp|lt|gt|quot|#x27|#x2F);/g, (match) => htmlUnescapes[match])
}

// Sanitize user input for database storage
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return String(input)
  }

  return input
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, 10000) // Limit length
}

// Validate and sanitize URL
export function sanitizeUrl(url: string): string | null {
  try {
    // Remove dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:']
    const lowerUrl = url.toLowerCase().trim()
    
    for (const protocol of dangerousProtocols) {
      if (lowerUrl.startsWith(protocol)) {
        return null
      }
    }

    // Validate URL format
    const urlObj = new URL(url, 'https://example.com')
    
    // Only allow http and https
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return null
    }

    return urlObj.toString()
  } catch (error) {
    return null
  }
}

// SQL injection protection (basic)
export function detectSqlInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
    /(--|\/\*|\*\/)/,
    /(\b(SCRIPT|JAVASCRIPT|VBSCRIPT)\b)/i,
    /(<\s*script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>)/gi
  ]

  return sqlPatterns.some(pattern => pattern.test(input))
}

// XSS detection patterns
export function detectXss(input: string): boolean {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<img[^>]+src[^>]*>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
    /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi
  ]

  return xssPatterns.some(pattern => pattern.test(input))
}

// Content validation schemas
export const safeStringSchema = z.string()
  .min(1)
  .max(1000)
  .refine(
    (value) => !detectXss(value),
    { message: 'Input contains potentially dangerous content' }
  )
  .refine(
    (value) => !detectSqlInjection(value),
    { message: 'Input contains potentially dangerous SQL patterns' }
  )
  .transform(sanitizeInput)

export const safeHtmlSchema = z.string()
  .min(1)
  .max(10000)
  .transform((value) => sanitizeHtml(value))

export const safeUrlSchema = z.string()
  .url()
  .transform((value) => sanitizeUrl(value))
  .refine(
    (value) => value !== null,
    { message: 'Invalid or dangerous URL' }
  )

// Rich text content validation
export const richTextSchema = z.string()
  .min(1)
  .max(50000)
  .transform((value) => sanitizeHtml(value, {
    allowedTags: [
      'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'code', 'pre', 'a', 'img'
    ],
    allowedAttributes: {
      '*': ['class'],
      'a': ['href', 'title', 'target'],
      'img': ['src', 'alt', 'width', 'height'],
      'code': ['class'],
      'pre': ['class']
    }
  }))

// File upload validation
export interface FileValidationOptions {
  allowedTypes: string[]
  maxSize: number
  allowedExtensions: string[]
}

export function validateFile(
  file: File,
  options: FileValidationOptions
): { valid: boolean; error?: string } {
  // Check file type
  if (!options.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`
    }
  }

  // Check file size
  if (file.size > options.maxSize) {
    return {
      valid: false,
      error: `File size ${file.size} exceeds maximum ${options.maxSize}`
    }
  }

  // Check file extension
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!extension || !options.allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `File extension ${extension} is not allowed`
    }
  }

  // Check for dangerous file names
  const dangerousPatterns = [
    /\.(exe|bat|cmd|com|pif|scr|vbs|js|jar|php|asp|aspx|jsp)$/i,
    /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i
  ]

  if (dangerousPatterns.some(pattern => pattern.test(file.name))) {
    return {
      valid: false,
      error: 'Dangerous file name detected'
    }
  }

  return { valid: true }
}

// Security middleware for API routes
export function validateRequestData(data: any): any {
  if (typeof data === 'string') {
    return sanitizeInput(data)
  }

  if (Array.isArray(data)) {
    return data.map(validateRequestData)
  }

  if (data && typeof data === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(data)) {
      sanitized[sanitizeInput(key)] = validateRequestData(value)
    }
    return sanitized
  }

  return data
}

// Rate limiting for XSS attempts
const xssAttempts = new Map<string, { count: number; lastAttempt: Date }>()

export function trackXssAttempt(ip: string): boolean {
  const now = new Date()
  const attempt = xssAttempts.get(ip)

  if (!attempt) {
    xssAttempts.set(ip, { count: 1, lastAttempt: now })
    return false
  }

  // Reset count if last attempt was more than 1 hour ago
  if (now.getTime() - attempt.lastAttempt.getTime() > 60 * 60 * 1000) {
    xssAttempts.set(ip, { count: 1, lastAttempt: now })
    return false
  }

  attempt.count++
  attempt.lastAttempt = now

  // Block if more than 5 attempts in 1 hour
  return attempt.count > 5
}

// Clean up old XSS attempt records
setInterval(() => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  for (const [ip, attempt] of xssAttempts.entries()) {
    if (attempt.lastAttempt < oneHourAgo) {
      xssAttempts.delete(ip)
    }
  }
}, 60 * 60 * 1000) // Clean up every hour