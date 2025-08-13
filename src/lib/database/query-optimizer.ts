// Database query optimization utilities
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'

// Query optimization configurations
export const QueryOptimizations = {
  // Citizen queries
  citizenList: {
    include: {
      family: {
        select: {
          id: true,
          familyNumber: true
        }
      },
      address: {
        select: {
          id: true,
          rt: true,
          rw: true,
          village: true
        }
      }
    },
    // Limit fields to reduce data transfer
    select: {
      id: true,
      nik: true,
      name: true,
      birthDate: true,
      gender: true,
      family: true,
      address: true,
      createdAt: true,
      updatedAt: true
    }
  },

  // Family queries
  familyList: {
    include: {
      members: {
        select: {
          id: true,
          name: true,
          nik: true,
          isHeadOfFamily: true
        },
        orderBy: {
          isHeadOfFamily: 'desc'
        }
      },
      address: {
        select: {
          rt: true,
          rw: true,
          village: true
        }
      }
    }
  },

  // Letter queries
  letterList: {
    include: {
      citizen: {
        select: {
          id: true,
          name: true,
          nik: true
        }
      },
      template: {
        select: {
          id: true,
          name: true,
          type: true
        }
      }
    },
    orderBy: {
      requestedAt: 'desc'
    }
  }
} as const

// Optimized query builders
export class QueryOptimizer {
  // Citizen queries with optimizations
  static async getCitizensPaginated(params: {
    page: number
    limit: number
    search?: string
    rt?: string
    rw?: string
    gender?: string
  }) {
    const { page, limit, search, rt, rw, gender } = params
    const skip = (page - 1) * limit

    // Build where clause efficiently
    const where: Prisma.CitizenWhereInput = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nik: { contains: search } }
      ]
    }

    if (rt || rw) {
      where.address = {}
      if (rt) where.address.rt = rt
      if (rw) where.address.rw = rw
    }

    if (gender) {
      where.gender = gender as any
    }

    // Execute optimized queries in parallel
    const [citizens, total] = await Promise.all([
      prisma.citizen.findMany({
        where,
        ...QueryOptimizations.citizenList,
        skip,
        take: limit,
        orderBy: { name: 'asc' }
      }),
      prisma.citizen.count({ where })
    ])

    return {
      citizens,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  // Family queries with member count optimization
  static async getFamiliesPaginated(params: {
    page: number
    limit: number
    rt?: string
    rw?: string
  }) {
    const { page, limit, rt, rw } = params
    const skip = (page - 1) * limit

    const where: Prisma.FamilyWhereInput = {}

    if (rt || rw) {
      where.address = {}
      if (rt) where.address.rt = rt
      if (rw) where.address.rw = rw
    }

    const [families, total] = await Promise.all([
      prisma.family.findMany({
        where,
        ...QueryOptimizations.familyList,
        skip,
        take: limit,
        orderBy: { familyNumber: 'asc' }
      }),
      prisma.family.count({ where })
    ])

    return {
      families,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  // Letter requests with status filtering
  static async getLettersPaginated(params: {
    page: number
    limit: number
    status?: string
    type?: string
    citizenId?: string
  }) {
    const { page, limit, status, type, citizenId } = params
    const skip = (page - 1) * limit

    const where: Prisma.LetterRequestWhereInput = {}

    if (status) where.status = status as any
    if (type) where.letterType = type
    if (citizenId) where.citizenId = citizenId

    const [letters, total] = await Promise.all([
      prisma.letterRequest.findMany({
        where,
        ...QueryOptimizations.letterList,
        skip,
        take: limit
      }),
      prisma.letterRequest.count({ where })
    ])

    return {
      letters,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  // Optimized statistics queries
  static async getCitizenStatistics() {
    // Use raw queries for better performance on aggregations
    const [
      totalCitizens,
      totalFamilies,
      genderStats,
      ageGroups,
      educationStats
    ] = await Promise.all([
      prisma.citizen.count(),
      prisma.family.count(),
      prisma.$queryRaw<Array<{ gender: string; count: bigint }>>`
        SELECT gender, COUNT(*) as count 
        FROM "Citizen" 
        GROUP BY gender
      `,
      prisma.$queryRaw<Array<{ age_group: string; count: bigint }>>`
        SELECT 
          CASE 
            WHEN EXTRACT(YEAR FROM AGE(birth_date)) < 18 THEN 'Anak'
            WHEN EXTRACT(YEAR FROM AGE(birth_date)) BETWEEN 18 AND 60 THEN 'Dewasa'
            ELSE 'Lansia'
          END as age_group,
          COUNT(*) as count
        FROM "Citizen"
        GROUP BY age_group
      `,
      prisma.$queryRaw<Array<{ education: string; count: bigint }>>`
        SELECT education, COUNT(*) as count 
        FROM "Citizen" 
        GROUP BY education
        ORDER BY count DESC
      `
    ])

    return {
      totalCitizens,
      totalFamilies,
      genderStats: genderStats.map(stat => ({
        gender: stat.gender,
        count: Number(stat.count)
      })),
      ageGroups: ageGroups.map(group => ({
        ageGroup: group.age_group,
        count: Number(group.count)
      })),
      educationStats: educationStats.map(stat => ({
        education: stat.education,
        count: Number(stat.count)
      }))
    }
  }

  // Financial statistics with optimized aggregations
  static async getFinancialStatistics(year: number) {
    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year + 1, 0, 1)

    const [
      totalBudget,
      totalExpenses,
      monthlyExpenses,
      categoryExpenses
    ] = await Promise.all([
      prisma.budget.aggregate({
        where: { year },
        _sum: { amount: true }
      }),
      prisma.expense.aggregate({
        where: {
          date: {
            gte: startDate,
            lt: endDate
          }
        },
        _sum: { amount: true }
      }),
      prisma.$queryRaw<Array<{ month: number; total: bigint }>>`
        SELECT 
          EXTRACT(MONTH FROM date) as month,
          SUM(amount) as total
        FROM "Expense"
        WHERE date >= ${startDate} AND date < ${endDate}
        GROUP BY EXTRACT(MONTH FROM date)
        ORDER BY month
      `,
      prisma.$queryRaw<Array<{ category: string; total: bigint }>>`
        SELECT 
          category,
          SUM(amount) as total
        FROM "Expense"
        WHERE date >= ${startDate} AND date < ${endDate}
        GROUP BY category
        ORDER BY total DESC
      `
    ])

    return {
      totalBudget: totalBudget._sum.amount || 0,
      totalExpenses: totalExpenses._sum.amount || 0,
      monthlyExpenses: monthlyExpenses.map(expense => ({
        month: Number(expense.month),
        total: Number(expense.total)
      })),
      categoryExpenses: categoryExpenses.map(expense => ({
        category: expense.category,
        total: Number(expense.total)
      }))
    }
  }

  // Bulk operations optimization
  static async bulkCreateCitizens(citizens: Prisma.CitizenCreateManyInput[]) {
    // Use createMany for better performance
    return prisma.citizen.createMany({
      data: citizens,
      skipDuplicates: true
    })
  }

  static async bulkUpdateCitizens(updates: Array<{
    id: string
    data: Prisma.CitizenUpdateInput
  }>) {
    // Use transaction for consistency
    return prisma.$transaction(
      updates.map(update =>
        prisma.citizen.update({
          where: { id: update.id },
          data: update.data
        })
      )
    )
  }

  // Search optimization with full-text search
  static async searchCitizens(query: string, limit: number = 10) {
    // Use database-specific full-text search for better performance
    return prisma.$queryRaw<Array<{
      id: string
      nik: string
      name: string
      rank: number
    }>>`
      SELECT 
        id, nik, name,
        ts_rank(
          to_tsvector('indonesian', name || ' ' || nik), 
          plainto_tsquery('indonesian', ${query})
        ) as rank
      FROM "Citizen"
      WHERE to_tsvector('indonesian', name || ' ' || nik) @@ plainto_tsquery('indonesian', ${query})
      ORDER BY rank DESC
      LIMIT ${limit}
    `
  }

  // Connection pool optimization
  static async optimizeConnections() {
    // Get current connection info
    const connections = await prisma.$queryRaw<Array<{
      state: string
      count: bigint
    }>>`
      SELECT state, COUNT(*) as count
      FROM pg_stat_activity 
      WHERE datname = current_database()
      GROUP BY state
    `

    return connections.map(conn => ({
      state: conn.state,
      count: Number(conn.count)
    }))
  }

  // Query performance monitoring
  static async getSlowQueries(limit: number = 10) {
    return prisma.$queryRaw<Array<{
      query: string
      calls: bigint
      total_time: number
      mean_time: number
    }>>`
      SELECT 
        query,
        calls,
        total_time,
        mean_time
      FROM pg_stat_statements
      WHERE query NOT LIKE '%pg_stat_statements%'
      ORDER BY mean_time DESC
      LIMIT ${limit}
    `
  }
}

// Database maintenance utilities
export class DatabaseMaintenance {
  static async analyzeDatabase() {
    // Run ANALYZE to update table statistics
    await prisma.$executeRaw`ANALYZE`
    console.log('Database analysis completed')
  }

  static async vacuumDatabase() {
    // Run VACUUM to reclaim storage
    await prisma.$executeRaw`VACUUM`
    console.log('Database vacuum completed')
  }

  static async reindexDatabase() {
    // Reindex all tables for optimal performance
    await prisma.$executeRaw`REINDEX DATABASE opensid`
    console.log('Database reindex completed')
  }

  static async getTableSizes() {
    return prisma.$queryRaw<Array<{
      table_name: string
      size: string
      row_count: bigint
    }>>`
      SELECT 
        schemaname||'.'||tablename as table_name,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
        n_tup_ins - n_tup_del as row_count
      FROM pg_tables t
      LEFT JOIN pg_stat_user_tables s ON s.relname = t.tablename
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    `
  }
}

// Export optimized query functions
export const optimizedQueries = {
  citizens: QueryOptimizer.getCitizensPaginated,
  families: QueryOptimizer.getFamiliesPaginated,
  letters: QueryOptimizer.getLettersPaginated,
  citizenStats: QueryOptimizer.getCitizenStatistics,
  financialStats: QueryOptimizer.getFinancialStatistics,
  searchCitizens: QueryOptimizer.searchCitizens
}