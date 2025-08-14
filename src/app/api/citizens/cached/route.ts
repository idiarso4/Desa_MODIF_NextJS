/**
 * Cached Citizens API
 * Example of API route with caching implementation
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { cache, CacheKeys, CacheTags } from '@/lib/cache/cache-manager'
import { withCache, withCacheInvalidation } from '@/lib/cache/cache-middleware'
import { z } from 'zod'

// Validation schema
const citizensQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  search: z.string().optional(),
  gender: z.enum(['L', 'P']).optional(),
  religion: z.string().optional(),
  education: z.string().optional(),
  isActive: z.string().transform(val => val === 'true').optional()
})

// GET /api/citizens/cached - Get citizens with caching
export const GET = withCache({
  ttl: 300, // 5 minutes
  tags: [CacheTags.CITIZENS],
  keyGenerator: (request: NextRequest) => {
    const url = new URL(request.url)
    const params = url.searchParams.toString()
    return CacheKeys.citizens(1, 10, params)
  },
  shouldCache: (request, response) => response.status === 200
})(async function (request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const query = citizensQuerySchema.parse(Object.fromEntries(searchParams))

    // Build cache key
    const cacheKey = CacheKeys.citizens(
      query.page, 
      query.limit, 
      JSON.stringify(query)
    )

    // Try to get from cache first
    const cached = await cache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached, {
        headers: { 'X-Cache': 'HIT' }
      })
    }

    // Build where clause
    const where: any = {}
    
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { nik: { contains: query.search } }
      ]
    }

    if (query.gender) where.gender = query.gender
    if (query.religion) where.religion = query.religion
    if (query.education) where.education = query.education
    if (query.isActive !== undefined) where.isActive = query.isActive

    // Execute queries
    const [citizens, total] = await Promise.all([
      prisma.citizen.findMany({
        where,
        select: {
          id: true,
          nik: true,
          name: true,
          birthDate: true,
          birthPlace: true,
          gender: true,
          religion: true,
          education: true,
          occupation: true,
          maritalStatus: true,
          isActive: true,
          address: {
            select: {
              street: true,
              rt: true,
              rw: true
            }
          },
          createdAt: true
        },
        orderBy: { name: 'asc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit
      }),
      prisma.citizen.count({ where })
    ])

    const result = {
      data: citizens,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit)
      },
      filters: query
    }

    // Cache the result
    await cache.set(cacheKey, result, {
      ttl: 300, // 5 minutes
      tags: [CacheTags.CITIZENS]
    })

    return NextResponse.json(result, {
      headers: { 'X-Cache': 'MISS' }
    })

  } catch (error) {
    console.error('Citizens API error:', error)

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
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// POST /api/citizens/cached - Create citizen with cache invalidation
export const POST = withCacheInvalidation([CacheTags.CITIZENS])(
  async function (request: NextRequest) {
    try {
      const session = await getServerSession(authOptions)
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }

      const body = await request.json()
      
      // Validate input (simplified for example)
      if (!body.nik || !body.name) {
        return NextResponse.json(
          { error: 'NIK and name are required' },
          { status: 400 }
        )
      }

      // Create citizen
      const citizen = await prisma.citizen.create({
        data: {
          nik: body.nik,
          name: body.name,
          birthDate: new Date(body.birthDate),
          birthPlace: body.birthPlace,
          gender: body.gender,
          religion: body.religion,
          education: body.education,
          occupation: body.occupation,
          maritalStatus: body.maritalStatus,
          isActive: true,
          createdById: session.user.id
        }
      })

      // Invalidate related caches
      await cache.invalidateByTags([CacheTags.CITIZENS])

      return NextResponse.json({
        success: true,
        data: citizen
      }, { status: 201 })

    } catch (error) {
      console.error('Create citizen error:', error)
      return NextResponse.json(
        { error: 'Failed to create citizen' },
        { status: 500 }
      )
    }
  }
)

// GET /api/citizens/cached/stats - Get cached statistics
export async function GET_STATS(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Use cache.getOrSet for statistics
    const stats = await cache.getOrSet(
      CacheKeys.stats('citizens'),
      async () => {
        const [
          totalCitizens,
          activeCitizens,
          maleCount,
          femaleCount,
          marriedCount
        ] = await Promise.all([
          prisma.citizen.count(),
          prisma.citizen.count({ where: { isActive: true } }),
          prisma.citizen.count({ where: { gender: 'L' } }),
          prisma.citizen.count({ where: { gender: 'P' } }),
          prisma.citizen.count({ where: { maritalStatus: 'KAWIN' } })
        ])

        return {
          total: totalCitizens,
          active: activeCitizens,
          inactive: totalCitizens - activeCitizens,
          male: maleCount,
          female: femaleCount,
          married: marriedCount,
          single: totalCitizens - marriedCount,
          lastUpdated: new Date().toISOString()
        }
      },
      {
        ttl: 600, // 10 minutes
        tags: [CacheTags.CITIZENS, CacheTags.STATS]
      }
    )

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Citizens stats error:', error)
    return NextResponse.json(
      { error: 'Failed to get statistics' },
      { status: 500 }
    )
  }
}
