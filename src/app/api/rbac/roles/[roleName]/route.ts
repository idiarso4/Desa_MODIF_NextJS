/**
 * Individual Role API Routes
 * Operations for specific roles
 */

import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/auth/utils'
import { RBACManager } from '@/lib/rbac/rbac-manager'
import { z } from 'zod'

const updateRoleSchema = z.object({
  description: z.string().optional(),
  permissions: z.array(z.string()).min(1, 'At least one permission is required')
})

/**
 * GET /api/rbac/roles/[roleName]
 * Get specific role details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { roleName: string } }
) {
  try {
    // Check permission
    await requirePermission('users', 'manage')

    const { roleName } = params
    const role = await RBACManager.getRole(decodeURIComponent(roleName))

    if (!role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ role })
  } catch (error) {
    console.error('Error getting role:', error)
    
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

/**
 * PUT /api/rbac/roles/[roleName]
 * Update role permissions
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { roleName: string } }
) {
  try {
    // Check permission
    await requirePermission('users', 'manage')

    const { roleName } = params
    const decodedRoleName = decodeURIComponent(roleName)

    // Prevent modification of Super Admin role
    if (decodedRoleName === 'Super Admin') {
      return NextResponse.json(
        { error: 'Cannot modify Super Admin role' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = updateRoleSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validation.error.format()
        },
        { status: 400 }
      )
    }

    const { permissions } = validation.data

    // Check if role exists
    const existingRole = await RBACManager.getRole(decodedRoleName)
    if (!existingRole) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      )
    }

    await RBACManager.updateRolePermissions(decodedRoleName, permissions)

    return NextResponse.json({
      message: 'Role updated successfully'
    })
  } catch (error) {
    console.error('Error updating role:', error)
    
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

/**
 * DELETE /api/rbac/roles/[roleName]
 * Delete a role
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { roleName: string } }
) {
  try {
    // Check permission
    await requirePermission('users', 'manage')

    const { roleName } = params
    const decodedRoleName = decodeURIComponent(roleName)

    // Prevent deletion of system roles
    const systemRoles = ['Super Admin', 'Admin Desa', 'Operator', 'Viewer']
    if (systemRoles.includes(decodedRoleName)) {
      return NextResponse.json(
        { error: 'Cannot delete system role' },
        { status: 403 }
      )
    }

    await RBACManager.deleteRole(decodedRoleName)

    return NextResponse.json({
      message: 'Role deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting role:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('Permission denied')) {
        return NextResponse.json(
          { error: 'Permission denied' },
          { status: 403 }
        )
      }
      
      if (error.message.includes('users assigned')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        )
      }
      
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Role not found' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}