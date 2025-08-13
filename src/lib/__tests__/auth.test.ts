import { createSessionData, hashPassword, verifyPassword } from '../auth'

describe('Authentication Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'testpassword123'
      const hashed = await hashPassword(password)
      
      expect(hashed).toBeDefined()
      expect(hashed).not.toBe(password)
      expect(hashed).toMatch(/^\$2[aby]\$\d{1,2}\$[./A-Za-z0-9]{53}$/)
    })

    it('should produce different hashes for the same password', async () => {
      const password = 'testpassword123'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)
      
      expect(hash1).not.toBe(hash2)
    })
  })

  describe('verifyPassword', () => {
    it('should verify a correct password', async () => {
      const password = 'testpassword123'
      const hashed = await hashPassword(password)
      
      const isValid = await verifyPassword(password, hashed)
      expect(isValid).toBe(true)
    })

    it('should reject an incorrect password', async () => {
      const password = 'testpassword123'
      const wrongPassword = 'wrongpassword'
      const hashed = await hashPassword(password)
      
      const isValid = await verifyPassword(wrongPassword, hashed)
      expect(isValid).toBe(false)
    })
  })

  describe('createSessionData', () => {
    it('should create session data from user object', () => {
      const mockUser = {
        id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
        role: {
          id: 'role123',
          name: 'admin',
          permissions: [
            { resource: 'citizens', action: 'read', name: 'read:citizens' },
            { resource: 'citizens', action: 'write', name: 'write:citizens' }
          ]
        }
      }

      const sessionData = createSessionData(mockUser)
      
      expect(sessionData).toEqual({
        id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
        role: {
          id: 'role123',
          name: 'admin',
        },
        permissions: [
          { resource: 'citizens', action: 'read', name: 'read:citizens' },
          { resource: 'citizens', action: 'write', name: 'write:citizens' }
        ]
      })
    })
  })
}) 