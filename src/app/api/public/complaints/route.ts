/**
 * Public Complaints API
 * Handles public complaint submissions and tracking
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { nanoid } from 'nanoid'

// Validation schemas
const createComplaintSchema = z.object({
  title: z.string().min(5, 'Judul minimal 5 karakter').max(200, 'Judul maksimal 200 karakter'),
  description: z.string().min(20, 'Deskripsi minimal 20 karakter').max(2000, 'Deskripsi maksimal 2000 karakter'),
  category: z.string().min(1, 'Kategori harus dipilih').max(100),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  submitterName: z.string().min(2, 'Nama minimal 2 karakter').max(100, 'Nama maksimal 100 karakter'),
  submitterEmail: z.string().email('Format email tidak valid').optional(),
  submitterPhone: z.string().min(10, 'Nomor telepon minimal 10 digit').max(15, 'Nomor telepon maksimal 15 digit').optional(),
  submitterAddress: z.string().max(500, 'Alamat maksimal 500 karakter').optional(),
  isAnonymous: z.boolean().default(false),
  attachments: z.array(z.string()).optional().default([])
})

const trackComplaintSchema = z.object({
  trackingNumber: z.string().min(1, 'Nomor tracking harus diisi')
})

const querySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  category: z.string().optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  search: z.string().optional()
})

// Generate tracking number
function generateTrackingNumber(): string {
  const prefix = 'ADU'
  const timestamp = Date.now().toString().slice(-6)
  const random = nanoid(4).toUpperCase()
  return `${prefix}${timestamp}${random}`
}

// POST /api/public/complaints - Submit new complaint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createComplaintSchema.parse(body)

    // Generate tracking number
    const trackingNumber = generateTrackingNumber()

    // Create complaint
    const complaint = await prisma.complaint.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority,
        status: 'OPEN',
        submitterName: data.isAnonymous ? 'Anonim' : data.submitterName,
        submitterEmail: data.isAnonymous ? null : data.submitterEmail,
        submitterPhone: data.isAnonymous ? null : data.submitterPhone,
        submitterAddress: data.isAnonymous ? null : data.submitterAddress,
        trackingNumber,
        isAnonymous: data.isAnonymous,
        attachments: data.attachments || [],
        submittedAt: new Date()
      }
    })

    // Create activity log for complaint submission
    await prisma.activityLog.create({
      data: {
        action: 'COMPLAINT_SUBMITTED',
        resource: 'complaint',
        resourceId: complaint.id,
        description: `New complaint submitted: ${complaint.title}`,
        ipAddress: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        userAgent: request.headers.get('user-agent') || ''
      }
    })

    // Send notification to administrators (in a real app, this would be async)
    try {
      // Find users with complaint management permission
      const adminUsers = await prisma.user.findMany({
        where: {
          isActive: true,
          role: {
            permissions: {
              some: {
                resource: 'complaints',
                action: 'read'
              }
            }
          }
        }
      })

      // Create notifications for admins
      for (const admin of adminUsers) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            title: 'Pengaduan Baru',
            message: `Pengaduan baru "${complaint.title}" telah diterima`,
            type: 'INFO',
            data: {
              complaintId: complaint.id,
              trackingNumber: complaint.trackingNumber,
              category: complaint.category,
              priority: complaint.priority
            }
          }
        })
      }
    } catch (notificationError) {
      console.error('Failed to send notifications:', notificationError)
      // Don't fail the complaint submission if notifications fail
    }

    return NextResponse.json({
      message: 'Pengaduan berhasil dikirim',
      trackingNumber: complaint.trackingNumber,
      complaint: {
        id: complaint.id,
        title: complaint.title,
        category: complaint.category,
        priority: complaint.priority,
        status: complaint.status,
        trackingNumber: complaint.trackingNumber,
        submittedAt: complaint.submittedAt
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Submit complaint error:', error)
    
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

// GET /api/public/complaints - Get public complaints (for transparency)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = querySchema.parse(Object.fromEntries(searchParams))

    // Build where clause (only show resolved complaints for transparency)
    const where: any = {
      status: { in: ['RESOLVED', 'CLOSED'] }, // Only show resolved complaints publicly
      isAnonymous: false // Don't show anonymous complaints publicly
    }
    
    if (query.category) {
      where.category = { contains: query.category, mode: 'insensitive' }
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { category: { contains: query.search, mode: 'insensitive' } }
      ]
    }

    // Get total count
    const total = await prisma.complaint.count({ where })

    // Get complaints with pagination
    const complaints = await prisma.complaint.findMany({
      where,
      select: {
        id: true,
        title: true,
        category: true,
        priority: true,
        status: true,
        submittedAt: true,
        resolvedAt: true,
        response: true,
        // Don't include personal information
        submitterName: false,
        submitterEmail: false,
        submitterPhone: false,
        submitterAddress: false,
        description: false
      },
      orderBy: { submittedAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit
    })

    // Get statistics
    const statistics = await prisma.complaint.groupBy({
      by: ['status'],
      where: {
        submittedAt: {
          gte: new Date(new Date().getFullYear(), 0, 1) // This year
        }
      },
      _count: true
    })

    const stats = {
      thisYear: statistics.reduce((acc, stat) => acc + stat._count, 0),
      resolved: statistics.find(s => s.status === 'RESOLVED')?._count || 0,
      inProgress: statistics.find(s => s.status === 'IN_PROGRESS')?._count || 0,
      open: statistics.find(s => s.status === 'OPEN')?._count || 0
    }

    return NextResponse.json({
      complaints,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit)
      },
      statistics: stats
    })

  } catch (error) {
    console.error('Get public complaints error:', error)
    
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