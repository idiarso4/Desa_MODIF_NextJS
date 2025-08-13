/**
 * Citizen Search API Route
 * Advanced search functionality for citizens
 */

import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'

/**
 * GET /api/citizens/search
 * Search citizens with advanced filters
 */
export async function GET(request: NextRequest) {
  try {
    // Check permission
    await requirePermission('citizens', 'read')

    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!q || q.length < 2) {
      return NextResponse.json({
        citizens: [],
        total: 0
      })
    }

    // Search citizens by NIK, name, or birth place
    const citizens = await prisma.citizen.findMany({
      where: {
        OR: [
          { nik: { contains: q } },
          { name: { contains: q, mode: 'insensitive' } },
          { birthPlace: { contains: q, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        nik: true,
        name: true,
        birthDate: true,
        birthPlace: true,
        gender: true,
        family: {
          select: {
            id: true,
            familyNumber: true
          }
        }
      },
      take: limit,
      orderBy: {
        name: 'asc'
      }
    })

    const formattedCitizens = citizens.map(citizen => ({
      id: citizen.id,
      nik: citizen.nik,
      name: citizen.name,
      birthDate: citizen.birthDate.toISOString().split('T')[0],
      birthPlace: citizen.birthPlace,
      gender: citizen.gender,
      age: new Date().getFullYear() - citizen.birthDate.getFullYear(),
      family: citizen.family
    }))

    return NextResponse.json({
      citizens: formattedCitizens,
      total: formattedCitizens.length
    })
  } catch (error) {
    console.error('Error searching citizens:', error)
    
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