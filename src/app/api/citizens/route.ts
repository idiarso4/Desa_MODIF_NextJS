/**
 * Citizens API Routes
 * CRUD operations for citizen management
 */

import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, getCurrentUser } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { Gender, Religion, Education, MaritalStatus, BloodType } from '@prisma/client'

const createCitizenSchema = z.object({
  nik: z.string().regex(/^\d{16}$/, 'NIK harus 16 digit angka'),
  name: z.string().min(1, 'Nama harus diisi').max(100, 'Nama maksimal 100 karakter'),
  birthDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Format tanggal tidak valid'),
  birthPlace: z.string().min(1, 'Tempat lahir harus diisi').max(100, 'Tempat lahir maksimal 100 karakter'),
  gender: z.nativeEnum(Gender),
  religion: z.nativeEnum(Religion),
  education: z.nativeEnum(Education),
  occupation: z.string().min(1, 'Pekerjaan harus diisi').max(100, 'Pekerjaan maksimal 100 karakter'),
  maritalStatus: z.nativeEnum(MaritalStatus),
  bloodType: z.nativeEnum(BloodType).optional(),
  familyId: z.string().optional(),
  isHeadOfFamily: z.boolean().default(false),
  addressId: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional()
})

/**
 * GET /api/citizens
 * Get all citizens with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Check permission
    await requirePermission('citizens', 'read')

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const gender = searchParams.get('gender') || ''
    const religion = searchParams.get('religion') || ''
    const familyId = searchParams.get('familyId') || ''
    const isHeadOfFamily = searchParams.get('isHeadOfFamily')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { nik: { contains: search } },
        { name: { contains: search, mode: 'insensitive' } },
        { birthPlace: { contains: search, mode: 'insensitive' } },
        { occupation: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (gender) {
      where.gender = gender as Gender
    }

    if (religion) {
      where.religion = religion as Religion
    }

    if (familyId) {
      where.familyId = familyId
    }

    if (isHeadOfFamily !== null) {
      where.isHeadOfFamily = isHeadOfFamily === 'true'
    }

    const [citizens, total] = await Promise.all([
      prisma.citizen.findMany({
        where,
        include: {
          family: true,
          address: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              username: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.citizen.count({ where })
    ])

    const formattedCitizens = citizens.map(citizen => ({
      id: citizen.id,
      nik: citizen.nik,
      name: citizen.name,
      birthDate: citizen.birthDate.toISOString().split('T')[0],
      birthPlace: citizen.birthPlace,
      gender: citizen.gender,
      religion: citizen.religion,
      education: citizen.education,
      occupation: citizen.occupation,
      maritalStatus: citizen.maritalStatus,
      bloodType: citizen.bloodType,
      isHeadOfFamily: citizen.isHeadOfFamily,
      family: citizen.family ? {
        id: citizen.family.id,
        familyNumber: citizen.family.familyNumber,
        socialStatus: citizen.family.socialStatus
      } : null,
      address: citizen.address ? {
        id: citizen.address.id,
        street: citizen.address.street,
        rt: citizen.address.rt,
        rw: citizen.address.rw,
        village: citizen.address.village,
        district: citizen.address.district,
        regency: citizen.address.regency,
        province: citizen.address.province
      } : null,
      latitude: citizen.latitude,
      longitude: citizen.longitude,
      createdBy: citizen.createdBy,
      createdAt: citizen.createdAt.toISOString(),
      updatedAt: citizen.updatedAt.toISOString()
    }))

    return NextResponse.json({
      citizens: formattedCitizens,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error getting citizens:', error)
    
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
 * POST /api/citizens
 * Create a new citizen
 */
export async function POST(request: NextRequest) {
  try {
    // Check permission
    await requirePermission('citizens', 'create')

    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = createCitizenSchema.safeParse(body)

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

    // Check if NIK already exists
    const existingCitizen = await prisma.citizen.findUnique({
      where: { nik: data.nik }
    })

    if (existingCitizen) {
      return NextResponse.json(
        { error: 'NIK sudah terdaftar' },
        { status: 409 }
      )
    }

    // Check if family exists (if provided)
    if (data.familyId) {
      const family = await prisma.family.findUnique({
        where: { id: data.familyId }
      })

      if (!family) {
        return NextResponse.json(
          { error: 'Keluarga tidak ditemukan' },
          { status: 400 }
        )
      }

      // Check if family already has a head (if this citizen is set as head)
      if (data.isHeadOfFamily) {
        const existingHead = await prisma.citizen.findFirst({
          where: {
            familyId: data.familyId,
            isHeadOfFamily: true
          }
        })

        if (existingHead) {
          return NextResponse.json(
            { error: 'Keluarga sudah memiliki kepala keluarga' },
            { status: 400 }
          )
        }
      }
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

    // Create citizen
    const citizen = await prisma.citizen.create({
      data: {
        ...data,
        birthDate: new Date(data.birthDate),
        createdById: currentUser.id
      },
      include: {
        family: true,
        address: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            username: true
          }
        }
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: currentUser.id,
        action: 'CREATE_CITIZEN',
        resource: 'citizens',
        resourceId: citizen.id,
        description: `Created citizen: ${citizen.name} (${citizen.nik})`,
      }
    })

    return NextResponse.json(
      { 
        message: 'Penduduk berhasil ditambahkan',
        citizen: {
          id: citizen.id,
          nik: citizen.nik,
          name: citizen.name,
          family: citizen.family
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating citizen:', error)
    
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