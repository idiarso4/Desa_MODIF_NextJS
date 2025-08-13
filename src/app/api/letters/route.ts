/**
 * Letter Requests API Routes
 * CRUD operations for letter request management
 */

import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, getCurrentUser } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { LetterType, RequestStatus } from '@prisma/client'

const createLetterRequestSchema = z.object({
  citizenId: z.string().min(1, 'Penduduk harus dipilih'),
  letterType: z.nativeEnum(LetterType),
  purpose: z.string().min(1, 'Keperluan harus diisi').max(500, 'Keperluan maksimal 500 karakter'),
  notes: z.string().max(1000, 'Catatan maksimal 1000 karakter').optional()
})

/**
 * GET /api/letters
 * Get all letter requests with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Check permission
    await requirePermission('letters', 'read')

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const letterType = searchParams.get('letterType') || ''

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { citizen: { name: { contains: search, mode: 'insensitive' } } },
        { citizen: { nik: { contains: search } } },
        { purpose: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (status) {
      where.status = status as RequestStatus
    }

    if (letterType) {
      where.letterType = letterType as LetterType
    }

    const [letterRequests, total] = await Promise.all([
      prisma.letterRequest.findMany({
        where,
        include: {
          citizen: {
            select: {
              id: true,
              nik: true,
              name: true,
              birthDate: true,
              gender: true,
              address: {
                select: {
                  street: true,
                  rt: true,
                  rw: true,
                  village: true
                }
              }
            }
          },
          processedBy: {
            select: {
              id: true,
              name: true,
              username: true
            }
          },
          documents: {
            select: {
              id: true,
              name: true,
              type: true,
              url: true,
              uploadedAt: true
            }
          },
          generatedLetter: {
            select: {
              id: true,
              letterNumber: true,
              pdfUrl: true,
              signedAt: true,
              signedBy: true
            }
          }
        },
        orderBy: {
          requestedAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.letterRequest.count({ where })
    ])

    const formattedRequests = letterRequests.map(request => ({
      id: request.id,
      letterType: request.letterType,
      purpose: request.purpose,
      status: request.status,
      notes: request.notes,
      citizen: {
        id: request.citizen.id,
        nik: request.citizen.nik,
        name: request.citizen.name,
        age: new Date().getFullYear() - request.citizen.birthDate.getFullYear(),
        gender: request.citizen.gender,
        address: request.citizen.address
      },
      processedBy: request.processedBy,
      documents: request.documents,
      generatedLetter: request.generatedLetter,
      requestedAt: request.requestedAt.toISOString(),
      processedAt: request.processedAt?.toISOString(),
      updatedAt: request.updatedAt.toISOString()
    }))

    return NextResponse.json({
      letterRequests: formattedRequests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error getting letter requests:', error)
    
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
 * POST /api/letters
 * Create a new letter request
 */
export async function POST(request: NextRequest) {
  try {
    // Check permission
    await requirePermission('letters', 'create')

    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = createLetterRequestSchema.safeParse(body)

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

    // Check if citizen exists
    const citizen = await prisma.citizen.findUnique({
      where: { id: data.citizenId },
      include: {
        family: true,
        address: true
      }
    })

    if (!citizen) {
      return NextResponse.json(
        { error: 'Penduduk tidak ditemukan' },
        { status: 400 }
      )
    }

    // Create letter request
    const letterRequest = await prisma.letterRequest.create({
      data: {
        citizenId: data.citizenId,
        letterType: data.letterType,
        purpose: data.purpose,
        notes: data.notes,
        status: RequestStatus.PENDING
      },
      include: {
        citizen: {
          select: {
            id: true,
            nik: true,
            name: true
          }
        }
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: currentUser.id,
        action: 'CREATE_LETTER_REQUEST',
        resource: 'letters',
        resourceId: letterRequest.id,
        description: `Created letter request: ${letterRequest.letterType} for ${citizen.name}`,
      }
    })

    return NextResponse.json(
      { 
        message: 'Permohonan surat berhasil dibuat',
        letterRequest: {
          id: letterRequest.id,
          letterType: letterRequest.letterType,
          citizen: letterRequest.citizen,
          status: letterRequest.status
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating letter request:', error)
    
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