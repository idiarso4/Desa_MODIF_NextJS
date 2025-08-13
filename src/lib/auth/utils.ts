/**
 * Authentication Utilities
 * Helper functions for authentication and authorization
 */

import { getServerSession } from 'next-auth/next'
import { authOptions } from './config'
import { prisma } from '@/lib/db'
import { hash, compare } from 'bcryptjs'
import { sign, verify } from 'jsonwebtoken'

export interface AuthUser {
  id: string
  username: string
  email: string
  name: string
  role: string
  permissions: Array<{ resource: string; action: string }>
  isActive: boolean
  lastLogin?: string | null
}

/**
 * Get current session on server side
 */
export async function getCurrentSession() {
  return await getServerSession(authOptions)
}

/**
 * Get current user from session
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await getCurrentSession()
  return session?.user || null
}

/**
 * Check if user has specific permission
 */
export function hasPermission(
  user: AuthUser | null,
  resource: string,
  action: string
): boolean {
  if (!user || !user.isActive) return false

  // Super Admin has all permissions
  if (user.role === 'Super Admin') return true

  // Check specific permission
  return user.permissions.some(
    p => p.resource === resource && p.action === action
  )
}

/**
 * Check if user has any of the specified roles
 */
export function hasRole(user: AuthUser | null, roles: string[]): boolean {
  if (!user || !user.isActive) return false
  return roles.includes(user.role)
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}

/**
 * Require specific permission - throws error if not authorized
 */
export async function requirePermission(resource: string, action: string): Promise<AuthUser> {
  const user = await requireAuth()
  if (!hasPermission(user, resource, action)) {
    throw new Error(`Permission denied: ${resource}.${action}`)
  }
  return user
}

/**
 * Require specific role - throws error if not authorized
 */
export async function requireRole(roles: string[]): Promise<AuthUser> {
  const user = await requireAuth()
  if (!hasRole(user, roles)) {
    throw new Error(`Role required: ${roles.join(' or ')}`)
  }
  return user
}

/**
 * Hash password
 */
export async function hashPassword(password: string): Promise<string> {
  return await hash(password, 12)
}

/**
 * Verify password
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await compare(password, hashedPassword)
}

/**
 * Generate JWT token for API access
 */
export function generateApiToken(userId: string, expiresIn: string = '1h'): string {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET not configured')
  }

  return sign(
    { 
      userId,
      type: 'api',
      iat: Math.floor(Date.now() / 1000)
    },
    secret,
    { expiresIn }
  )
}

/**
 * Verify JWT token
 */
export function verifyApiToken(token: string): { userId: string; type: string } | null {
  try {
    const secret = process.env.NEXTAUTH_SECRET
    if (!secret) {
      throw new Error('NEXTAUTH_SECRET not configured')
    }

    const decoded = verify(token, secret) as any
    return {
      userId: decoded.userId,
      type: decoded.type
    }
  } catch (error) {
    return null
  }
}

/**
 * Create user session data
 */
export async function createUserSession(userId: string) {
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

  if (!user || !user.isActive) {
    return null
  }

  return {
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
}

/**
 * Log user activity
 */
export async function logActivity(
  userId: string,
  action: string,
  resource: string,
  resourceId?: string,
  description?: string,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        resource,
        resourceId,
        description,
        ipAddress,
        userAgent
      }
    })
  } catch (error) {
    console.error('Failed to log activity:', error)
  }
}

/**
 * Check if user account is locked
 */
export async function isAccountLocked(username: string): Promise<boolean> {
  // This would implement account lockout logic
  // For now, just return false
  return false
}

/**
 * Lock user account
 */
export async function lockAccount(userId: string, reason: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { isActive: false }
  })

  await logActivity(
    userId,
    'ACCOUNT_LOCKED',
    'user',
    userId,
    `Account locked: ${reason}`
  )
}

/**
 * Unlock user account
 */
export async function unlockAccount(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { isActive: true }
  })

  await logActivity(
    userId,
    'ACCOUNT_UNLOCKED',
    'user',
    userId,
    'Account unlocked'
  )
}

/**
 * Change user password
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!user) {
    throw new Error('User not found')
  }

  // Verify current password
  const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password)
  if (!isCurrentPasswordValid) {
    throw new Error('Current password is incorrect')
  }

  // Hash new password
  const hashedNewPassword = await hashPassword(newPassword)

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedNewPassword }
  })

  // Log password change
  await logActivity(
    userId,
    'PASSWORD_CHANGED',
    'user',
    userId,
    'Password changed successfully'
  )
}

/**
 * Reset user password (admin function)
 */
export async function resetPassword(userId: string, newPassword: string): Promise<void> {
  const hashedPassword = await hashPassword(newPassword)

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  })

  await logActivity(
    userId,
    'PASSWORD_RESET',
    'user',
    userId,
    'Password reset by administrator'
  )
}

/**
 * Get user permissions
 */
export async function getUserPermissions(userId: string): Promise<Array<{ resource: string; action: string }>> {
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

  if (!user) {
    return []
  }

  return user.role.permissions.map(p => ({
    resource: p.resource,
    action: p.action
  }))
}

/**
 * Validate session token
 */
export async function validateSessionToken(token: string): Promise<AuthUser | null> {
  try {
    const decoded = verifyApiToken(token)
    if (!decoded) {
      return null
    }

    return await createUserSession(decoded.userId)
  } catch (error) {
    return null
  }
}