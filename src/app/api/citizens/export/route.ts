/**
 * Citizen Export API Route
 * Export citizen data to various formats
 */

import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, getCurrentUser } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'

/**
 * GET /api/citizens/export
 * Export citizen data to CSV format
 */
export async function GET(request: NextRequest) {
  try {
    // Check permission
    await requirePermission('citizens', 'export')

    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
    const gender = searchParams.get('gender') || ''
    const religion = searchParams.get('religion') || ''
    const familyId = searchParams.get('familyId') || ''

    // Build where clause
    const where: any = {}

    if (gender) {
      where.gender = gender
    }

    if (religion) {
      where.religion = religion
    }

    if (familyId) {
      where.familyId = familyId
    }

    // Get citizens data
    const citizens = await prisma.citizen.findMany({
      where,
      include: {
        family: true,
        address: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    if (format === 'csv') {
      // Generate CSV content
      const headers = [
        'NIK',
        'Nama',
        'Tempat Lahir',
        'Tanggal Lahir',
        'Jenis Kelamin',
        'Agama',
        'Pendidikan',
        'Pekerjaan',
        'Status Kawin',
        'Golongan Darah',
        'Nomor KK',
        'Status dalam Keluarga',
        'Alamat',
        'RT',
        'RW',
        'Desa',
        'Kecamatan',
        'Kabupaten',
        'Provinsi'
      ]

      const csvRows = [
        headers.join(','),
        ...citizens.map(citizen => [
          citizen.nik,
          `"${citizen.name}"`,
          `"${citizen.birthPlace}"`,
          citizen.birthDate.toISOString().split('T')[0],
          citizen.gender === 'L' ? 'Laki-laki' : 'Perempuan',
          citizen.religion,
          citizen.education,
          `"${citizen.occupation}"`,
          citizen.maritalStatus,
          citizen.bloodType || '',
          citizen.family?.familyNumber || '',
          citizen.isHeadOfFamily ? 'Kepala Keluarga' : 'Anggota Keluarga',
          `"${citizen.address?.street || ''}"`,
          citizen.address?.rt || '',
          citizen.address?.rw || '',
          citizen.address?.village || '',
          citizen.address?.district || '',
          citizen.address?.regency || '',
          citizen.address?.province || ''
        ].join(','))
      ]

      const csvContent = csvRows.join('\n')

      // Log export activity
      await prisma.activityLog.create({
        data: {
          userId: currentUser.id,
          action: 'EXPORT_CITIZENS',
          resource: 'citizens',
          description: `Exported ${citizens.length} citizens to CSV`,
        }
      })

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="data-penduduk-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    // For JSON format
    const formattedCitizens = citizens.map(citizen => ({
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
        familyNumber: citizen.family.familyNumber,
        socialStatus: citizen.family.socialStatus
      } : null,
      address: citizen.address ? {
        street: citizen.address.street,
        rt: citizen.address.rt,
        rw: citizen.address.rw,
        village: citizen.address.village,
        district: citizen.address.district,
        regency: citizen.address.regency,
        province: citizen.address.province
      } : null
    }))

    // Log export activity
    await prisma.activityLog.create({
      data: {
        userId: currentUser.id,
        action: 'EXPORT_CITIZENS',
        resource: 'citizens',
        description: `Exported ${citizens.length} citizens to JSON`,
      }
    })

    return NextResponse.json({
      citizens: formattedCitizens,
      total: formattedCitizens.length,
      exportedAt: new Date().toISOString(),
      exportedBy: currentUser.name
    })
  } catch (error) {
    console.error('Error exporting citizens:', error)
    
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