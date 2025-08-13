/**
 * Reports API Routes
 * Generate various administrative reports
 */

import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, getCurrentUser } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'

/**
 * GET /api/reports
 * Get available report types and basic statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Check permission
    await requirePermission('reports', 'read')

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const format = searchParams.get('format') || 'json'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (type) {
      return await generateSpecificReport(type, format, startDate, endDate)
    }

    // Return available report types
    const reportTypes = [
      {
        id: 'population',
        name: 'Laporan Kependudukan',
        description: 'Statistik dan data penduduk',
        categories: ['demographic', 'population']
      },
      {
        id: 'letters',
        name: 'Laporan Surat Menyurat',
        description: 'Statistik permohonan dan penerbitan surat',
        categories: ['administrative', 'letters']
      },
      {
        id: 'families',
        name: 'Laporan Keluarga',
        description: 'Data dan statistik keluarga',
        categories: ['demographic', 'families']
      },
      {
        id: 'activities',
        name: 'Laporan Aktivitas Sistem',
        description: 'Log aktivitas pengguna sistem',
        categories: ['system', 'activities']
      }
    ]

    // Get basic statistics
    const [
      totalCitizens,
      totalFamilies,
      totalLetters,
      pendingLetters,
      recentActivities
    ] = await Promise.all([
      prisma.citizen.count(),
      prisma.family.count(),
      prisma.letterRequest.count(),
      prisma.letterRequest.count({ where: { status: 'PENDING' } }),
      prisma.activityLog.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      })
    ])

    return NextResponse.json({
      reportTypes,
      summary: {
        totalCitizens,
        totalFamilies,
        totalLetters,
        pendingLetters,
        recentActivities
      },
      availableFormats: ['json', 'csv', 'pdf'],
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error getting reports:', error)
    
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
 * Generate specific report based on type
 */
async function generateSpecificReport(
  type: string,
  format: string,
  startDate?: string | null,
  endDate?: string | null
) {
  const currentUser = await getCurrentUser()
  
  // Date range filter
  const dateFilter = startDate && endDate ? {
    createdAt: {
      gte: new Date(startDate),
      lte: new Date(endDate)
    }
  } : {}

  switch (type) {
    case 'population':
      return await generatePopulationReport(format, dateFilter)
    
    case 'letters':
      return await generateLettersReport(format, dateFilter)
    
    case 'families':
      return await generateFamiliesReport(format, dateFilter)
    
    case 'activities':
      return await generateActivitiesReport(format, dateFilter)
    
    default:
      return NextResponse.json(
        { error: 'Invalid report type' },
        { status: 400 }
      )
  }
}

/**
 * Generate population report
 */
async function generatePopulationReport(format: string, dateFilter: any) {
  const [
    totalCitizens,
    genderStats,
    ageGroupStats,
    religionStats,
    educationStats,
    occupationStats
  ] = await Promise.all([
    prisma.citizen.count({ where: dateFilter }),
    prisma.citizen.groupBy({
      by: ['gender'],
      _count: { gender: true },
      where: dateFilter
    }),
    // Age groups query would need raw SQL for proper age calculation
    prisma.$queryRaw`
      SELECT 
        CASE 
          WHEN EXTRACT(YEAR FROM AGE(birth_date)) BETWEEN 0 AND 17 THEN 'Anak (0-17)'
          WHEN EXTRACT(YEAR FROM AGE(birth_date)) BETWEEN 18 AND 59 THEN 'Dewasa (18-59)'
          ELSE 'Lansia (60+)'
        END as age_group,
        COUNT(*) as count
      FROM citizens 
      GROUP BY age_group
    `,
    prisma.citizen.groupBy({
      by: ['religion'],
      _count: { religion: true },
      where: dateFilter,
      orderBy: { _count: { religion: 'desc' } }
    }),
    prisma.citizen.groupBy({
      by: ['education'],
      _count: { education: true },
      where: dateFilter,
      orderBy: { _count: { education: 'desc' } }
    }),
    prisma.citizen.groupBy({
      by: ['occupation'],
      _count: { occupation: true },
      where: dateFilter,
      orderBy: { _count: { occupation: 'desc' } },
      take: 10
    })
  ])

  const reportData = {
    title: 'Laporan Kependudukan',
    summary: {
      totalCitizens,
      maleCount: genderStats.find(g => g.gender === 'L')?._count.gender || 0,
      femaleCount: genderStats.find(g => g.gender === 'P')?._count.gender || 0
    },
    demographics: {
      gender: genderStats.map(stat => ({
        label: stat.gender === 'L' ? 'Laki-laki' : 'Perempuan',
        count: stat._count.gender,
        percentage: Math.round((stat._count.gender / totalCitizens) * 100)
      })),
      ageGroups: (ageGroupStats as any[]).map(group => ({
        label: group.age_group,
        count: Number(group.count),
        percentage: Math.round((Number(group.count) / totalCitizens) * 100)
      })),
      religion: religionStats.map(stat => ({
        label: stat.religion,
        count: stat._count.religion,
        percentage: Math.round((stat._count.religion / totalCitizens) * 100)
      })),
      education: educationStats.map(stat => ({
        label: stat.education,
        count: stat._count.education,
        percentage: Math.round((stat._count.education / totalCitizens) * 100)
      })),
      occupation: occupationStats.map(stat => ({
        label: stat.occupation,
        count: stat._count.occupation,
        percentage: Math.round((stat._count.occupation / totalCitizens) * 100)
      }))
    },
    generatedAt: new Date().toISOString()
  }

  if (format === 'csv') {
    return generateCSVResponse(reportData, 'laporan-kependudukan')
  }

  return NextResponse.json(reportData)
}

/**
 * Generate letters report
 */
async function generateLettersReport(format: string, dateFilter: any) {
  const [
    totalLetters,
    statusStats,
    typeStats,
    monthlyStats
  ] = await Promise.all([
    prisma.letterRequest.count({ where: dateFilter }),
    prisma.letterRequest.groupBy({
      by: ['status'],
      _count: { status: true },
      where: dateFilter
    }),
    prisma.letterRequest.groupBy({
      by: ['letterType'],
      _count: { letterType: true },
      where: dateFilter,
      orderBy: { _count: { letterType: 'desc' } }
    }),
    prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', requested_at) as month,
        COUNT(*) as count
      FROM letter_requests 
      WHERE requested_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', requested_at)
      ORDER BY month DESC
    `
  ])

  const reportData = {
    title: 'Laporan Surat Menyurat',
    summary: {
      totalLetters,
      pendingCount: statusStats.find(s => s.status === 'PENDING')?._count.status || 0,
      processedCount: statusStats.find(s => s.status === 'DIPROSES')?._count.status || 0,
      completedCount: statusStats.find(s => s.status === 'SELESAI')?._count.status || 0,
      rejectedCount: statusStats.find(s => s.status === 'DITOLAK')?._count.status || 0
    },
    statistics: {
      byStatus: statusStats.map(stat => ({
        label: getStatusLabel(stat.status),
        count: stat._count.status,
        percentage: Math.round((stat._count.status / totalLetters) * 100)
      })),
      byType: typeStats.map(stat => ({
        label: getLetterTypeLabel(stat.letterType),
        count: stat._count.letterType,
        percentage: Math.round((stat._count.letterType / totalLetters) * 100)
      })),
      monthly: (monthlyStats as any[]).map(stat => ({
        month: stat.month,
        count: Number(stat.count)
      }))
    },
    generatedAt: new Date().toISOString()
  }

  if (format === 'csv') {
    return generateCSVResponse(reportData, 'laporan-surat-menyurat')
  }

  return NextResponse.json(reportData)
}

/**
 * Generate families report
 */
async function generateFamiliesReport(format: string, dateFilter: any) {
  const [
    totalFamilies,
    socialStatusStats,
    familySizeStats
  ] = await Promise.all([
    prisma.family.count({ where: dateFilter }),
    prisma.family.groupBy({
      by: ['socialStatus'],
      _count: { socialStatus: true },
      where: dateFilter
    }),
    prisma.$queryRaw`
      SELECT 
        CASE 
          WHEN member_count = 1 THEN '1 orang'
          WHEN member_count BETWEEN 2 AND 4 THEN '2-4 orang'
          WHEN member_count BETWEEN 5 AND 7 THEN '5-7 orang'
          ELSE '8+ orang'
        END as size_group,
        COUNT(*) as count
      FROM (
        SELECT f.id, COUNT(c.id) as member_count
        FROM families f
        LEFT JOIN citizens c ON f.id = c.family_id
        GROUP BY f.id
      ) family_sizes
      GROUP BY size_group
    `
  ])

  const reportData = {
    title: 'Laporan Keluarga',
    summary: {
      totalFamilies,
      averageSize: 0 // Would need calculation
    },
    statistics: {
      socialStatus: socialStatusStats.map(stat => ({
        label: getSocialStatusLabel(stat.socialStatus),
        count: stat._count.socialStatus,
        percentage: Math.round((stat._count.socialStatus / totalFamilies) * 100)
      })),
      familySize: (familySizeStats as any[]).map(stat => ({
        label: stat.size_group,
        count: Number(stat.count),
        percentage: Math.round((Number(stat.count) / totalFamilies) * 100)
      }))
    },
    generatedAt: new Date().toISOString()
  }

  if (format === 'csv') {
    return generateCSVResponse(reportData, 'laporan-keluarga')
  }

  return NextResponse.json(reportData)
}

/**
 * Generate activities report
 */
async function generateActivitiesReport(format: string, dateFilter: any) {
  const [
    totalActivities,
    actionStats,
    userStats,
    dailyStats
  ] = await Promise.all([
    prisma.activityLog.count({ where: dateFilter }),
    prisma.activityLog.groupBy({
      by: ['action'],
      _count: { action: true },
      where: dateFilter,
      orderBy: { _count: { action: 'desc' } },
      take: 10
    }),
    prisma.activityLog.groupBy({
      by: ['userId'],
      _count: { userId: true },
      where: dateFilter,
      orderBy: { _count: { userId: 'desc' } },
      take: 10
    }),
    prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('day', created_at) as day,
        COUNT(*) as count
      FROM activity_logs 
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY day DESC
    `
  ])

  const reportData = {
    title: 'Laporan Aktivitas Sistem',
    summary: {
      totalActivities
    },
    statistics: {
      byAction: actionStats.map(stat => ({
        label: stat.action,
        count: stat._count.action,
        percentage: Math.round((stat._count.action / totalActivities) * 100)
      })),
      daily: (dailyStats as any[]).map(stat => ({
        day: stat.day,
        count: Number(stat.count)
      }))
    },
    generatedAt: new Date().toISOString()
  }

  if (format === 'csv') {
    return generateCSVResponse(reportData, 'laporan-aktivitas')
  }

  return NextResponse.json(reportData)
}

/**
 * Generate CSV response
 */
function generateCSVResponse(data: any, filename: string) {
  // This is a simplified CSV generation - in production you'd use a proper CSV library
  const csv = JSON.stringify(data, null, 2)
  
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}-${new Date().toISOString().split('T')[0]}.csv"`
    }
  })
}

/**
 * Helper functions for labels
 */
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'PENDING': 'Menunggu',
    'DIPROSES': 'Diproses',
    'SELESAI': 'Selesai',
    'DITOLAK': 'Ditolak'
  }
  return labels[status] || status
}

function getLetterTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'SURAT_KETERANGAN_DOMISILI': 'Surat Keterangan Domisili',
    'SURAT_KETERANGAN_USAHA': 'Surat Keterangan Usaha',
    'SURAT_KETERANGAN_TIDAK_MAMPU': 'Surat Keterangan Tidak Mampu',
    'SURAT_PENGANTAR': 'Surat Pengantar',
    'LAINNYA': 'Lainnya'
  }
  return labels[type] || type
}

function getSocialStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'MAMPU': 'Mampu',
    'KURANG_MAMPU': 'Kurang Mampu',
    'MISKIN': 'Miskin'
  }
  return labels[status] || status
}