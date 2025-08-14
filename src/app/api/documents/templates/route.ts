/**
 * Document Templates API
 * Manages document templates for PDF generation
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { DocumentTemplates, TemplateType } from '@/lib/pdf/templates'

// Get all available templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as TemplateType

    // If specific type requested, return that template
    if (type && type in DocumentTemplates) {
      return NextResponse.json({
        success: true,
        data: {
          type,
          template: DocumentTemplates[type],
          metadata: getTemplateMetadata(type)
        }
      })
    }

    // Return all templates with metadata
    const templates = Object.entries(DocumentTemplates).map(([key, template]) => ({
      type: key,
      template,
      metadata: getTemplateMetadata(key as TemplateType)
    }))

    return NextResponse.json({
      success: true,
      data: templates
    })

  } catch (error) {
    console.error('Templates API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

function getTemplateMetadata(type: TemplateType) {
  const metadata = {
    domicileCertificate: {
      name: 'Surat Keterangan Domisili',
      description: 'Surat keterangan tempat tinggal warga',
      requiredFields: ['citizen', 'purpose'],
      optionalFields: ['validUntil'],
      category: 'kependudukan'
    },
    businessCertificate: {
      name: 'Surat Keterangan Usaha',
      description: 'Surat keterangan kepemilikan usaha',
      requiredFields: ['citizen', 'purpose', 'businessType', 'businessAddress'],
      optionalFields: ['businessStartDate'],
      category: 'ekonomi'
    },
    povertyLetter: {
      name: 'Surat Keterangan Tidak Mampu',
      description: 'Surat keterangan kondisi ekonomi tidak mampu',
      requiredFields: ['citizen', 'purpose'],
      optionalFields: [],
      category: 'sosial'
    }
  }

  return metadata[type] || {
    name: 'Unknown Template',
    description: 'Template tidak dikenal',
    requiredFields: [],
    optionalFields: [],
    category: 'lainnya'
  }
}
