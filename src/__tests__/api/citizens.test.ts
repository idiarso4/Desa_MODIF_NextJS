import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET as getCitizens, POST as createCitizen } from '@/app/api/citizens/route'
import { GET as getCitizen, PUT as updateCitizen, DELETE as deleteCitizen } from '@/app/api/citizens/[id]/route'
import { prisma } from '@/lib/db'

// Mock dependencies
jest.mock('@/lib/db')
jest.mock('next-auth')
jest.mock('@/lib/rbac/server-utils')

describe('/api/citizens', () => {
  const mockSession = {
    user: {
      id: 'user-1',
      role: 'Admin',
      permissions: [
        { resource: 'citizens', action: 'read' },
        { resource: 'citizens', action: 'create' },
        { resource: 'citizens', action: 'update' },
        { resource: 'citizens', action: 'delete' }
      ]
    }
  }

  const mockCitizen = {
    id: 'citizen-1',
    nik: '1234567890123456',
    name: 'John Doe',
    birthDate: new Date('1990-01-01'),
    birthPlace: 'Jakarta',
    gender: 'L',
    religion: 'ISLAM',
    education: 'S1',
    occupation: 'Software Engineer',
    maritalStatus: 'KAWIN',
    bloodType: 'A',
    rt: '001',
    rw: '002',
    address: 'Jl. Merdeka No. 1',
    familyId: 'family-1',
    family: {
      id: 'family-1',
      familyNumber: '1234567890123456'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    const { getServerSession } = require('next-auth')
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const { checkPermission } = require('@/lib/rbac/server-utils')
    ;(checkPermission as jest.Mock).mockResolvedValue(true)
  })

  describe('GET /api/citizens', () => {
    it('should return paginated citizens list', async () => {
      const mockCitizens = [mockCitizen]
      
      ;(prisma.citizen.count as jest.Mock).mockResolvedValue(1)
      ;(prisma.citizen.findMany as jest.Mock).mockResolvedValue(mockCitizens)

      const request = new NextRequest('http://localhost:3000/api/citizens?page=1&limit=10')
      const response = await getCitizens(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.citizens).toHaveLength(1)
      expect(data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        pages: 1
      })
    })

    it('should filter citizens by search term', async () => {
      ;(prisma.citizen.count as jest.Mock).mockResolvedValue(1)
      ;(prisma.citizen.findMany as jest.Mock).mockResolvedValue([mockCitizen])

      const request = new NextRequest('http://localhost:3000/api/citizens?search=John')
      const response = await getCitizens(request)

      expect(prisma.citizen.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: 'John', mode: 'insensitive' } },
              { nik: { contains: 'John' } }
            ]
          }
        })
      )
    })

    it('should return 401 for unauthenticated request', async () => {
      const { getServerSession } = require('next-auth')
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/citizens')
      const response = await getCitizens(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 403 for insufficient permissions', async () => {
      const { checkPermission } = require('@/lib/rbac/server-utils')
      ;(checkPermission as jest.Mock).mockResolvedValue(false)

      const request = new NextRequest('http://localhost:3000/api/citizens')
      const response = await getCitizens(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden')
    })
  })

  describe('POST /api/citizens', () => {
    const validCitizenData = {
      nik: '1234567890123456',
      name: 'Jane Doe',
      birthDate: '1995-05-15',
      birthPlace: 'Bandung',
      gender: 'P',
      religion: 'KRISTEN',
      education: 'S1',
      occupation: 'Teacher',
      maritalStatus: 'BELUM_KAWIN',
      rt: '003',
      rw: '004',
      address: 'Jl. Sudirman No. 5'
    }

    it('should create new citizen with valid data', async () => {
      ;(prisma.citizen.findUnique as jest.Mock).mockResolvedValue(null) // No existing citizen
      ;(prisma.citizen.create as jest.Mock).mockResolvedValue({
        ...mockCitizen,
        ...validCitizenData,
        id: 'citizen-2'
      })
      ;(prisma.activityLog.create as jest.Mock).mockResolvedValue({})

      const request = new NextRequest('http://localhost:3000/api/citizens', {
        method: 'POST',
        body: JSON.stringify(validCitizenData)
      })

      const response = await createCitizen(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.message).toBe('Citizen created successfully')
      expect(data.citizen.nik).toBe(validCitizenData.nik)
    })

    it('should reject duplicate NIK', async () => {
      ;(prisma.citizen.findUnique as jest.Mock).mockResolvedValue(mockCitizen)

      const request = new NextRequest('http://localhost:3000/api/citizens', {
        method: 'POST',
        body: JSON.stringify(validCitizenData)
      })

      const response = await createCitizen(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('NIK already exists')
    })

    it('should validate request body', async () => {
      const invalidData = {
        nik: '123', // Invalid NIK
        name: '',   // Empty name
        gender: 'X' // Invalid gender
      }

      const request = new NextRequest('http://localhost:3000/api/citizens', {
        method: 'POST',
        body: JSON.stringify(invalidData)
      })

      const response = await createCitizen(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation error')
      expect(data.details).toBeDefined()
    })
  })

  describe('GET /api/citizens/[id]', () => {
    it('should return citizen by ID', async () => {
      ;(prisma.citizen.findUnique as jest.Mock).mockResolvedValue(mockCitizen)

      const response = await getCitizen(
        new NextRequest('http://localhost:3000/api/citizens/citizen-1'),
        { params: { id: 'citizen-1' } }
      )
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.citizen.id).toBe('citizen-1')
    })

    it('should return 404 for non-existent citizen', async () => {
      ;(prisma.citizen.findUnique as jest.Mock).mockResolvedValue(null)

      const response = await getCitizen(
        new NextRequest('http://localhost:3000/api/citizens/non-existent'),
        { params: { id: 'non-existent' } }
      )
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Citizen not found')
    })
  })

  describe('PUT /api/citizens/[id]', () => {
    const updateData = {
      name: 'John Smith',
      occupation: 'Senior Developer'
    }

    it('should update citizen with valid data', async () => {
      ;(prisma.citizen.findUnique as jest.Mock).mockResolvedValue(mockCitizen)
      ;(prisma.citizen.update as jest.Mock).mockResolvedValue({
        ...mockCitizen,
        ...updateData
      })
      ;(prisma.activityLog.create as jest.Mock).mockResolvedValue({})

      const response = await updateCitizen(
        new NextRequest('http://localhost:3000/api/citizens/citizen-1', {
          method: 'PUT',
          body: JSON.stringify(updateData)
        }),
        { params: { id: 'citizen-1' } }
      )
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Citizen updated successfully')
      expect(data.citizen.name).toBe(updateData.name)
    })

    it('should return 404 for non-existent citizen', async () => {
      ;(prisma.citizen.findUnique as jest.Mock).mockResolvedValue(null)

      const response = await updateCitizen(
        new NextRequest('http://localhost:3000/api/citizens/non-existent', {
          method: 'PUT',
          body: JSON.stringify(updateData)
        }),
        { params: { id: 'non-existent' } }
      )
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Citizen not found')
    })
  })

  describe('DELETE /api/citizens/[id]', () => {
    it('should delete citizen', async () => {
      ;(prisma.citizen.findUnique as jest.Mock).mockResolvedValue(mockCitizen)
      ;(prisma.citizen.delete as jest.Mock).mockResolvedValue(mockCitizen)
      ;(prisma.activityLog.create as jest.Mock).mockResolvedValue({})

      const response = await deleteCitizen(
        new NextRequest('http://localhost:3000/api/citizens/citizen-1', {
          method: 'DELETE'
        }),
        { params: { id: 'citizen-1' } }
      )
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Citizen deleted successfully')
    })

    it('should return 404 for non-existent citizen', async () => {
      ;(prisma.citizen.findUnique as jest.Mock).mockResolvedValue(null)

      const response = await deleteCitizen(
        new NextRequest('http://localhost:3000/api/citizens/non-existent', {
          method: 'DELETE'
        }),
        { params: { id: 'non-existent' } }
      )
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Citizen not found')
    })
  })
})