// Authentication utilities
import type { User } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12)
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}

// Get user by username or email
export async function getUserByCredentials(usernameOrEmail: string) {
  return await prisma.user.findFirst({
    where: {
      OR: [
        { username: usernameOrEmail },
        { email: usernameOrEmail },
      ],
      isActive: true,
    },
    include: {
      role: {
        include: {
          permissions: true,
        },
      },
    },
  })
}

// Authenticate user
export async function authenticateUser(usernameOrEmail: string, password: string) {
  const user = await getUserByCredentials(usernameOrEmail)
  
  if (!user) {
    return null
  }

  const isValidPassword = await verifyPassword(password, user.password)
  
  if (!isValidPassword) {
    return null
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  })

  // Return user without password
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _password, ...userWithoutPassword } = user
  return userWithoutPassword
}

// Check if user has permission
export function hasPermission(
  user: User & { role: { permissions: Array<{ resource: string; action: string }> } },
  resource: string,
  action: string
): boolean {
  return user.role.permissions.some(
    permission => permission.resource === resource && permission.action === action
  )
}

// Get user permissions
type UserWithPermissions = { role: { permissions: Array<{ resource: string; action: string; name: string }> } }

export function getUserPermissions(
  user: UserWithPermissions
) {
  return user.role.permissions.map(permission => ({
    resource: permission.resource,
    action: permission.action,
    name: permission.name,
  }))
}

// Create session data
type SessionUserInput = {
  id: string
  username: string
  email: string
  name: string
  role: {
    id: string
    name: string
    permissions: Array<{ resource: string; action: string; name: string }>
  }
}

export function createSessionData(user: SessionUserInput) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    name: user.name,
    role: {
      id: user.role.id,
      name: user.role.name,
    },
    permissions: getUserPermissions(user),
  }
}