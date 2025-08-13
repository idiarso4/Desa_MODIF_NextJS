/**
 * User Status Toggle API Route
 * Toggle user active/inactive status
 */

import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, getCurrentUser } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const toggleStatusSchema = z.object({
  isActive: z.boolean()
})

/**
 * PATCH /api/users/[id]/toggle-status
 * Toggle user active/inactive status
 */
export async function PATCH(
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
    const validation = toggleStatusSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validation.error.format()
        },
        { status: 400 }
      )
    }

    const { isActive } = validation.data

    // Prevent self-deactivation
    if (currentUser.id === params.id && !isActive) {
      return NextResponse.json(
        { error: 'Tidak dapat menonaktifkan akun sendiri' },
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

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: { isActive },
      include: { role: true }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: currentUser.id,
        action: isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
        resource: 'users',
        resourceId: params.id,
        description: `${isActive ? 'Activated' : 'Deactivated'} user: ${updatedUser.username}`,
      }
    })

    return NextResponse.json({
      message: `User berhasil ${isActive ? 'diaktifkan' : 'dinonaktifkan'}`,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        name: updatedUser.name,
        isActive: updatedUser.isActive
      }
    })
  } catch (error) {
    console.error('Error toggling user status:', error)
    
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