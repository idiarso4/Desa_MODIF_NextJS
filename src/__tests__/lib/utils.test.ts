import { describe, it, expect } from '@jest/globals'
import { cn, formatDate, formatCurrency, validateNIK, generatePassword } from '@/lib/utils'

describe('Utils Functions', () => {
  describe('cn (className utility)', () => {
    it('should merge class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
    })

    it('should handle conditional classes', () => {
      expect(cn('base', true && 'conditional', false && 'hidden')).toBe('base conditional')
    })

    it('should handle undefined and null values', () => {
      expect(cn('base', undefined, null, 'end')).toBe('base end')
    })
  })

  describe('formatDate', () => {
    it('should format date correctly in Indonesian locale', () => {
      const date = new Date('2024-01-15')
      const formatted = formatDate(date)
      expect(formatted).toMatch(/15 Januari 2024/)
    })

    it('should handle invalid dates', () => {
      const invalidDate = new Date('invalid')
      expect(() => formatDate(invalidDate)).toThrow()
    })

    it('should format with custom format', () => {
      const date = new Date('2024-01-15')
      const formatted = formatDate(date, 'dd/MM/yyyy')
      expect(formatted).toBe('15/01/2024')
    })
  })

  describe('formatCurrency', () => {
    it('should format currency in Indonesian Rupiah', () => {
      expect(formatCurrency(1000000)).toBe('Rp 1.000.000')
    })

    it('should handle zero values', () => {
      expect(formatCurrency(0)).toBe('Rp 0')
    })

    it('should handle negative values', () => {
      expect(formatCurrency(-500000)).toBe('-Rp 500.000')
    })

    it('should handle decimal values', () => {
      expect(formatCurrency(1500.50)).toBe('Rp 1.501')
    })
  })

  describe('validateNIK', () => {
    it('should validate correct NIK format', () => {
      expect(validateNIK('1234567890123456')).toBe(true)
    })

    it('should reject NIK with wrong length', () => {
      expect(validateNIK('123456789012345')).toBe(false) // 15 digits
      expect(validateNIK('12345678901234567')).toBe(false) // 17 digits
    })

    it('should reject NIK with non-numeric characters', () => {
      expect(validateNIK('123456789012345a')).toBe(false)
      expect(validateNIK('123456789012345-')).toBe(false)
    })

    it('should reject empty or null NIK', () => {
      expect(validateNIK('')).toBe(false)
      expect(validateNIK(null as any)).toBe(false)
      expect(validateNIK(undefined as any)).toBe(false)
    })
  })

  describe('generatePassword', () => {
    it('should generate password with default length', () => {
      const password = generatePassword()
      expect(password).toHaveLength(12)
    })

    it('should generate password with custom length', () => {
      const password = generatePassword(8)
      expect(password).toHaveLength(8)
    })

    it('should generate different passwords on multiple calls', () => {
      const password1 = generatePassword()
      const password2 = generatePassword()
      expect(password1).not.toBe(password2)
    })

    it('should contain only valid characters', () => {
      const password = generatePassword()
      const validChars = /^[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/
      expect(password).toMatch(validChars)
    })
  })
})