/**
 * Users API Routes
 * CRUD operations for user management
 */

import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'
import { hash } from 'bcryptjs'
import { z } from 'zod'

const createUserSchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter').max(50, 'Username maksimal 50 karakter'),
  email: z.string().email('Format email tidak valid'),
  name: z.string().min(1, 'Nama harus diisi').max(100, 'Nama maksimal 100 karakter'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  roleId: z.string().min(1, 'Role harus dipilih')
})

/**
 * GET /api/users
 * Get all users with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Check permission
    await requirePermission('users', 'read')

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const status = searchParams.get('status') || ''

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (role) {
      where.role = { name: role }
    }

    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          role: {
            include: {
              permissions: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ])

    const formattedUsers = users.map(user => ({
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

    return NextResponse.json({
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error getting users:', error)
    
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
 * POST /api/users
 * Create a new user
 */
export async function POST(request: NextRequest) {
  try {
    // Check permission
    await requirePermission('users', 'create')

    const body = await request.json()
    const validation = createUserSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validation.error.format()
        },
        { status: 400 }
      )
    }

    const { username, email, name, password, roleId } = validation.data

    // Check if username already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username atau email sudah digunakan' },
        { status: 409 }
      )
    }

    // Check if role exists
    const role = await prisma.userRole.findUnique({
      where: { id: roleId }
    })

    if (!role) {
      return NextResponse.json(
        { error: 'Role tidak ditemukan' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        name,
        password: hashedPassword,
        roleId,
        isActive: true
      },
      include: {
        role: true
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'CREATE_USER',
        resource: 'users',
        resourceId: user.id,
        description: `Created user: ${user.username}`,
      }
    })

    return NextResponse.json(
      { 
        message: 'User berhasil dibuat',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role.name
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating user:', error)
    
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