/**
 * Letter Templates API
 * Manages letter templates for document generation
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { checkPermission } from '@/lib/rbac/server-utils'

// Validation schemas
const createTemplateSchema = z.object({
  name: z.string().min(1, 'Nama template harus diisi').max(255),
  letterType: z.enum([
    'SURAT_KETERANGAN_DOMISILI',
    'SURAT_KETERANGAN_USAHA',
    'SURAT_KETERANGAN_TIDAK_MAMPU',
    'SURAT_PENGANTAR',
    'LAINNYA'
  ]),
  template: z.string().min(1, 'Template content harus diisi'),
  variables: z.record(z.any()).default({}),
  isActive: z.boolean().default(true)
})

const updateTemplateSchema = createTemplateSchema.partial()

const querySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  search: z.string().optional(),
  letterType: z.enum([
    'SURAT_KETERANGAN_DOMISILI',
    'SURAT_KETERANGAN_USAHA',
    'SURAT_KETERANGAN_TIDAK_MAMPU',
    'SURAT_PENGANTAR',
    'LAINNYA'
  ]).optional(),
  isActive: z.string().optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined)
})

// GET /api/letters/templates - Get letter templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    const hasPermission = await checkPermission(session.user.id, 'letters', 'read')
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const query = querySchema.parse(Object.fromEntries(searchParams))

    // Build where clause
    const where: any = {}
    
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { letterType: { contains: query.search, mode: 'insensitive' } }
      ]
    }

    if (query.letterType) {
      where.letterType = query.letterType
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive
    }

    // Get total count
    const total = await prisma.letterTemplate.count({ where })

    // Get templates with pagination
    const templates = await prisma.letterTemplate.findMany({
      where,
      orderBy: [
        { isActive: 'desc' },
        { name: 'asc' }
      ],
      skip: (query.page - 1) * query.limit,
      take: query.limit
    })

    return NextResponse.json({
      templates,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit)
      }
    })

  } catch (error) {
    console.error('Get letter templates error:', error)
    
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

// POST /api/letters/templates - Create letter template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    const hasPermission = await checkPermission(session.user.id, 'letters', 'manage')
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const data = createTemplateSchema.parse(body)

    // Check for duplicate template name and type
    const existingTemplate = await prisma.letterTemplate.findFirst({
      where: {
        name: data.name,
        letterType: data.letterType
      }
    })

    if (existingTemplate) {
      return NextResponse.json({
        error: 'Template dengan nama dan jenis yang sama sudah ada'
      }, { status: 400 })
    }

    // Create template
    const template = await prisma.letterTemplate.create({
      data
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        resource: 'letter_template',
        resourceId: template.id,
        description: `Created letter template: ${template.name}`
      }
    })

    return NextResponse.json({
      message: 'Template berhasil dibuat',
      template
    }, { status: 201 })

  } catch (error) {
    console.error('Create letter template error:', error)
    
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

// PUT /api/letters/templates - Bulk update templates
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    const hasPermission = await checkPermission(session.user.id, 'letters', 'manage')
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { action, templateIds } = z.object({
      action: z.enum(['activate', 'deactivate', 'delete']),
      templateIds: z.array(z.string())
    }).parse(body)

    const results = {
      updated: 0,
      errors: [] as Array<{ id: string; error: string }>
    }

    for (const templateId of templateIds) {
      try {
        if (action === 'delete') {
          // Check if template is being used
          const usageCount = await prisma.letterRequest.count({
            where: {
              letterType: {
                in: await prisma.letterTemplate.findUnique({
                  where: { id: templateId },
                  select: { letterType: true }
                }).then(t => t ? [t.letterType] : [])
              }
            }
          })

          if (usageCount > 0) {
            results.errors.push({
              id: templateId,
              error: 'Template sedang digunakan dan tidak dapat dihapus'
            })
            continue
          }

          await prisma.letterTemplate.delete({
            where: { id: templateId }
          })
        } else {
          await prisma.letterTemplate.update({
            where: { id: templateId },
            data: { isActive: action === 'activate' }
          })
        }

        results.updated++

        // Log activity
        await prisma.activityLog.create({
          data: {
            userId: session.user.id,
            action: action.toUpperCase(),
            resource: 'letter_template',
            resourceId: templateId,
            description: `${action} letter template`
          }
        })

      } catch (error) {
        results.errors.push({
          id: templateId,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      message: 'Bulk operation completed',
      results
    })

  } catch (error) {
    console.error('Bulk update templates error:', error)
    
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