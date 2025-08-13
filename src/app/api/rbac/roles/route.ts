/**
 * Roles API Routes
 * CRUD operations for role management
 */

import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/auth/utils'
import { RBACManager } from '@/lib/rbac/rbac-manager'
import { z } from 'zod'

const createRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
  description: z.string().min(1, 'Description is required'),
  permissions: z.array(z.string()).min(1, 'At least one permission is required')
})

const updateRoleSchema = z.object({
  description: z.string().optional(),
  permissions: z.array(z.string()).min(1, 'At least one permission is required')
})

/**
 * GET /api/rbac/roles
 * Get all roles with permissions
 */
export async function GET(request: NextRequest) {
  try {
    // Check permission
    await requirePermission('users', 'manage')

    const roles = await RBACManager.getAllRoles()

    return NextResponse.json({
      roles,
      total: roles.length
    })
  } catch (error) {
    console.error('Error getting roles:', error)
    
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
 * POST /api/rbac/roles
 * Create a new role
 */
export async function POST(request: NextRequest) {
  try {
    // Check permission
    await requirePermission('users', 'manage')

    const body = await request.json()
    const validation = createRoleSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validation.error.format()
        },
        { status: 400 }
      )
    }

    const { name, description, permissions } = validation.data

    // Check if role already exists
    const existingRole = await RBACManager.getRole(name)
    if (existingRole) {
      return NextResponse.json(
        { error: 'Role already exists' },
        { status: 409 }
      )
    }

    await RBACManager.createRole(name, description, permissions)

    return NextResponse.json(
      { message: 'Role created successfully' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating role:', error)
    
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