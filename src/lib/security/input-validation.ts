// Comprehensive input validation and sanitization
import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'
import validator from 'validator'

// Common validation patterns
export const ValidationPatterns = {
  // Indonesian specific patterns
  NIK: /^\d{16}$/,
  PHONE: /^(\+62|62|0)[0-9]{8,13}$/,
  POSTAL_CODE: /^\d{5}$/,
  
  // General patterns
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // File patterns
  IMAGE_EXTENSIONS: /\.(jpg|jpeg|png|gif|webp)$/i,
  DOCUMENT_EXTENSIONS: /\.(pdf|doc|docx|xls|xlsx)$/i,
  
  // SQL injection patterns (for detection)
  SQL_INJECTION: /(union|select|insert|update|delete|drop|create|alter|exec|execute|script|javascript|vbscript|onload|onerror|onclick)/i,
  
  // XSS patterns (for detection)
  XSS_PATTERNS: [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi
  ]
} as const

// Base validation schemas
export const BaseSchemas = {
  // User input schemas
  username: z.string()
    .min(3, 'Username minimal 3 karakter')
    .max(20, 'Username maksimal 20 karakter')
    .regex(ValidationPatterns.USERNAME, 'Username hanya boleh mengandung huruf, angka, dan underscore'),
  
  password: z.string()
    .min(8, 'Password minimal 8 karakter')
    .regex(ValidationPatterns.PASSWORD, 'Password harus mengandung huruf besar, huruf kecil, angka, dan simbol'),
  
  email: z.string()
    .email('Format email tidak valid')
    .max(100, 'Email maksimal 100 karakter'),
  
  // Indonesian specific schemas
  nik: z.string()
    .length(16, 'NIK harus 16 digit')
    .regex(ValidationPatterns.NIK, 'NIK harus berupa 16 digit angka'),
  
  phone: z.string()
    .regex(ValidationPatterns.PHONE, 'Format nomor telepon tidak valid'),
  
  postalCode: z.string()
    .length(5, 'Kode pos harus 5 digit')
    .regex(ValidationPatterns.POSTAL_CODE, 'Kode pos harus berupa 5 digit angka'),
  
  // Text schemas
  name: z.string()
    .min(1, 'Nama harus diisi')
    .max(100, 'Nama maksimal 100 karakter')
    .regex(/^[a-zA-Z\s.',-]+$/, 'Nama hanya boleh mengandung huruf, spasi, dan tanda baca umum'),
  
  address: z.string()
    .min(5, 'Alamat minimal 5 karakter')
    .max(255, 'Alamat maksimal 255 karakter'),
  
  // Numeric schemas
  positiveInt: z.number().int().positive('Harus berupa bilangan bulat positif'),
  currency: z.number().positive('Harus berupa nilai positif').multipleOf(0.01),
  
  // Date schemas
  birthDate: z.date()
    .max(new Date(), 'Tanggal lahir tidak boleh di masa depan')
    .min(new Date('1900-01-01'), 'Tanggal lahir tidak valid'),
  
  // File schemas
  imageFile: z.object({
    name: z.string().regex(ValidationPatterns.IMAGE_EXTENSIONS, 'File harus berupa gambar'),
    size: z.number().max(5 * 1024 * 1024, 'Ukuran file maksimal 5MB'),
    type: z.string().startsWith('image/', 'File harus berupa gambar')
  }),
  
  documentFile: z.object({
    name: z.string().regex(ValidationPatterns.DOCUMENT_EXTENSIONS, 'File harus berupa dokumen'),
    size: z.number().max(10 * 1024 * 1024, 'Ukuran file maksimal 10MB'),
    type: z.string()
  })
} as const

// Input sanitization utilities
export class InputSanitizer {
  // Sanitize HTML content
  static sanitizeHtml(input: string, allowedTags?: string[]): string {
    if (!input) return ''
    
    const config = allowedTags ? {
      ALLOWED_TAGS: allowedTags,
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class']
    } : {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    }
    
    return DOMPurify.sanitize(input, config)
  }
  
  // Sanitize plain text (remove HTML tags)
  static sanitizeText(input: string): string {
    if (!input) return ''
    return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
  }
  
  // Sanitize SQL input (escape special characters)
  static sanitizeSql(input: string): string {
    if (!input) return ''
    return input.replace(/['";\\]/g, '\\$&')
  }
  
  // Sanitize filename
  static sanitizeFilename(filename: string): string {
    if (!filename) return ''
    
    // Remove path traversal attempts
    let sanitized = filename.replace(/\.\./g, '')
    
    // Remove special characters except dots, hyphens, underscores
    sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_')
    
    // Limit length
    if (sanitized.length > 100) {
      const ext = sanitized.split('.').pop()
      sanitized = sanitized.substring(0, 95) + '.' + ext
    }
    
    return sanitized
  }
  
  // Sanitize URL
  static sanitizeUrl(url: string): string {
    if (!url) return ''
    
    try {
      const parsed = new URL(url)
      
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return ''
      }
      
      return parsed.toString()
    } catch {
      return ''
    }
  }
  
  // Remove null bytes and control characters
  static removeControlChars(input: string): string {
    if (!input) return ''
    return input.replace(/[\x00-\x1F\x7F]/g, '')
  }
  
  // Normalize whitespace
  static normalizeWhitespace(input: string): string {
    if (!input) return ''
    return input.replace(/\s+/g, ' ').trim()
  }
}

// Security validation utilities
export class SecurityValidator {
  // Check for SQL injection patterns
  static containsSqlInjection(input: string): boolean {
    if (!input) return false
    return ValidationPatterns.SQL_INJECTION.test(input)
  }
  
  // Check for XSS patterns
  static containsXss(input: string): boolean {
    if (!input) return false
    return ValidationPatterns.XSS_PATTERNS.some(pattern => pattern.test(input))
  }
  
  // Check for path traversal
  static containsPathTraversal(input: string): boolean {
    if (!input) return false
    return input.includes('../') || input.includes('..\\')
  }
  
  // Validate password strength
  static validatePasswordStrength(password: string): {
    isValid: boolean
    score: number
    feedback: string[]
  } {
    const feedback: string[] = []
    let score = 0
    
    if (password.length >= 8) score += 1
    else feedback.push('Password minimal 8 karakter')
    
    if (/[a-z]/.test(password)) score += 1
    else feedback.push('Harus mengandung huruf kecil')
    
    if (/[A-Z]/.test(password)) score += 1
    else feedback.push('Harus mengandung huruf besar')
    
    if (/\d/.test(password)) score += 1
    else feedback.push('Harus mengandung angka')
    
    if (/[@$!%*?&]/.test(password)) score += 1
    else feedback.push('Harus mengandung simbol')
    
    // Check for common patterns
    if (/(.)\1{2,}/.test(password)) {
      score -= 1
      feedback.push('Hindari karakter berulang')
    }
    
    if (/123|abc|qwe/i.test(password)) {
      score -= 1
      feedback.push('Hindari pola yang mudah ditebak')
    }
    
    return {
      isValid: score >= 4,
      score: Math.max(0, score),
      feedback
    }
  }
  
  // Validate file upload
  static validateFileUpload(file: File, options: {
    maxSize?: number
    allowedTypes?: string[]
    allowedExtensions?: string[]
  } = {}): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []
    const {
      maxSize = 10 * 1024 * 1024, // 10MB default
      allowedTypes = [],
      allowedExtensions = []
    } = options
    
    // Check file size
    if (file.size > maxSize) {
      errors.push(`Ukuran file maksimal ${Math.round(maxSize / 1024 / 1024)}MB`)
    }
    
    // Check file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      errors.push('Tipe file tidak diizinkan')
    }
    
    // Check file extension
    if (allowedExtensions.length > 0) {
      const extension = file.name.split('.').pop()?.toLowerCase()
      if (!extension || !allowedExtensions.includes(extension)) {
        errors.push('Ekstensi file tidak diizinkan')
      }
    }
    
    // Check for suspicious filenames
    if (this.containsPathTraversal(file.name)) {
      errors.push('Nama file tidak valid')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
  
  // Validate Indonesian NIK
  static validateNik(nik: string): {
    isValid: boolean
    errors: string[]
    info?: {
      province: string
      district: string
      birthDate: Date
      gender: 'L' | 'P'
    }
  } {
    const errors: string[] = []
    
    if (!nik || nik.length !== 16) {
      errors.push('NIK harus 16 digit')
      return { isValid: false, errors }
    }
    
    if (!/^\d{16}$/.test(nik)) {
      errors.push('NIK harus berupa angka')
      return { isValid: false, errors }
    }
    
    try {
      // Extract information from NIK
      const provinceCode = nik.substring(0, 2)
      const districtCode = nik.substring(2, 4)
      const subdistrictCode = nik.substring(4, 6)
      const birthDateCode = nik.substring(6, 12)
      
      // Parse birth date and gender
      let day = parseInt(birthDateCode.substring(0, 2))
      const month = parseInt(birthDateCode.substring(2, 4))
      const year = parseInt('20' + birthDateCode.substring(4, 6)) // Assuming 20xx
      
      // If day > 40, it's female
      const gender: 'L' | 'P' = day > 40 ? 'P' : 'L'
      if (day > 40) day -= 40
      
      // Validate date
      const birthDate = new Date(year, month - 1, day)
      if (birthDate.getDate() !== day || birthDate.getMonth() !== month - 1) {
        errors.push('Tanggal lahir dalam NIK tidak valid')
      }
      
      if (errors.length === 0) {
        return {
          isValid: true,
          errors: [],
          info: {
            province: provinceCode,
            district: districtCode,
            birthDate,
            gender
          }
        }
      }
    } catch (error) {
      errors.push('Format NIK tidak valid')
    }
    
    return { isValid: false, errors }
  }
}

// Comprehensive validation schemas for OpenSID entities
export const OpenSIDSchemas = {
  // Citizen validation
  citizen: z.object({
    nik: BaseSchemas.nik,
    name: BaseSchemas.name,
    birthDate: BaseSchemas.birthDate,
    birthPlace: z.string().min(1, 'Tempat lahir harus diisi').max(50),
    gender: z.enum(['L', 'P'], { required_error: 'Jenis kelamin harus dipilih' }),
    religion: z.enum(['ISLAM', 'KRISTEN', 'KATOLIK', 'HINDU', 'BUDDHA', 'KONGHUCU']),
    education: z.enum(['TIDAK_SEKOLAH', 'SD', 'SMP', 'SMA', 'D1', 'D2', 'D3', 'S1', 'S2', 'S3']),
    occupation: z.string().max(50).optional(),
    maritalStatus: z.enum(['BELUM_KAWIN', 'KAWIN', 'CERAI_HIDUP', 'CERAI_MATI']),
    bloodType: z.enum(['A', 'B', 'AB', 'O']).optional(),
    phone: BaseSchemas.phone.optional(),
    email: BaseSchemas.email.optional()
  }),
  
  // Family validation
  family: z.object({
    familyNumber: z.string().min(1, 'Nomor KK harus diisi').max(20),
    headOfFamilyId: z.string().uuid('ID kepala keluarga tidak valid'),
    address: BaseSchemas.address,
    rt: z.string().max(3),
    rw: z.string().max(3),
    postalCode: BaseSchemas.postalCode.optional()
  }),
  
  // Letter request validation
  letterRequest: z.object({
    citizenId: z.string().uuid('ID penduduk tidak valid'),
    letterType: z.string().min(1, 'Jenis surat harus dipilih'),
    purpose: z.string().min(5, 'Keperluan minimal 5 karakter').max(255),
    notes: z.string().max(500).optional()
  }),
  
  // User validation
  user: z.object({
    username: BaseSchemas.username,
    email: BaseSchemas.email,
    name: BaseSchemas.name,
    password: BaseSchemas.password,
    roleId: z.string().uuid('Role ID tidak valid')
  }),
  
  // Budget validation
  budget: z.object({
    category: z.string().min(1, 'Kategori harus diisi').max(100),
    subcategory: z.string().max(100).optional(),
    amount: BaseSchemas.currency,
    year: z.number().int().min(2020).max(2030),
    description: z.string().max(255).optional()
  }),
  
  // Expense validation
  expense: z.object({
    budgetId: z.string().uuid('Budget ID tidak valid'),
    amount: BaseSchemas.currency,
    date: z.date(),
    description: z.string().min(1, 'Deskripsi harus diisi').max(255),
    receipt: z.string().url().optional()
  })
} as const

// Export validation helper
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean
  data?: T
  errors?: string[]
} {
  try {
    const result = schema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => err.message)
      }
    }
    return {
      success: false,
      errors: ['Validation error']
    }
  }
}