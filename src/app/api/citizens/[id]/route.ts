/**
 * Citizen Detail API Routes
 * Individual citizen operations (GET, PUT, DELETE)
 */

import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, getCurrentUser } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { Gender, Religion, Education, MaritalStatus, BloodType } from '@prisma/client'

const updateCitizenSchema = z.object({
  name: z.string().min(1, 'Nama harus diisi').max(100, 'Nama maksimal 100 karakter').optional(),
  birthDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Format tanggal tidak valid').optional(),
  birthPlace: z.string().min(1, 'Tempat lahir harus diisi').max(100, 'Tempat lahir maksimal 100 karakter').optional(),
  gender: z.nativeEnum(Gender).optional(),
  religion: z.nativeEnum(Religion).optional(),
  education: z.nativeEnum(Education).optional(),
  occupation: z.string().min(1, 'Pekerjaan harus diisi').max(100, 'Pekerjaan maksimal 100 karakter').optional(),
  maritalStatus: z.nativeEnum(MaritalStatus).optional(),
  bloodType: z.nativeEnum(BloodType).optional(),
  familyId: z.string().optional(),
  isHeadOfFamily: z.boolean().optional(),
  addressId: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional()
})

/**
 * GET /api/citizens/[id]
 * Get citizen by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check permission
    await requirePermission('citizens', 'read')

    const citizen = await prisma.citizen.findUnique({
      where: { id: params.id },
      include: {
        family: {
          include: {
            members: {
              select: {
                id: true,
                nik: true,
                name: true,
                isHeadOfFamily: true,
                gender: true,
                birthDate: true
              }
            }
          }
        },
        address: true,
        documents: true,
        letterRequests: {
          include: {
            processedBy: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            requestedAt: 'desc'
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            username: true
          }
        }
      }
    })

    if (!citizen) {
      return NextResponse.json(
        { error: 'Penduduk tidak ditemukan' },
        { status: 404 }
      )
    }

    const formattedCitizen = {
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
        socialStatus: citizen.family.socialStatus,
        members: citizen.family.members.map(member => ({
          id: member.id,
          nik: member.nik,
          name: member.name,
          isHeadOfFamily: member.isHeadOfFamily,
          gender: member.gender,
          age: new Date().getFullYear() - member.birthDate.getFullYear()
        }))
      } : null,
      address: citizen.address ? {
        id: citizen.address.id,
        street: citizen.address.street,
        rt: citizen.address.rt,
        rw: citizen.address.rw,
        village: citizen.address.village,
        district: citizen.address.district,
        regency: citizen.address.regency,
        province: citizen.address.province,
        postalCode: citizen.address.postalCode
      } : null,
      documents: citizen.documents.map(doc => ({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        url: doc.url,
        uploadedAt: doc.uploadedAt.toISOString()
      })),
      letterRequests: citizen.letterRequests.map(request => ({
        id: request.id,
        letterType: request.letterType,
        purpose: request.purpose,
        status: request.status,
        processedBy: request.processedBy,
        requestedAt: request.requestedAt.toISOString(),
        processedAt: request.processedAt?.toISOString()
      })),
      latitude: citizen.latitude,
      longitude: citizen.longitude,
      createdBy: citizen.createdBy,
      createdAt: citizen.createdAt.toISOString(),
      updatedAt: citizen.updatedAt.toISOString()
    }

    return NextResponse.json({ citizen: formattedCitizen })
  } catch (error) {
    console.error('Error getting citizen:', error)
    
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
 * PUT /api/citizens/[id]
 * Update citizen
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check permission
    await requirePermission('citizens', 'update')

    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = updateCitizenSchema.safeParse(body)

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

    // Check if citizen exists
    const existingCitizen = await prisma.citizen.findUnique({
      where: { id: params.id },
      include: { family: true }
    })

    if (!existingCitizen) {
      return NextResponse.json(
        { error: 'Penduduk tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check family constraints if changing family or head status
    if (updateData.familyId || updateData.isHeadOfFamily !== undefined) {
      const targetFamilyId = updateData.familyId || existingCitizen.familyId
      const willBeHead = updateData.isHeadOfFamily !== undefined 
        ? updateData.isHeadOfFamily 
        : existingCitizen.isHeadOfFamily

      if (targetFamilyId && willBeHead) {
        // Check if family already has a head (excluding current citizen)
        const existingHead = await prisma.citizen.findFirst({
          where: {
            familyId: targetFamilyId,
            isHeadOfFamily: true,
            id: { not: params.id }
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

    // Check if family exists (if changing family)
    if (updateData.familyId) {
      const family = await prisma.family.findUnique({
        where: { id: updateData.familyId }
      })

      if (!family) {
        return NextResponse.json(
          { error: 'Keluarga tidak ditemukan' },
          { status: 400 }
        )
      }
    }

    // Check if address exists (if changing address)
    if (updateData.addressId) {
      const address = await prisma.address.findUnique({
        where: { id: updateData.addressId }
      })

      if (!address) {
        return NextResponse.json(
          { error: 'Alamat tidak ditemukan' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const finalUpdateData: any = { ...updateData }
    if (updateData.birthDate) {
      finalUpdateData.birthDate = new Date(updateData.birthDate)
    }

    // Update citizen
    const updatedCitizen = await prisma.citizen.update({
      where: { id: params.id },
      data: finalUpdateData,
      include: {
        family: true,
        address: true
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: currentUser.id,
        action: 'UPDATE_CITIZEN',
        resource: 'citizens',
        resourceId: params.id,
        description: `Updated citizen: ${updatedCitizen.name} (${updatedCitizen.nik})`,
      }
    })

    return NextResponse.json({
      message: 'Data penduduk berhasil diperbarui',
      citizen: {
        id: updatedCitizen.id,
        nik: updatedCitizen.nik,
        name: updatedCitizen.name,
        family: updatedCitizen.family
      }
    })
  } catch (error) {
    console.error('Error updating citizen:', error)
    
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
 * DELETE /api/citizens/[id]
 * Delete citizen
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check permission
    await requirePermission('citizens', 'delete')

    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check if citizen exists
    const citizen = await prisma.citizen.findUnique({
      where: { id: params.id },
      include: {
        letterRequests: true,
        documents: true
      }
    })

    if (!citizen) {
      return NextResponse.json(
        { error: 'Penduduk tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check if citizen has related data that prevents deletion
    if (citizen.letterRequests.length > 0) {
      return NextResponse.json(
        { error: 'Tidak dapat menghapus penduduk yang memiliki riwayat permohonan surat' },
        { status: 400 }
      )
    }

    // Delete related documents first
    if (citizen.documents.length > 0) {
      await prisma.document.deleteMany({
        where: { citizenId: params.id }
      })
    }

    // Delete citizen
    await prisma.citizen.delete({
      where: { id: params.id }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: currentUser.id,
        action: 'DELETE_CITIZEN',
        resource: 'citizens',
        resourceId: params.id,
        description: `Deleted citizen: ${citizen.name} (${citizen.nik})`,
      }
    })

    return NextResponse.json({
      message: 'Penduduk berhasil dihapus'
    })
  } catch (error) {
    console.error('Error deleting citizen:', error)
    
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