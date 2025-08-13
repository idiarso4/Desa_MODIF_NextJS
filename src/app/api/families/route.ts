/**
 * Families API Routes
 * CRUD operations for family management
 */

import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, getCurrentUser } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { SocialStatus } from '@prisma/client'

const createFamilySchema = z.object({
  familyNumber: z.string().min(1, 'Nomor KK harus diisi').max(20, 'Nomor KK maksimal 20 karakter'),
  socialStatus: z.nativeEnum(SocialStatus).default(SocialStatus.MAMPU),
  addressId: z.string().optional()
})

/**
 * GET /api/families
 * Get all families with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Check permission
    await requirePermission('families', 'read')

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const socialStatus = searchParams.get('socialStatus') || ''

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { familyNumber: { contains: search } },
        { members: { some: { name: { contains: search, mode: 'insensitive' } } } }
      ]
    }

    if (socialStatus) {
      where.socialStatus = socialStatus as SocialStatus
    }

    const [families, total] = await Promise.all([
      prisma.family.findMany({
        where,
        include: {
          members: {
            select: {
              id: true,
              nik: true,
              name: true,
              gender: true,
              birthDate: true,
              isHeadOfFamily: true
            },
            orderBy: [
              { isHeadOfFamily: 'desc' },
              { birthDate: 'asc' }
            ]
          },
          address: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.family.count({ where })
    ])

    const formattedFamilies = families.map(family => ({
      id: family.id,
      familyNumber: family.familyNumber,
      socialStatus: family.socialStatus,
      memberCount: family.members.length,
      headOfFamily: family.members.find(member => member.isHeadOfFamily) || null,
      members: family.members.map(member => ({
        id: member.id,
        nik: member.nik,
        name: member.name,
        gender: member.gender,
        age: new Date().getFullYear() - member.birthDate.getFullYear(),
        isHeadOfFamily: member.isHeadOfFamily
      })),
      address: family.address ? {
        id: family.address.id,
        street: family.address.street,
        rt: family.address.rt,
        rw: family.address.rw,
        village: family.address.village,
        district: family.address.district,
        regency: family.address.regency,
        province: family.address.province
      } : null,
      createdAt: family.createdAt.toISOString(),
      updatedAt: family.updatedAt.toISOString()
    }))

    return NextResponse.json({
      families: formattedFamilies,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error getting families:', error)
    
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
 * POST /api/families
 * Create a new family
 */
export async function POST(request: NextRequest) {
  try {
    // Check permission
    await requirePermission('families', 'create')

    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = createFamilySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validation.error.format()
        },
        { status: 400 }
      )
    }

    const data = validation.data

    // Check if family number already exists
    const existingFamily = await prisma.family.findUnique({
      where: { familyNumber: data.familyNumber }
    })

    if (existingFamily) {
      return NextResponse.json(
        { error: 'Nomor KK sudah terdaftar' },
        { status: 409 }
      )
    }

    // Check if address exists (if provided)
    if (data.addressId) {
      const address = await prisma.address.findUnique({
        where: { id: data.addressId }
      })

      if (!address) {
        return NextResponse.json(
          { error: 'Alamat tidak ditemukan' },
          { status: 400 }
        )
      }
    }

    // Create family
    const family = await prisma.family.create({
      data: {
        familyNumber: data.familyNumber,
        socialStatus: data.socialStatus,
        addressId: data.addressId
      },
      include: {
        address: true
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: currentUser.id,
        action: 'CREATE_FAMILY',
        resource: 'families',
        resourceId: family.id,
        description: `Created family: ${family.familyNumber}`,
      }
    })

    return NextResponse.json(
      { 
        message: 'Keluarga berhasil ditambahkan',
        family: {
          id: family.id,
          familyNumber: family.familyNumber,
          socialStatus: family.socialStatus
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating family:', error)
    
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