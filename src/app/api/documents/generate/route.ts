/**
 * Document Generation API
 * Handles PDF generation for various administrative documents
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { DocumentService, DocumentRequest } from '@/lib/pdf/document-service'
import { z } from 'zod'

// Validation schema for document generation request
const generateDocumentSchema = z.object({
  type: z.enum(['domicileCertificate', 'businessCertificate', 'povertyLetter']),
  citizenId: z.string().cuid(),
  purpose: z.string().min(1, 'Purpose is required').max(500, 'Purpose too long'),
  validUntil: z.string().datetime().optional(),
  additionalData: z.record(z.any()).optional(),
  options: z.object({
    format: z.enum(['A4', 'A5', 'Letter']).optional(),
    orientation: z.enum(['portrait', 'landscape']).optional(),
    margin: z.object({
      top: z.string().optional(),
      right: z.string().optional(),
      bottom: z.string().optional(),
      left: z.string().optional()
    }).optional()
  }).optional()
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = generateDocumentSchema.parse(body)

    // Prepare document request
    const documentRequest: DocumentRequest = {
      type: validatedData.type,
      citizenId: validatedData.citizenId,
      purpose: validatedData.purpose,
      validUntil: validatedData.validUntil ? new Date(validatedData.validUntil) : undefined,
      additionalData: validatedData.additionalData,
      options: validatedData.options
    }

    // Generate document
    const generatedDocument = await DocumentService.generate(documentRequest)

    // Return PDF as response
    return new NextResponse(generatedDocument.buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${generatedDocument.filename}"`,
        'Content-Length': generatedDocument.buffer.length.toString(),
        'X-Document-Type': generatedDocument.metadata.type,
        'X-Document-Number': generatedDocument.metadata.documentNumber,
        'X-Citizen-Name': generatedDocument.metadata.citizenName
      }
    })

  } catch (error) {
    console.error('Document generation error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: error.errors
        },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Preview endpoint - returns base64 encoded PDF for preview
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
    const type = searchParams.get('type') as any
    const citizenId = searchParams.get('citizenId')
    const purpose = searchParams.get('purpose') || 'Preview'

    if (!type || !citizenId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Validate parameters
    const validatedData = generateDocumentSchema.parse({
      type,
      citizenId,
      purpose
    })

    // Generate document for preview
    const documentRequest: DocumentRequest = {
      type: validatedData.type,
      citizenId: validatedData.citizenId,
      purpose: validatedData.purpose
    }

    const generatedDocument = await DocumentService.generate(documentRequest)

    // Return base64 encoded PDF for preview
    const base64PDF = generatedDocument.buffer.toString('base64')

    return NextResponse.json({
      success: true,
      data: {
        pdf: base64PDF,
        filename: generatedDocument.filename,
        metadata: generatedDocument.metadata
      }
    })

  } catch (error) {
    console.error('Document preview error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate preview' },
      { status: 500 }
    )
  }
}
