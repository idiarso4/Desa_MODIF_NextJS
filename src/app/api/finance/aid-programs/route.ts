/**
 * Aid Programs API Routes
 * CRUD operations for aid program management
 */

import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, getCurrentUser } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { ProgramStatus } from '@prisma/client'

const createAidProgramSchema = z.object({
  name: z.string().min(1, 'Nama program harus diisi').max(200, 'Nama program maksimal 200 karakter'),
  description: z.string().max(1000, 'Deskripsi maksimal 1000 karakter').optional(),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Format tanggal mulai tidak valid'),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Format tanggal selesai tidak valid').optional(),
  budget: z.number().positive('Anggaran harus lebih dari 0').optional(),
  criteria: z.string().min(1, 'Kriteria penerima harus diisi').max(1000, 'Kriteria maksimal 1000 karakter')
})

/**
 * GET /api/finance/aid-programs
 * Get all aid programs with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Check permission
    await requirePermission('finance', 'read')

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const search = searchParams.get('search') || ''

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (status) {
      where.status = status as ProgramStatus
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { criteria: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [aidPrograms, total] = await Promise.all([
      prisma.aidProgram.findMany({
        where,
        include: {
          recipients: {
            include: {
              citizen: {
                select: {
                  id: true,
                  nik: true,
                  name: true,
                  gender: true
                }
              }
            }
          },
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
      prisma.aidProgram.count({ where })
    ])

    const formattedPrograms = aidPrograms.map(program => ({
      id: program.id,
      name: program.name,
      description: program.description,
      startDate: program.startDate.toISOString().split('T')[0],
      endDate: program.endDate?.toISOString().split('T')[0],
      budget: program.budget ? Number(program.budget) : null,
      criteria: program.criteria,
      status: program.status,
      recipientCount: program.recipients.length,
      eligibleCount: program.recipients.filter(r => r.status === 'ELIGIBLE').length,
      receivedCount: program.recipients.filter(r => r.status === 'RECEIVED').length,
      totalDistributed: program.recipients
        .filter(r => r.status === 'RECEIVED' && r.amount)
        .reduce((sum, r) => sum + Number(r.amount || 0), 0),
      createdBy: program.createdBy,
      createdAt: program.createdAt.toISOString(),
      updatedAt: program.updatedAt.toISOString()
    }))

    return NextResponse.json({
      aidPrograms: formattedPrograms,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error getting aid programs:', error)
    
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
 * POST /api/finance/aid-programs
 * Create a new aid program
 */
export async function POST(request: NextRequest) {
  try {
    // Check permission
    await requirePermission('finance', 'create')

    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = createAidProgramSchema.safeParse(body)

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

    // Validate date range
    const startDate = new Date(data.startDate)
    const endDate = data.endDate ? new Date(data.endDate) : null

    if (endDate && endDate <= startDate) {
      return NextResponse.json(
        { error: 'Tanggal selesai harus setelah tanggal mulai' },
        { status: 400 }
      )
    }

    // Create aid program
    const aidProgram = await prisma.aidProgram.create({
      data: {
        name: data.name,
        description: data.description,
        startDate: startDate,
        endDate: endDate,
        budget: data.budget,
        criteria: data.criteria,
        status: ProgramStatus.ACTIVE,
        createdById: currentUser.id
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: currentUser.id,
        action: 'CREATE_AID_PROGRAM',
        resource: 'finance',
        resourceId: aidProgram.id,
        description: `Created aid program: ${aidProgram.name}`,
      }
    })

    return NextResponse.json(
      { 
        message: 'Program bantuan berhasil dibuat',
        aidProgram: {
          id: aidProgram.id,
          name: aidProgram.name,
          status: aidProgram.status,
          startDate: aidProgram.startDate.toISOString().split('T')[0]
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating aid program:', error)
    
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