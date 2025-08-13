/**
 * User Detail API Routes
 * Individual user operations (GET, PUT, DELETE)
 */

import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, getCurrentUser } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateUserSchema = z.object({
  email: z.string().email('Format email tidak valid').optional(),
  name: z.string().min(1, 'Nama harus diisi').max(100, 'Nama maksimal 100 karakter').optional(),
  roleId: z.string().min(1, 'Role harus dipilih').optional(),
  isActive: z.boolean().optional()
})

/**
 * GET /api/users/[id]
 * Get user by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check permission
    await requirePermission('users', 'read')

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        role: {
          include: {
            permissions: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: {
          id: user.role.id,
          name: user.role.name,
          description: user.role.description,
          permissions: user.role.permissions.map(p => ({
            id: p.id,
            name: p.name,
            resource: p.resource,
            action: p.action
          }))
        },
        isActive: user.isActive,
        lastLogin: user.lastLogin?.toISOString() || null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Error getting user:', error)
    
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
 * PUT /api/users/[id]
 * Update user
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check permission
    await requirePermission('users', 'update')

    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = updateUserSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validation.error.format()
        },
        { status: 400 }
      )
    }

    const updateData = validation.data

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
      include: { role: true }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    // Prevent self-deactivation
    if (currentUser.id === params.id && updateData.isActive === false) {
      return NextResponse.json(
        { error: 'Tidak dapat menonaktifkan akun sendiri' },
        { status: 400 }
      )
    }

    // Check if email is already used by another user
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email: updateData.email,
          id: { not: params.id }
        }
      })

      if (emailExists) {
        return NextResponse.json(
          { error: 'Email sudah digunakan oleh user lain' },
          { status: 409 }
        )
      }
    }

    // Check if role exists
    if (updateData.roleId) {
      const role = await prisma.userRole.findUnique({
        where: { id: updateData.roleId }
      })

      if (!role) {
        return NextResponse.json(
          { error: 'Role tidak ditemukan' },
          { status: 400 }
        )
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      include: {
        role: true
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: currentUser.id,
        action: 'UPDATE_USER',
        resource: 'users',
        resourceId: params.id,
        description: `Updated user: ${updatedUser.username}`,
      }
    })

    return NextResponse.json({
      message: 'User berhasil diperbarui',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role.name,
        isActive: updatedUser.isActive
      }
    })
  } catch (error) {
    console.error('Error updating user:', error)
    
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
 * DELETE /api/users/[id]
 * Delete user (soft delete by deactivating)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check permission
    await requirePermission('users', 'delete')

    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Prevent self-deletion
    if (currentUser.id === params.id) {
      return NextResponse.json(
        { error: 'Tidak dapat menghapus akun sendiri' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: params.id }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check if user has created data that would be affected
    const [citizenCount, letterCount] = await Promise.all([
      prisma.citizen.count({ where: { createdById: params.id } }),
      prisma.letterRequest.count({ where: { processedById: params.id } })
    ])

    if (citizenCount > 0 || letterCount > 0) {
      // Soft delete by deactivating
      await prisma.user.update({
        where: { id: params.id },
        data: { isActive: false }
      })

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: currentUser.id,
          action: 'DEACTIVATE_USER',
          resource: 'users',
          resourceId: params.id,
          description: `Deactivated user: ${user.username} (has associated data)`,
        }
      })

      return NextResponse.json({
        message: 'User dinonaktifkan karena memiliki data terkait'
      })
    } else {
      // Hard delete if no associated data
      await prisma.user.delete({
        where: { id: params.id }
      })

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: currentUser.id,
          action: 'DELETE_USER',
          resource: 'users',
          resourceId: params.id,
          description: `Deleted user: ${user.username}`,
        }
      })

      return NextResponse.json({
        message: 'User berhasil dihapus'
      })
    }
  } catch (error) {
    console.error('Error deleting user:', error)
    
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