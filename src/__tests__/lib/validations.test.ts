import { describe, it, expect } from '@jest/globals'
import { 
  citizenSchema, 
  userSchema, 
  letterRequestSchema,
  budgetSchema,
  complaintSchema 
} from '@/lib/validations'

describe('Validation Schemas', () => {
  describe('citizenSchema', () => {
    const validCitizenData = {
      nik: '1234567890123456',
      name: 'John Doe',
      birthDate: '1990-01-01',
      birthPlace: 'Jakarta',
      gender: 'L' as const,
      religion: 'ISLAM' as const,
      education: 'S1' as const,
      occupation: 'Software Engineer',
      maritalStatus: 'KAWIN' as const,
      bloodType: 'A' as const,
      rt: '001',
      rw: '002',
      address: 'Jl. Merdeka No. 1'
    }

    it('should validate correct citizen data', () => {
      const result = citizenSchema.safeParse(validCitizenData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid NIK', () => {
      const invalidData = { ...validCitizenData, nik: '123' }
      const result = citizenSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('nik')
      }
    })

    it('should reject empty name', () => {
      const invalidData = { ...validCitizenData, name: '' }
      const result = citizenSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid gender', () => {
      const invalidData = { ...validCitizenData, gender: 'X' as any }
      const result = citizenSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should accept optional fields as undefined', () => {
      const { occupation, bloodType, ...requiredData } = validCitizenData
      const result = citizenSchema.safeParse(requiredData)
      expect(result.success).toBe(true)
    })
  })

  describe('userSchema', () => {
    const validUserData = {
      username: 'johndoe',
      email: 'john@example.com',
      name: 'John Doe',
      password: 'SecurePass123!',
      roleId: 'role-id-123'
    }

    it('should validate correct user data', () => {
      const result = userSchema.safeParse(validUserData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const invalidData = { ...validUserData, email: 'invalid-email' }
      const result = userSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject weak password', () => {
      const invalidData = { ...validUserData, password: '123' }
      const result = userSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject username with special characters', () => {
      const invalidData = { ...validUserData, username: 'john@doe' }
      const result = userSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('letterRequestSchema', () => {
    const validLetterData = {
      citizenId: 'citizen-id-123',
      letterType: 'DOMICILE' as const,
      purpose: 'Untuk keperluan administrasi',
      notes: 'Catatan tambahan'
    }

    it('should validate correct letter request data', () => {
      const result = letterRequestSchema.safeParse(validLetterData)
      expect(result.success).toBe(true)
    })

    it('should reject empty purpose', () => {
      const invalidData = { ...validLetterData, purpose: '' }
      const result = letterRequestSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid letter type', () => {
      const invalidData = { ...validLetterData, letterType: 'INVALID' as any }
      const result = letterRequestSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should accept optional notes', () => {
      const { notes, ...requiredData } = validLetterData
      const result = letterRequestSchema.safeParse(requiredData)
      expect(result.success).toBe(true)
    })
  })

  describe('budgetSchema', () => {
    const validBudgetData = {
      category: 'PENDAPATAN',
      subCategory: 'Dana Desa',
      amount: 1000000,
      description: 'Anggaran dana desa tahun 2024',
      year: 2024
    }

    it('should validate correct budget data', () => {
      const result = budgetSchema.safeParse(validBudgetData)
      expect(result.success).toBe(true)
    })

    it('should reject negative amount', () => {
      const invalidData = { ...validBudgetData, amount: -1000 }
      const result = budgetSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid year', () => {
      const invalidData = { ...validBudgetData, year: 1999 }
      const result = budgetSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject empty description', () => {
      const invalidData = { ...validBudgetData, description: '' }
      const result = budgetSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('complaintSchema', () => {
    const validComplaintData = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '081234567890',
      category: 'INFRASTRUKTUR' as const,
      subject: 'Jalan rusak',
      description: 'Jalan di RT 01 RW 02 rusak parah dan perlu diperbaiki',
      location: 'RT 01 RW 02'
    }

    it('should validate correct complaint data', () => {
      const result = complaintSchema.safeParse(validComplaintData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const invalidData = { ...validComplaintData, email: 'invalid-email' }
      const result = complaintSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid phone number', () => {
      const invalidData = { ...validComplaintData, phone: '123' }
      const result = complaintSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject short description', () => {
      const invalidData = { ...validComplaintData, description: 'Short' }
      const result = complaintSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should accept optional location', () => {
      const { location, ...requiredData } = validComplaintData
      const result = complaintSchema.safeParse(requiredData)
      expect(result.success).toBe(true)
    })
  })
})