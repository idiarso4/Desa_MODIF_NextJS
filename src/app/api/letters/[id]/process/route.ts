/**
 * Letter Request Processing API Route
 * Process letter requests (approve/reject)
 */

import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, getCurrentUser } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { RequestStatus } from '@prisma/client'

const processLetterSchema = z.object({
  status: z.nativeEnum(RequestStatus),
  notes: z.string().max(1000, 'Catatan maksimal 1000 karakter').optional(),
  generateLetter: z.boolean().default(false)
})

/**
 * POST /api/letters/[id]/process
 * Process letter request
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check permission
    await requirePermission('letters', 'process')

    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = processLetterSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validation.error.format()
        },
        { status: 400 }
      )
    }

    const { status, notes, generateLetter } = validation.data

    // Check if letter request exists
    const letterRequest = await prisma.letterRequest.findUnique({
      where: { id: params.id },
      include: {
        citizen: {
          include: {
            family: true,
            address: true
          }
        }
      }
    })

    if (!letterRequest) {
      return NextResponse.json(
        { error: 'Permohonan surat tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check if already processed
    if (letterRequest.status !== RequestStatus.PENDING) {
      return NextResponse.json(
        { error: 'Permohonan surat sudah diproses sebelumnya' },
        { status: 400 }
      )
    }

    // Update letter request status
    const updatedRequest = await prisma.letterRequest.update({
      where: { id: params.id },
      data: {
        status,
        notes,
        processedById: currentUser.id,
        processedAt: new Date()
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

    // Generate letter if approved and requested
    let generatedLetter = null
    if (status === RequestStatus.SELESAI && generateLetter) {
      // Generate letter number
      const letterNumber = await generateLetterNumber(letterRequest.letterType)
      
      // Create generated letter record
      generatedLetter = await prisma.generatedLetter.create({
        data: {
          letterRequestId: params.id,
          letterNumber,
          content: await generateLetterContent(letterRequest),
          signedBy: currentUser.name
        }
      })
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: currentUser.id,
        action: 'PROCESS_LETTER_REQUEST',
        resource: 'letters',
        resourceId: params.id,
        description: `Processed letter request: ${letterRequest.letterType} for ${letterRequest.citizen.name} - Status: ${status}`,
      }
    })

    return NextResponse.json({
      message: `Permohonan surat berhasil ${status === RequestStatus.SELESAI ? 'disetujui' : status === RequestStatus.DITOLAK ? 'ditolak' : 'diproses'}`,
      letterRequest: {
        id: updatedRequest.id,
        status: updatedRequest.status,
        citizen: updatedRequest.citizen,
        processedAt: updatedRequest.processedAt
      },
      ...(generatedLetter && { generatedLetter })
    })
  } catch (error) {
    console.error('Error processing letter request:', error)
    
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
 * Generate letter number based on type and current date
 */
async function generateLetterNumber(letterType: string): Promise<string> {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  
  // Get count of letters this month
  const startOfMonth = new Date(year, now.getMonth(), 1)
  const endOfMonth = new Date(year, now.getMonth() + 1, 0)
  
  const count = await prisma.generatedLetter.count({
    where: {
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth
      },
      letterRequest: {
        letterType: letterType as any
      }
    }
  })
  
  const sequence = String(count + 1).padStart(3, '0')
  
  // Format: 001/SK-DOM/XII/2024 (for SURAT_KETERANGAN_DOMISILI)
  const typeCode = getLetterTypeCode(letterType)
  const monthRoman = getMonthRoman(now.getMonth() + 1)
  
  return `${sequence}/${typeCode}/${monthRoman}/${year}`
}

/**
 * Get letter type code for numbering
 */
function getLetterTypeCode(letterType: string): string {
  const codes: Record<string, string> = {
    'SURAT_KETERANGAN_DOMISILI': 'SK-DOM',
    'SURAT_KETERANGAN_USAHA': 'SK-USH',
    'SURAT_KETERANGAN_TIDAK_MAMPU': 'SK-TM',
    'SURAT_PENGANTAR': 'SP',
    'LAINNYA': 'SK'
  }
  return codes[letterType] || 'SK'
}

/**
 * Get month in Roman numerals
 */
function getMonthRoman(month: number): string {
  const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
  return romans[month - 1]
}

/**
 * Generate letter content based on template
 */
async function generateLetterContent(letterRequest: any): Promise<string> {
  const citizen = letterRequest.citizen
  const letterType = letterRequest.letterType
  
  // This is a simplified template - in production you'd have proper templates
  const templates: Record<string, string> = {
    'SURAT_KETERANGAN_DOMISILI': `
      SURAT KETERANGAN DOMISILI
      
      Yang bertanda tangan di bawah ini, Kepala Desa [NAMA_DESA], Kecamatan [NAMA_KECAMATAN], 
      Kabupaten [NAMA_KABUPATEN], dengan ini menerangkan bahwa:
      
      Nama                : ${citizen.name}
      NIK                 : ${citizen.nik}
      Tempat, Tgl Lahir   : ${citizen.birthPlace}, ${new Date(citizen.birthDate).toLocaleDateString('id-ID')}
      Jenis Kelamin       : ${citizen.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
      Agama               : ${citizen.religion}
      Pekerjaan           : ${citizen.occupation}
      Alamat              : ${citizen.address?.street || ''}, RT ${citizen.address?.rt || ''}/RW ${citizen.address?.rw || ''}
      
      Adalah benar-benar penduduk yang berdomisili di wilayah kami.
      
      Surat keterangan ini dibuat untuk keperluan: ${letterRequest.purpose}
      
      Demikian surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.
    `,
    'SURAT_KETERANGAN_USAHA': `
      SURAT KETERANGAN USAHA
      
      Yang bertanda tangan di bawah ini, Kepala Desa [NAMA_DESA], dengan ini menerangkan bahwa:
      
      Nama                : ${citizen.name}
      NIK                 : ${citizen.nik}
      Alamat              : ${citizen.address?.street || ''}, RT ${citizen.address?.rt || ''}/RW ${citizen.address?.rw || ''}
      
      Adalah benar-benar warga kami yang memiliki usaha di wilayah desa kami.
      
      Keperluan: ${letterRequest.purpose}
    `
  }
  
  return templates[letterType] || `Surat keterangan untuk ${citizen.name} dengan keperluan: ${letterRequest.purpose}`
}