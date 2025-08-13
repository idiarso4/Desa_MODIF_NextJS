/**
 * Complaint Tracking API
 * Allows public to track complaint status by tracking number
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validation schema
const trackComplaintSchema = z.object({
  trackingNumber: z.string().min(1, 'Nomor tracking harus diisi')
})

// POST /api/public/complaints/track - Track complaint by tracking number
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { trackingNumber } = trackComplaintSchema.parse(body)

    // Find complaint by tracking number
    const complaint = await prisma.complaint.findFirst({
      where: {
        trackingNumber: trackingNumber.toUpperCase()
      },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        priority: true,
        status: true,
        trackingNumber: true,
        submittedAt: true,
        response: true,
        respondedAt: true,
        assignedTo: {
          select: {
            name: true
          }
        },
        // Include timeline/history
        createdAt: true,
        updatedAt: true
      }
    })

    if (!complaint) {
      return NextResponse.json({
        error: 'Pengaduan tidak ditemukan',
        message: 'Nomor tracking tidak valid atau pengaduan tidak ada'
      }, { status: 404 })
    }

    // Get complaint timeline/activity history
    const timeline = await prisma.activityLog.findMany({
      where: {
        resource: 'complaint',
        resourceId: complaint.id
      },
      select: {
        action: true,
        description: true,
        createdAt: true,
        user: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    // Map status to Indonesian
    const statusMap = {
      'OPEN': 'Diterima',
      'IN_PROGRESS': 'Sedang Diproses',
      'RESOLVED': 'Selesai',
      'CLOSED': 'Ditutup',
      'REJECTED': 'Ditolak'
    }

    // Map priority to Indonesian
    const priorityMap = {
      'LOW': 'Rendah',
      'MEDIUM': 'Sedang',
      'HIGH': 'Tinggi',
      'URGENT': 'Mendesak'
    }

    // Calculate estimated resolution time based on priority
    const estimatedDays = {
      'URGENT': 1,
      'HIGH': 3,
      'MEDIUM': 7,
      'LOW': 14
    }

    const estimatedResolution = new Date(complaint.submittedAt)
    estimatedResolution.setDate(
      estimatedResolution.getDate() + estimatedDays[complaint.priority as keyof typeof estimatedDays]
    )

    // Create timeline with Indonesian descriptions
    const formattedTimeline = timeline.map(item => {
      let description = item.description
      
      // Translate common actions to Indonesian
      if (item.action === 'COMPLAINT_SUBMITTED') {
        description = 'Pengaduan diterima dan sedang menunggu review'
      } else if (item.action === 'COMPLAINT_ASSIGNED') {
        description = `Pengaduan ditugaskan kepada ${item.user?.name || 'petugas'}`
      } else if (item.action === 'COMPLAINT_IN_PROGRESS') {
        description = 'Pengaduan sedang dalam proses penanganan'
      } else if (item.action === 'COMPLAINT_RESOLVED') {
        description = 'Pengaduan telah diselesaikan'
      } else if (item.action === 'COMPLAINT_CLOSED') {
        description = 'Pengaduan ditutup'
      } else if (item.action === 'COMPLAINT_REJECTED') {
        description = 'Pengaduan ditolak'
      }

      return {
        action: item.action,
        description,
        timestamp: item.createdAt,
        user: item.user?.name
      }
    })

    // Calculate progress percentage
    const statusProgress = {
      'OPEN': 25,
      'IN_PROGRESS': 50,
      'RESOLVED': 100,
      'CLOSED': 100,
      'REJECTED': 0
    }

    const result = {
      complaint: {
        id: complaint.id,
        title: complaint.title,
        description: complaint.description,
        category: complaint.category,
        priority: priorityMap[complaint.priority as keyof typeof priorityMap],
        status: statusMap[complaint.status as keyof typeof statusMap],
        statusCode: complaint.status,
        trackingNumber: complaint.trackingNumber,
        submittedAt: complaint.submittedAt,
        response: complaint.response,
        respondedAt: complaint.respondedAt,
        assignedTo: complaint.assignedTo?.name,
        estimatedResolution,
        progress: statusProgress[complaint.status as keyof typeof statusProgress]
      },
      timeline: formattedTimeline,
      nextSteps: getNextSteps(complaint.status),
      contactInfo: {
        message: 'Untuk informasi lebih lanjut, hubungi kantor desa',
        phone: process.env.VILLAGE_PHONE || '(021) 1234-5678',
        email: process.env.VILLAGE_EMAIL || 'info@desa.go.id',
        office: 'Kantor Desa - Senin s/d Jumat, 08:00-16:00 WIB'
      }
    }

    // Log tracking activity
    await prisma.activityLog.create({
      data: {
        action: 'COMPLAINT_TRACKED',
        resource: 'complaint',
        resourceId: complaint.id,
        description: `Complaint tracked via tracking number: ${trackingNumber}`,
        ipAddress: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        userAgent: request.headers.get('user-agent') || ''
      }
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Track complaint error:', error)
    
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

// Helper function to get next steps based on status
function getNextSteps(status: string): string[] {
  switch (status) {
    case 'OPEN':
      return [
        'Pengaduan Anda telah diterima dan akan segera ditinjau',
        'Tim akan menghubungi Anda jika diperlukan informasi tambahan',
        'Estimasi waktu review: 1-2 hari kerja'
      ]
    case 'IN_PROGRESS':
      return [
        'Pengaduan sedang dalam proses penanganan',
        'Tim terkait sedang menindaklanjuti masalah Anda',
        'Anda akan diberitahu ketika ada perkembangan'
      ]
    case 'RESOLVED':
      return [
        'Pengaduan telah diselesaikan',
        'Silakan cek respon dari tim kami',
        'Jika masih ada pertanyaan, hubungi kantor desa'
      ]
    case 'CLOSED':
      return [
        'Pengaduan telah ditutup',
        'Terima kasih atas partisipasi Anda',
        'Jangan ragu untuk mengajukan pengaduan baru jika diperlukan'
      ]
    case 'REJECTED':
      return [
        'Pengaduan tidak dapat diproses',
        'Silakan cek alasan penolakan pada respon',
        'Anda dapat mengajukan pengaduan baru dengan informasi yang lebih lengkap'
      ]
    default:
      return ['Status tidak dikenali']
  }
}