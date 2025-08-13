import { describe, it, expect } from '@jest/globals'
import { PERMISSIONS, ROLES, checkUserPermission, hasPermission } from '@/lib/rbac/permissions'

describe('RBAC Permissions', () => {
  describe('PERMISSIONS constants', () => {
    it('should have all required permission objects', () => {
      expect(PERMISSIONS.CITIZENS_READ).toEqual({
        resource: 'citizens',
        action: 'read'
      })
      expect(PERMISSIONS.CITIZENS_CREATE).toEqual({
        resource: 'citizens',
        action: 'create'
      })
      expect(PERMISSIONS.USERS_MANAGE).toEqual({
        resource: 'users',
        action: 'manage'
      })
    })

    it('should have consistent permission structure', () => {
      Object.values(PERMISSIONS).forEach(permission => {
        expect(permission).toHaveProperty('resource')
        expect(permission).toHaveProperty('action')
        expect(typeof permission.resource).toBe('string')
        expect(typeof permission.action).toBe('string')
      })
    })
  })

  describe('ROLES constants', () => {
    it('should have all required roles', () => {
      expect(ROLES.SUPER_ADMIN).toBeDefined()
      expect(ROLES.ADMIN).toBeDefined()
      expect(ROLES.STAFF).toBeDefined()
      expect(ROLES.OPERATOR).toBeDefined()
    })

    it('should have proper role structure', () => {
      Object.values(ROLES).forEach(role => {
        expect(role).toHaveProperty('name')
        expect(role).toHaveProperty('permissions')
        expect(typeof role.name).toBe('string')
        expect(Array.isArray(role.permissions)).toBe(true)
      })
    })

    it('should have Super Admin with all permissions', () => {
      const superAdminPermissions = ROLES.SUPER_ADMIN.permissions
      const allPermissions = Object.values(PERMISSIONS)
      expect(superAdminPermissions).toHaveLength(allPermissions.length)
    })

    it('should have hierarchical permission structure', () => {
      const superAdminCount = ROLES.SUPER_ADMIN.permissions.length
      const adminCount = ROLES.ADMIN.permissions.length
      const staffCount = ROLES.STAFF.permissions.length
      const operatorCount = ROLES.OPERATOR.permissions.length

      expect(superAdminCount).toBeGreaterThan(adminCount)
      expect(adminCount).toBeGreaterThan(staffCount)
      expect(staffCount).toBeGreaterThanOrEqual(operatorCount)
    })
  })

  describe('checkUserPermission', () => {
    const mockUser = {
      id: 'user-1',
      role: {
        permissions: [
          PERMISSIONS.CITIZENS_READ,
          PERMISSIONS.CITIZENS_CREATE,
          PERMISSIONS.LETTERS_READ
        ]
      }
    }

    it('should return true for user with required permission', () => {
      const result = checkUserPermission(mockUser, 'citizens', 'read')
      expect(result).toBe(true)
    })

    it('should return false for user without required permission', () => {
      const result = checkUserPermission(mockUser, 'citizens', 'delete')
      expect(result).toBe(false)
    })

    it('should return false for user without role', () => {
      const userWithoutRole = { id: 'user-2', role: null }
      const result = checkUserPermission(userWithoutRole as any, 'citizens', 'read')
      expect(result).toBe(false)
    })

    it('should return false for user without permissions', () => {
      const userWithoutPermissions = {
        id: 'user-3',
        role: { permissions: [] }
      }
      const result = checkUserPermission(userWithoutPermissions, 'citizens', 'read')
      expect(result).toBe(false)
    })
  })

  describe('hasPermission', () => {
    const permissions = [
      PERMISSIONS.CITIZENS_READ,
      PERMISSIONS.CITIZENS_CREATE,
      PERMISSIONS.LETTERS_READ
    ]

    it('should return true when permission exists', () => {
      const result = hasPermission(permissions, 'citizens', 'read')
      expect(result).toBe(true)
    })

    it('should return false when permission does not exist', () => {
      const result = hasPermission(permissions, 'citizens', 'delete')
      expect(result).toBe(false)
    })

    it('should return false for empty permissions array', () => {
      const result = hasPermission([], 'citizens', 'read')
      expect(result).toBe(false)
    })

    it('should be case sensitive', () => {
      const result = hasPermission(permissions, 'Citizens', 'Read')
      expect(result).toBe(false)
    })
  })
})