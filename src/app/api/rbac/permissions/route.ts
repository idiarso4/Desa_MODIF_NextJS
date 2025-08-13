/**
 * Permissions API Routes
 * Get available permissions for role management
 */

import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/auth/utils'
import { PERMISSIONS, RESOURCES, ACTIONS } from '@/lib/rbac/permissions'

/**
 * GET /api/rbac/permissions
 * Get all available permissions grouped by resource
 */
export async function GET(request: NextRequest) {
  try {
    // Check permission
    await requirePermission('users', 'manage')

    // Group permissions by resource
    const groupedPermissions = PERMISSIONS.reduce((acc, permission) => {
      if (!acc[permission.resource]) {
        acc[permission.resource] = []
      }
      acc[permission.resource].push(permission)
      return acc
    }, {} as Record<string, typeof PERMISSIONS>)

    return NextResponse.json({
      permissions: PERMISSIONS,
      groupedPermissions,
      resources: Object.values(RESOURCES),
      actions: Object.values(ACTIONS),
      total: PERMISSIONS.length
    })
  } catch (error) {
    console.error('Error getting permissions:', error)
    
    if (error instanceof Error && error.message.includes('Permission denied')) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}