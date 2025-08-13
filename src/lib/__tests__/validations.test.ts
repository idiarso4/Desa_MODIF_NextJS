import { 
  citizenSchema, 
  familySchema, 
  letterRequestSchema, 
  budgetSchema,
  expenseSchema,
  aidProgramSchema 
} from '../validations'

describe('Validation Schemas', () => {
  describe('citizenSchema', () => {
    it('should validate valid citizen data', () => {
      const validData = {
        name: 'John Doe',
        nik: '1234567890123456',
        birthDate: '1990-01-01',
        birthPlace: 'Jakarta',
        gender: 'L',
        religion: 'ISLAM',
        maritalStatus: 'BELUM_KAWIN',
        education: 'SMA',
        occupation: 'Employee',
        isHeadOfFamily: false
      }

      const result = citizenSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid NIK', () => {
      const invalidData = {
        name: 'John Doe',
        nik: '123', // Too short
        birthDate: '1990-01-01',
        birthPlace: 'Jakarta',
        gender: 'L'
      }

      const result = citizenSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('nik')
      }
    })

    it('should reject invalid birth date', () => {
      const invalidData = {
        name: 'John Doe',
        nik: '1234567890123456',
        birthDate: 'invalid-date',
        birthPlace: 'Jakarta',
        gender: 'L'
      }

      const result = citizenSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('familySchema', () => {
    it('should validate valid family data', () => {
      const validData = {
        familyNumber: '1234567890123456',
        socialStatus: 'MAMPU'
      }

      const result = familySchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('letterRequestSchema', () => {
    it('should validate valid letter request', () => {
      const validData = {
        citizenId: 'citizen123',
        letterType: 'SURAT_KETERANGAN_DOMISILI',
        purpose: 'Administrative requirement for document processing',
        notes: 'Additional details'
      }

      const result = letterRequestSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('budgetSchema', () => {
    it('should validate valid budget data', () => {
      const validData = {
        year: 2024,
        category: 'Infrastructure',
        subcategory: 'Roads',
        description: 'Road maintenance budget',
        amount: 50000000
      }

      const result = budgetSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject negative amount', () => {
      const invalidData = {
        year: 2024,
        category: 'Infrastructure',
        description: 'Road maintenance budget',
        amount: -1000
      }

      const result = budgetSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('expenseSchema', () => {
    it('should validate valid expense data', () => {
      const validData = {
        budgetId: 'clx123456789012345678901234',
        description: 'Road repair materials',
        amount: 5000000,
        date: '2024-01-15',
        receipt: 'https://example.com/receipt.pdf'
      }

      const result = expenseSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('aidProgramSchema', () => {
    it('should validate valid aid program data', () => {
      const validData = {
        name: 'Social Assistance Program',
        description: 'Financial aid for low-income families',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        budget: 100000000,
        criteria: 'Monthly income below 2 million IDR'
      }

      const result = aidProgramSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })
}) 