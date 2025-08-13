/**
 * Bulk Citizen Operations API
 * Handles bulk operations for citizen data
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { checkPermission } from '@/lib/rbac/server-utils'

// Validation schemas
const bulkCreateSchema = z.object({
  citizens: z.array(z.object({
    nik: z.string().length(16).regex(/^\d+$/, 'NIK harus berupa 16 digit angka'),
    name: z.string().min(1, 'Nama harus diisi').max(100),
    birthDate: z.string().transform(str => new Date(str)),
    birthPlace: z.string().min(1, 'Tempat lahir harus diisi').max(100),
    gender: z.enum(['L', 'P']),
    religion: z.enum(['ISLAM', 'KRISTEN', 'KATOLIK', 'HINDU', 'BUDDHA', 'KONGHUCU']),
    education: z.enum(['TIDAK_SEKOLAH', 'SD', 'SMP', 'SMA', 'D1', 'D2', 'D3', 'S1', 'S2', 'S3']),
    occupation: z.string().max(100),
    maritalStatus: z.enum(['BELUM_KAWIN', 'KAWIN', 'CERAI_HIDUP', 'CERAI_MATI']),
    bloodType: z.enum(['A', 'B', 'AB', 'O']).optional(),
    familyId: z.string().optional(),
    isHeadOfFamily: z.boolean().default(false),
    addressId: z.string().optional()
  }))
})

const bulkUpdateSchema = z.object({
  updates: z.array(z.object({
    id: z.string(),
    data: z.object({
      name: z.string().min(1).max(100).optional(),
      birthDate: z.string().transform(str => new Date(str)).optional(),
      birthPlace: z.string().min(1).max(100).optional(),
      gender: z.enum(['L', 'P']).optional(),
      religion: z.enum(['ISLAM', 'KRISTEN', 'KATOLIK', 'HINDU', 'BUDDHA', 'KONGHUCU']).optional(),
      education: z.enum(['TIDAK_SEKOLAH', 'SD', 'SMP', 'SMA', 'D1', 'D2', 'D3', 'S1', 'S2', 'S3']).optional(),
      occupation: z.string().max(100).optional(),
      maritalStatus: z.enum(['BELUM_KAWIN', 'KAWIN', 'CERAI_HIDUP', 'CERAI_MATI']).optional(),
      bloodType: z.enum(['A', 'B', 'AB', 'O']).optional(),
      familyId: z.string().optional(),
      isHeadOfFamily: z.boolean().optional(),
      addressId: z.string().optional()
    })
  }))
})

const bulkDeleteSchema = z.object({
  ids: z.array(z.string())
})

// POST /api/citizens/bulk - Bulk create citizens
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    const hasPermission = await checkPermission(session.user.id, 'citizens', 'create')
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { citizens } = bulkCreateSchema.parse(body)

    const results = {
      created: 0,
      skipped: 0,
      errors: [] as Array<{ nik: string; error: string }>
    }

    // Process each citizen
    for (const citizenData of citizens) {
      try {
        // Check if NIK already exists
        const existingCitizen = await prisma.citizen.findUnique({
          where: { nik: citizenData.nik }
        })

        if (existingCitizen) {
          results.skipped++
          results.errors.push({
            nik: citizenData.nik,
            error: 'NIK sudah terdaftar'
          })
          continue
        }

        // Validate family reference if provided
        if (citizenData.familyId) {
          const family = await prisma.family.findUnique({
            where: { id: citizenData.familyId }
          })
          if (!family) {
            results.errors.push({
              nik: citizenData.nik,
              error: 'Family ID tidak valid'
            })
            continue
          }
        }

        // Validate address reference if provided
        if (citizenData.addressId) {
          const address = await prisma.address.findUnique({
            where: { id: citizenData.addressId }
          })
          if (!address) {
            results.errors.push({
              nik: citizenData.nik,
              error: 'Address ID tidak valid'
            })
            continue
          }
        }

        // Create citizen
        await prisma.citizen.create({
          data: {
            ...citizenData,
            createdById: session.user.id
          }
        })

        results.created++

        // Log activity
        await prisma.activityLog.create({
          data: {
            userId: session.user.id,
            action: 'CREATE',
            resource: 'citizen',
            resourceId: citizenData.nik,
            description: `Bulk created citizen: ${citizenData.name}`
          }
        })

      } catch (error) {
        results.errors.push({
          nik: citizenData.nik,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      message: 'Bulk operation completed',
      results
    })

  } catch (error) {
    console.error('Bulk create citizens error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation error',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// PUT /api/citizens/bulk - Bulk update citizens
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    const hasPermission = await checkPermission(session.user.id, 'citizens', 'update')
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { updates } = bulkUpdateSchema.parse(body)

    const results = {
      updated: 0,
      skipped: 0,
      errors: [] as Array<{ id: string; error: string }>
    }

    // Process each update
    for (const update of updates) {
      try {
        // Check if citizen exists
        const existingCitizen = await prisma.citizen.findUnique({
          where: { id: update.id }
        })

        if (!existingCitizen) {
          results.skipped++
          results.errors.push({
            id: update.id,
            error: 'Citizen not found'
          })
          continue
        }

        // Update citizen
        await prisma.citizen.update({
          where: { id: update.id },
          data: update.data
        })

        results.updated++

        // Log activity
        await prisma.activityLog.create({
          data: {
            userId: session.user.id,
            action: 'UPDATE',
            resource: 'citizen',
            resourceId: update.id,
            description: `Bulk updated citizen: ${existingCitizen.name}`
          }
        })

      } catch (error) {
        results.errors.push({
          id: update.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      message: 'Bulk update completed',
      results
    })

  } catch (error) {
    console.error('Bulk update citizens error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation error',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// DELETE /api/citizens/bulk - Bulk delete citizens
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    const hasPermission = await checkPermission(session.user.id, 'citizens', 'delete')
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { ids } = bulkDeleteSchema.parse(body)

    const results = {
      deleted: 0,
      skipped: 0,
      errors: [] as Array<{ id: string; error: string }>
    }

    // Process each deletion
    for (const id of ids) {
      try {
        // Check if citizen exists
        const existingCitizen = await prisma.citizen.findUnique({
          where: { id },
          include: {
            documents: true,
            letterRequests: true
          }
        })

        if (!existingCitizen) {
          results.skipped++
          results.errors.push({
            id,
            error: 'Citizen not found'
          })
          continue
        }

        // Check for dependencies
        if (existingCitizen.documents.length > 0 || existingCitizen.letterRequests.length > 0) {
          results.errors.push({
            id,
            error: 'Cannot delete citizen with existing documents or letter requests'
          })
          continue
        }

        // Delete citizen
        await prisma.citizen.delete({
          where: { id }
        })

        results.deleted++

        // Log activity
        await prisma.activityLog.create({
          data: {
            userId: session.user.id,
            action: 'DELETE',
            resource: 'citizen',
            resourceId: id,
            description: `Bulk deleted citizen: ${existingCitizen.name}`
          }
        })

      } catch (error) {
        results.errors.push({
          id,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      message: 'Bulk delete completed',
      results
    })

  } catch (error) {
    console.error('Bulk delete citizens error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation error',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}