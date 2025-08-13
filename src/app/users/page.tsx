/**
 * User Management Page
 * Admin interface for managing users and roles
 */

import { requireServerPermission } from '@/lib/rbac/server-utils'
import { prisma } from '@/lib/db'
import { MainLayout } from '@/components/layout/main-layout'
import { UserManagementClient } from './user-management-client'

async function getUsers() {
  try {
    const users = await prisma.user.findMany({
      include: {
        role: {
          include: {
            permissions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: {
        id: user.role.id,
        name: user.role.name,
        description: user.role.description
      },
      isActive: user.isActive,
      lastLogin: user.lastLogin?.toISOString() || null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    }))
  } catch (error) {
    console.error('Error fetching users:', error)
    return []
  }
}

async function getRoles() {
  try {
    const roles = await prisma.userRole.findMany({
      include: {
        permissions: true,
        users: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description || '',
      userCount: role.users.length,
      permissions: role.permissions.map(p => ({
        id: p.id,
        name: p.name,
        resource: p.resource,
        action: p.action
      }))
    }))
  } catch (error) {
    console.error('Error fetching roles:', error)
    return []
  }
}

export default async function UsersPage() {
  // Require user management permission
  await requireServerPermission('users', 'manage')

  const [users, roles] = await Promise.all([
    getUsers(),
    getRoles()
  ])

  return (
    <MainLayout title="Manajemen Pengguna">
      <UserManagementClient users={users} roles={roles} />
    </MainLayout>
  )
}