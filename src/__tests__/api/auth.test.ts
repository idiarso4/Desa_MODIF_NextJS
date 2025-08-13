import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { createMocks } from 'node-mocks-http'
import { NextRequest } from 'next/server'
import { POST as loginHandler } from '@/app/api/auth/login/route'
import { GET as meHandler } from '@/app/api/auth/me/route'
import { POST as changePasswordHandler } from '@/app/api/auth/change-password/route'
import { prisma } from '@/lib/db'
import { hash } from 'bcryptjs'

// Mock Prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn()
    }
  }
}))

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}))

describe('/api/auth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const hashedPassword = await hash('password123', 12)
      const mockUser = {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
        password: hashedPassword,
        isActive: true,
        role: {
          name: 'Admin',
          permissions: [
            { resource: 'citizens', action: 'read' }
          ]
        }
      }

      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.user.update as jest.Mock).mockResolvedValue(mockUser)

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: 'testuser',
          password: 'password123'
        })
      })

      const response = await loginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.user).toEqual({
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
        role: 'Admin'
      })
    })

    it('should reject invalid credentials', async () => {
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: 'invaliduser',
          password: 'wrongpassword'
        })
      })

      const response = await loginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Username atau password salah')
    })

    it('should reject inactive user', async () => {
      const mockUser = {
        id: 'user-1',
        username: 'testuser',
        password: await hash('password123', 12),
        isActive: false
      }

      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: 'testuser',
          password: 'password123'
        })
      })

      const response = await loginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Akun tidak aktif')
    })

    it('should validate request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: '',
          password: ''
        })
      })

      const response = await loginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Username dan password harus diisi')
    })
  })

  describe('GET /api/auth/me', () => {
    it('should return current user info', async () => {
      const mockSession = {
        user: {
          id: 'user-1',
          username: 'testuser',
          name: 'Test User',
          role: 'Admin',
          permissions: [
            { resource: 'citizens', action: 'read' }
          ]
        }
      }

      const { getServerSession } = require('next-auth')
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

      const request = new NextRequest('http://localhost:3000/api/auth/me')
      const response = await meHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.user).toEqual(mockSession.user)
    })

    it('should return 401 for unauthenticated request', async () => {
      const { getServerSession } = require('next-auth')
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/auth/me')
      const response = await meHandler(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('POST /api/auth/change-password', () => {
    it('should change password with valid current password', async () => {
      const mockSession = {
        user: { id: 'user-1' }
      }

      const mockUser = {
        id: 'user-1',
        password: await hash('oldpassword', 12)
      }

      const { getServerSession } = require('next-auth')
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.user.update as jest.Mock).mockResolvedValue({ ...mockUser, password: 'new-hash' })

      const request = new NextRequest('http://localhost:3000/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: 'oldpassword',
          newPassword: 'newpassword123'
        })
      })

      const response = await changePasswordHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Password berhasil diubah')
    })

    it('should reject wrong current password', async () => {
      const mockSession = {
        user: { id: 'user-1' }
      }

      const mockUser = {
        id: 'user-1',
        password: await hash('oldpassword', 12)
      }

      const { getServerSession } = require('next-auth')
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      const request = new NextRequest('http://localhost:3000/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123'
        })
      })

      const response = await changePasswordHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Password saat ini salah')
    })

    it('should validate new password strength', async () => {
      const mockSession = {
        user: { id: 'user-1' }
      }

      const { getServerSession } = require('next-auth')
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

      const request = new NextRequest('http://localhost:3000/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: 'oldpassword',
          newPassword: '123'
        })
      })

      const response = await changePasswordHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Password')
    })
  })
})