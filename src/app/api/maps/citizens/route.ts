/**
 * Citizens Location API
 * Handles location-based citizen queries and mapping
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { checkServerPermission } from '@/lib/rbac/server-utils'
import { calculateDistance, isWithinBounds, calculateBounds } from '@/lib/maps/coordinates'

// Validation schemas
const locationQuerySchema = z.object({
  lat: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  lng: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  radius: z.string().optional().transform(val => val ? parseFloat(val) : 5), // Default 5km radius
  bounds: z.string().optional(), // Format: "north,south,east,west"
  rt: z.string().optional(),
  rw: z.string().optional(),
  addressId: z.string().optional(),
  includeFamily: z.string().optional().transform(val => val === 'true'),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 100)
})

const updateLocationSchema = z.object({
  citizenId: z.string(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180)
})

// GET /api/maps/citizens - Get citizens with location data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    const hasPermission = await checkServerPermission('citizens', 'read')
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const query = locationQuerySchema.parse(Object.fromEntries(searchParams))

    // Build where clause
    const where: any = {
      OR: [
        { latitude: { not: null } },
        { longitude: { not: null } }
      ]
    }

    // Filter by RT/RW if provided
    if (query.rt || query.rw) {
      where.address = {}
      if (query.rt) where.address.rt = query.rt
      if (query.rw) where.address.rw = query.rw
    }

    // Filter by address if provided
    if (query.addressId) {
      where.addressId = query.addressId
    }

    // Get citizens with location data
    const citizens = await prisma.citizen.findMany({
      where,
      include: {
        address: true,
        family: query.includeFamily ? {
          include: {
            members: {
              select: {
                id: true,
                name: true,
                isHeadOfFamily: true
              }
            }
          }
        } : false
      },
      take: query.limit
    })

    // Filter by geographic bounds or radius if provided
    let filteredCitizens = citizens

    if (query.bounds) {
      const [north, south, east, west] = query.bounds.split(',').map(parseFloat)
      filteredCitizens = citizens.filter(citizen => {
        if (!citizen.latitude || !citizen.longitude) return false
        return isWithinBounds(
          { lat: citizen.latitude, lng: citizen.longitude },
          { north, south, east, west }
        )
      })
    } else if (query.lat && query.lng && query.radius) {
      const centerPoint = { lat: query.lat, lng: query.lng }
      filteredCitizens = citizens.filter(citizen => {
        if (!citizen.latitude || !citizen.longitude) return false
        const distance = calculateDistance(
          centerPoint,
          { lat: citizen.latitude, lng: citizen.longitude }
        )
        return distance <= query.radius!
      })
    }

    // Transform to map points format
    const mapPoints = filteredCitizens.map(citizen => ({
      id: citizen.id,
      position: [citizen.latitude!, citizen.longitude!] as [number, number],
      title: citizen.name,
      description: `NIK: ${citizen.nik}`,
      type: 'citizen' as const,
      data: {
        nik: citizen.nik,
        gender: citizen.gender,
        age: new Date().getFullYear() - citizen.birthDate.getFullYear(),
        address: citizen.address ? `RT ${citizen.address.rt}/RW ${citizen.address.rw}` : 'No address',
        family: query.includeFamily && citizen.family ? 
          `${citizen.family.members.length} members` : undefined
      }
    }))

    // Calculate statistics
    const statistics = {
      total: filteredCitizens.length,
      withLocation: filteredCitizens.filter(c => c.latitude && c.longitude).length,
      byGender: {
        male: filteredCitizens.filter(c => c.gender === 'L').length,
        female: filteredCitizens.filter(c => c.gender === 'P').length
      },
      byAge: {
        children: filteredCitizens.filter(c => 
          new Date().getFullYear() - c.birthDate.getFullYear() < 18
        ).length,
        adults: filteredCitizens.filter(c => {
          const age = new Date().getFullYear() - c.birthDate.getFullYear()
          return age >= 18 && age < 60
        }).length,
        elderly: filteredCitizens.filter(c => 
          new Date().getFullYear() - c.birthDate.getFullYear() >= 60
        ).length
      }
    }

    // Calculate bounds for all points
    let bounds = null
    if (mapPoints.length > 0) {
      const coordinates = mapPoints.map(point => ({
        lat: point.position[0],
        lng: point.position[1]
      }))
      bounds = calculateBounds(coordinates)
    }

    return NextResponse.json({
      citizens: mapPoints,
      statistics,
      bounds,
      query: {
        center: query.lat && query.lng ? [query.lat, query.lng] : null,
        radius: query.radius,
        filters: {
          rt: query.rt,
          rw: query.rw,
          addressId: query.addressId
        }
      }
    })

  } catch (error) {
    console.error('Get citizens location error:', error)
    
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

// POST /api/maps/citizens - Update citizen location
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    const hasPermission = await checkServerPermission('citizens', 'update')
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { citizenId, latitude, longitude } = updateLocationSchema.parse(body)

    // Check if citizen exists
    const citizen = await prisma.citizen.findUnique({
      where: { id: citizenId }
    })

    if (!citizen) {
      return NextResponse.json({
        error: 'Citizen not found'
      }, { status: 404 })
    }

    // Update citizen location
    const updatedCitizen = await prisma.citizen.update({
      where: { id: citizenId },
      data: {
        latitude,
        longitude
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE_LOCATION',
        resource: 'citizen',
        resourceId: citizenId,
        description: `Updated location for citizen: ${citizen.name} to ${latitude}, ${longitude}`
      }
    })

    return NextResponse.json({
      message: 'Location updated successfully',
      citizen: {
        id: updatedCitizen.id,
        name: updatedCitizen.name,
        latitude: updatedCitizen.latitude,
        longitude: updatedCitizen.longitude
      }
    })

  } catch (error) {
    console.error('Update citizen location error:', error)
    
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

// PUT /api/maps/citizens - Bulk update citizen locations
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    const hasPermission = await checkServerPermission('citizens', 'update')
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { updates } = z.object({
      updates: z.array(updateLocationSchema)
    }).parse(body)

    const results = {
      updated: 0,
      errors: [] as Array<{ citizenId: string; error: string }>
    }

    // Process each update
    for (const update of updates) {
      try {
        const citizen = await prisma.citizen.findUnique({
          where: { id: update.citizenId }
        })

        if (!citizen) {
          results.errors.push({
            citizenId: update.citizenId,
            error: 'Citizen not found'
          })
          continue
        }

        await prisma.citizen.update({
          where: { id: update.citizenId },
          data: {
            latitude: update.latitude,
            longitude: update.longitude
          }
        })

        results.updated++

        // Log activity
        await prisma.activityLog.create({
          data: {
            userId: session.user.id,
            action: 'BULK_UPDATE_LOCATION',
            resource: 'citizen',
            resourceId: update.citizenId,
            description: `Bulk updated location for citizen: ${citizen.name}`
          }
        })

      } catch (error) {
        results.errors.push({
          citizenId: update.citizenId,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      message: 'Bulk location update completed',
      results
    })

  } catch (error) {
    console.error('Bulk update citizen locations error:', error)
    
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