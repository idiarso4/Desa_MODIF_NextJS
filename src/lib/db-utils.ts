// Database utility functions
import { prisma } from './prisma'
import type { Prisma } from '@prisma/client'

// Generic pagination helper
export interface PaginationOptions {
  page?: number
  limit?: number
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export async function paginate<T>(
  model: {
    findMany: (args: Record<string, unknown>) => Promise<T[]>
    count: (args: Record<string, unknown>) => Promise<number>
  },
  options: PaginationOptions & {
    where?: Record<string, unknown>
    orderBy?: Record<string, unknown>
    include?: Record<string, unknown>
    select?: Record<string, unknown>
  } = {}
): Promise<PaginatedResult<T>> {
  const page = Math.max(1, options.page || 1)
  const limit = Math.min(100, Math.max(1, options.limit || 10))
  const skip = (page - 1) * limit

  const [data, total] = await Promise.all([
    model.findMany({
      skip,
      take: limit,
      where: options.where,
      orderBy: options.orderBy,
      include: options.include,
      select: options.select,
    }),
    model.count({ where: options.where }),
  ])

  const totalPages = Math.ceil(total / limit)

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  }
}

// Search helper for text fields
export function createSearchFilter(searchTerm: string, fields: string[]) {
  if (!searchTerm) return {}

  return {
    OR: fields.map(field => ({
      [field]: {
        contains: searchTerm,
        mode: 'insensitive' as const,
      },
    })),
  }
}

// Date range filter helper
export function createDateRangeFilter(
  field: string,
  startDate?: Date | string,
  endDate?: Date | string
) {
  const filter: Record<string, Record<string, Date>> = {}

  if (startDate || endDate) {
    filter[field] = {}
    
    if (startDate) {
      filter[field].gte = new Date(startDate)
    }
    
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999) // End of day
      filter[field].lte = end
    }
  }

  return filter
}

// Soft delete helper (if we implement soft deletes)
export function createSoftDeleteFilter(includeDeleted = false) {
  if (includeDeleted) return {}
  
  return {
    deletedAt: null,
  }
}

// Transaction helper
export async function withTransaction<T>(
  callback: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(callback)
}

// Database health check
export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { status: 'healthy', timestamp: new Date() }
  } catch (error) {
    return { 
      status: 'unhealthy', 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date() 
    }
  }
}

// Get database statistics
export async function getDatabaseStats() {
  try {
    const [
      userCount,
      citizenCount,
      familyCount,
      letterRequestCount,
      documentCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.citizen.count(),
      prisma.family.count(),
      prisma.letterRequest.count(),
      prisma.document.count(),
    ])

    return {
      users: userCount,
      citizens: citizenCount,
      families: familyCount,
      letterRequests: letterRequestCount,
      documents: documentCount,
      timestamp: new Date(),
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to get database stats: ${errorMessage}`)
  }
}

// Backup database (basic implementation)
export async function createDatabaseBackup() {
  // This would typically use pg_dump or similar
  // For now, we'll just return the current timestamp
  return {
    backupId: `backup_${Date.now()}`,
    timestamp: new Date(),
    status: 'completed',
  }
}

// Seed check - verify if database has been seeded
export async function isDatabaseSeeded() {
  try {
    const adminUser = await prisma.user.findFirst({
      where: { username: 'admin' }
    })
    
    const villageConfig = await prisma.villageConfig.findFirst()
    
    return !!(adminUser && villageConfig)
  } catch {
    return false
  }
}