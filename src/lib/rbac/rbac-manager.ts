/**
 * RBAC Manager
 * Core role-based access control management system
 */

import { prisma } from '@/lib/db'
import { PERMISSIONS, ROLES, Permission, Role } from './permissions'
import type { AuthUser } from '@/lib/auth/utils'

export class RBACManager {
  /**
   * Initialize default roles and permissions in database
   */
  static async initializeRoles(): Promise<void> {
    try {
      console.log('🔐 Initializing RBAC system...')

      // Create permissions
      for (const permission of PERMISSIONS) {
        await prisma.permission.upsert({
          where: {
            resource_action: {
              resource: permission.resource,
              action: permission.action
            }
          },
          update: {
            name: permission.name
          },
          create: {
            name: permission.name,
            resource: permission.resource,
            action: permission.action
          }
        })
      }

      // Create roles with permissions
      for (const role of ROLES) {
        // Create or update role
        const dbRole = await prisma.userRole.upsert({
          where: { name: role.name },
          update: {
            description: role.description
          },
          create: {
            name: role.name,
            description: role.description
          }
        })

        // Get permission IDs
        const permissionIds = []
        for (const permId of role.permissions) {
          const permission = PERMISSIONS.find(p => p.id === permId)
          if (permission) {
            const dbPermission = await prisma.permission.findUnique({
              where: {
                resource_action: {
                  resource: permission.resource,
                  action: permission.action
                }
              }
            })
            if (dbPermission) {
              permissionIds.push(dbPermission.id)
            }
          }
        }

        // Update role permissions
        await prisma.userRole.update({
          where: { id: dbRole.id },
          data: {
            permissions: {
              set: permissionIds.map(id => ({ id }))
            }
          }
        })
      }

      console.log('✅ RBAC system initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize RBAC system:', error)
      throw error
    }
  }

  /**
   * Check if user has specific permission
   */
  static async userHasPermission(
    userId: string,
    resource: string,
    action: string
  ): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          role: {
            include: {
              permissions: true
            }
          }
        }
      })

      if (!user || !user.isActive) return false

      // Super Admin has all permissions
      if (user.role.name === 'Super Admin') return true

      // Check specific permission
      return user.role.permissions.some(
        p => p.resource === resource && p.action === action
      )
    } catch (error) {
      console.error('Error checking user permission:', error)
      return false
    }
  }

  /**
   * Check if user has any of the specified roles
   */
  static async userHasRole(userId: string, roles: string[]): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { role: true }
      })

      if (!user || !user.isActive) return false

      return roles.includes(user.role.name)
    } catch (error) {
      console.error('Error checking user role:', error)
      return false
    }
  }

  /**
   * Get user permissions
   */
  static async getUserPermissions(userId: string): Promise<Permission[]> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          role: {
            include: {
              permissions: true
            }
          }
        }
      })

      if (!user || !user.isActive) return []

      // Super Admin has all permissions
      if (user.role.name === 'Super Admin') {
        return PERMISSIONS
      }

      // Map database permissions to Permission objects
      return user.role.permissions.map(dbPerm => {
        const permission = PERMISSIONS.find(
          p => p.resource === dbPerm.resource && p.action === dbPerm.action
        )
        return permission || {
          id: `${dbPerm.resource}.${dbPerm.action}`,
          name: dbPerm.name,
          resource: dbPerm.resource,
          action: dbPerm.action,
          description: `Permission for ${dbPerm.resource} ${dbPerm.action}`
        }
      })
    } catch (error) {
      console.error('Error getting user permissions:', error)
      return []
    }
  }

  /**
   * Assign role to user
   */
  static async assignRole(userId: string, roleName: string): Promise<void> {
    try {
      const role = await prisma.userRole.findUnique({
        where: { name: roleName }
      })

      if (!role) {
        throw new Error(`Role not found: ${roleName}`)
      }

      await prisma.user.update({
        where: { id: userId },
        data: { roleId: role.id }
      })
    } catch (error) {
      console.error('Error assigning role:', error)
      throw error
    }
  }

  /**
   * Create custom role
   */
  static async createRole(
    name: string,
    description: string,
    permissionIds: string[]
  ): Promise<void> {
    try {
      // Get database permission IDs
      const dbPermissionIds = []
      for (const permId of permissionIds) {
        const permission = PERMISSIONS.find(p => p.id === permId)
        if (permission) {
          const dbPermission = await prisma.permission.findUnique({
            where: {
              resource_action: {
                resource: permission.resource,
                action: permission.action
              }
            }
          })
          if (dbPermission) {
            dbPermissionIds.push(dbPermission.id)
          }
        }
      }

      await prisma.userRole.create({
        data: {
          name,
          description,
          permissions: {
            connect: dbPermissionIds.map(id => ({ id }))
          }
        }
      })
    } catch (error) {
      console.error('Error creating role:', error)
      throw error
    }
  }

  /**
   * Update role permissions
   */
  static async updateRolePermissions(
    roleName: string,
    permissionIds: string[]
  ): Promise<void> {
    try {
      const role = await prisma.userRole.findUnique({
        where: { name: roleName }
      })

      if (!role) {
        throw new Error(`Role not found: ${roleName}`)
      }

      // Get database permission IDs
      const dbPermissionIds = []
      for (const permId of permissionIds) {
        const permission = PERMISSIONS.find(p => p.id === permId)
        if (permission) {
          const dbPermission = await prisma.permission.findUnique({
            where: {
              resource_action: {
                resource: permission.resource,
                action: permission.action
              }
            }
          })
          if (dbPermission) {
            dbPermissionIds.push(dbPermission.id)
          }
        }
      }

      await prisma.userRole.update({
        where: { id: role.id },
        data: {
          permissions: {
            set: dbPermissionIds.map(id => ({ id }))
          }
        }
      })
    } catch (error) {
      console.error('Error updating role permissions:', error)
      throw error
    }
  }

  /**
   * Get all roles with permissions
   */
  static async getAllRoles(): Promise<Array<{
    id: string
    name: string
    description: string
    permissions: Permission[]
    userCount: number
  }>> {
    try {
      const roles = await prisma.userRole.findMany({
        include: {
          permissions: true,
          users: true
        }
      })

      return roles.map(role => ({
        id: role.id,
        name: role.name,
        description: role.description || '',
        permissions: role.permissions.map(dbPerm => {
          const permission = PERMISSIONS.find(
            p => p.resource === dbPerm.resource && p.action === dbPerm.action
          )
          return permission || {
            id: `${dbPerm.resource}.${dbPerm.action}`,
            name: dbPerm.name,
            resource: dbPerm.resource,
            action: dbPerm.action,
            description: `Permission for ${dbPerm.resource} ${dbPerm.action}`
          }
        }),
        userCount: role.users.length
      }))
    } catch (error) {
      console.error('Error getting all roles:', error)
      return []
    }
  }

  /**
   * Get role by name
   */
  static async getRole(roleName: string): Promise<{
    id: string
    name: string
    description: string
    permissions: Permission[]
  } | null> {
    try {
      const role = await prisma.userRole.findUnique({
        where: { name: roleName },
        include: { permissions: true }
      })

      if (!role) return null

      return {
        id: role.id,
        name: role.name,
        description: role.description || '',
        permissions: role.permissions.map(dbPerm => {
          const permission = PERMISSIONS.find(
            p => p.resource === dbPerm.resource && p.action === dbPerm.action
          )
          return permission || {
            id: `${dbPerm.resource}.${dbPerm.action}`,
            name: dbPerm.name,
            resource: dbPerm.resource,
            action: dbPerm.action,
            description: `Permission for ${dbPerm.resource} ${dbPerm.action}`
          }
        })
      }
    } catch (error) {
      console.error('Error getting role:', error)
      return null
    }
  }

  /**
   * Delete role (if no users assigned)
   */
  static async deleteRole(roleName: string): Promise<void> {
    try {
      const role = await prisma.userRole.findUnique({
        where: { name: roleName },
        include: { users: true }
      })

      if (!role) {
        throw new Error(`Role not found: ${roleName}`)
      }

      if (role.users.length > 0) {
        throw new Error(`Cannot delete role ${roleName}: ${role.users.length} users assigned`)
      }

      await prisma.userRole.delete({
        where: { id: role.id }
      })
    } catch (error) {
      console.error('Error deleting role:', error)
      throw error
    }
  }

  /**
   * Get users by role
   */
  static async getUsersByRole(roleName: string): Promise<AuthUser[]> {
    try {
      const users = await prisma.user.findMany({
        where: {
          role: { name: roleName }
        },
        include: {
          role: {
            include: {
              permissions: true
            }
          }
        }
      })

      return users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role.name,
        permissions: user.role.permissions.map(p => ({
          resource: p.resource,
          action: p.action
        })),
        isActive: user.isActive
      }))
    } catch (error) {
      console.error('Error getting users by role:', error)
      return []
    }
  }

  /**
   * Audit user permissions
   */
  static async auditUserPermissions(userId: string): Promise<{
    user: AuthUser
    permissions: Permission[]
    rolePermissions: Permission[]
    effectivePermissions: Permission[]
  } | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          role: {
            include: {
              permissions: true
            }
          }
        }
      })

      if (!user) return null

      const authUser: AuthUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role.name,
        permissions: user.role.permissions.map(p => ({
          resource: p.resource,
          action: p.action
        })),
        isActive: user.isActive
      }

      const rolePermissions = user.role.permissions.map(dbPerm => {
        const permission = PERMISSIONS.find(
          p => p.resource === dbPerm.resource && p.action === dbPerm.action
        )
        return permission || {
          id: `${dbPerm.resource}.${dbPerm.action}`,
          name: dbPerm.name,
          resource: dbPerm.resource,
          action: dbPerm.action,
          description: `Permission for ${dbPerm.resource} ${dbPerm.action}`
        }
      })

      // Effective permissions (same as role permissions for now)
      const effectivePermissions = user.role.name === 'Super Admin' 
        ? PERMISSIONS 
        : rolePermissions

      return {
        user: authUser,
        permissions: rolePermissions,
        rolePermissions,
        effectivePermissions
      }
    } catch (error) {
      console.error('Error auditing user permissions:', error)
      return null
    }
  }
}