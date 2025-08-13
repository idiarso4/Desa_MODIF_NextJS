/**
 * Citizen Statistics API Route
 * Get various statistics about citizens
 */

import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'

/**
 * GET /api/citizens/statistics
 * Get citizen statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Check permission
    await requirePermission('citizens', 'read')

    // Get basic counts
    const [
      totalCitizens,
      totalMale,
      totalFemale,
      totalFamilies,
      totalHeadsOfFamily
    ] = await Promise.all([
      prisma.citizen.count(),
      prisma.citizen.count({ where: { gender: 'L' } }),
      prisma.citizen.count({ where: { gender: 'P' } }),
      prisma.family.count(),
      prisma.citizen.count({ where: { isHeadOfFamily: true } })
    ])

    // Get age group statistics
    const currentYear = new Date().getFullYear()
    const ageGroups = await prisma.$queryRaw`
      SELECT 
        CASE 
          WHEN EXTRACT(YEAR FROM AGE(birth_date)) BETWEEN 0 AND 4 THEN '0-4'
          WHEN EXTRACT(YEAR FROM AGE(birth_date)) BETWEEN 5 AND 9 THEN '5-9'
          WHEN EXTRACT(YEAR FROM AGE(birth_date)) BETWEEN 10 AND 14 THEN '10-14'
          WHEN EXTRACT(YEAR FROM AGE(birth_date)) BETWEEN 15 AND 19 THEN '15-19'
          WHEN EXTRACT(YEAR FROM AGE(birth_date)) BETWEEN 20 AND 24 THEN '20-24'
          WHEN EXTRACT(YEAR FROM AGE(birth_date)) BETWEEN 25 AND 29 THEN '25-29'
          WHEN EXTRACT(YEAR FROM AGE(birth_date)) BETWEEN 30 AND 34 THEN '30-34'
          WHEN EXTRACT(YEAR FROM AGE(birth_date)) BETWEEN 35 AND 39 THEN '35-39'
          WHEN EXTRACT(YEAR FROM AGE(birth_date)) BETWEEN 40 AND 44 THEN '40-44'
          WHEN EXTRACT(YEAR FROM AGE(birth_date)) BETWEEN 45 AND 49 THEN '45-49'
          WHEN EXTRACT(YEAR FROM AGE(birth_date)) BETWEEN 50 AND 54 THEN '50-54'
          WHEN EXTRACT(YEAR FROM AGE(birth_date)) BETWEEN 55 AND 59 THEN '55-59'
          WHEN EXTRACT(YEAR FROM AGE(birth_date)) BETWEEN 60 AND 64 THEN '60-64'
          ELSE '65+'
        END as age_group,
        COUNT(*) as count
      FROM citizens 
      GROUP BY age_group
      ORDER BY age_group
    `

    // Get religion statistics
    const religionStats = await prisma.citizen.groupBy({
      by: ['religion'],
      _count: {
        religion: true
      },
      orderBy: {
        _count: {
          religion: 'desc'
        }
      }
    })

    // Get education statistics
    const educationStats = await prisma.citizen.groupBy({
      by: ['education'],
      _count: {
        education: true
      },
      orderBy: {
        _count: {
          education: 'desc'
        }
      }
    })

    // Get marital status statistics
    const maritalStats = await prisma.citizen.groupBy({
      by: ['maritalStatus'],
      _count: {
        maritalStatus: true
      },
      orderBy: {
        _count: {
          maritalStatus: 'desc'
        }
      }
    })

    // Get occupation statistics (top 10)
    const occupationStats = await prisma.citizen.groupBy({
      by: ['occupation'],
      _count: {
        occupation: true
      },
      orderBy: {
        _count: {
          occupation: 'desc'
        }
      },
      take: 10
    })

    // Get monthly registration statistics (last 12 months)
    const monthlyStats = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as count
      FROM citizens 
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month DESC
    `

    return NextResponse.json({
      summary: {
        totalCitizens,
        totalMale,
        totalFemale,
        totalFamilies,
        totalHeadsOfFamily,
        averageFamilySize: totalCitizens > 0 ? Math.round((totalCitizens / totalFamilies) * 100) / 100 : 0
      },
      demographics: {
        gender: [
          { label: 'Laki-laki', value: totalMale, percentage: Math.round((totalMale / totalCitizens) * 100) },
          { label: 'Perempuan', value: totalFemale, percentage: Math.round((totalFemale / totalCitizens) * 100) }
        ],
        ageGroups: (ageGroups as any[]).map(group => ({
          label: group.age_group,
          value: Number(group.count),
          percentage: Math.round((Number(group.count) / totalCitizens) * 100)
        })),
        religion: religionStats.map(stat => ({
          label: stat.religion,
          value: stat._count.religion,
          percentage: Math.round((stat._count.religion / totalCitizens) * 100)
        })),
        education: educationStats.map(stat => ({
          label: stat.education,
          value: stat._count.education,
          percentage: Math.round((stat._count.education / totalCitizens) * 100)
        })),
        maritalStatus: maritalStats.map(stat => ({
          label: stat.maritalStatus,
          value: stat._count.maritalStatus,
          percentage: Math.round((stat._count.maritalStatus / totalCitizens) * 100)
        })),
        occupation: occupationStats.map(stat => ({
          label: stat.occupation,
          value: stat._count.occupation,
          percentage: Math.round((stat._count.occupation / totalCitizens) * 100)
        }))
      },
      trends: {
        monthlyRegistrations: (monthlyStats as any[]).map(stat => ({
          month: stat.month,
          count: Number(stat.count)
        }))
      },
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error getting citizen statistics:', error)
    
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