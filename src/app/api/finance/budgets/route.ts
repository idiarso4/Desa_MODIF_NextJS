/**
 * Budget API Routes
 * CRUD operations for budget management
 */

import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, getCurrentUser } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createBudgetSchema = z.object({
  year: z.number().int().min(2020).max(2050),
  category: z.string().min(1, 'Kategori harus diisi').max(100, 'Kategori maksimal 100 karakter'),
  subcategory: z.string().max(100, 'Subkategori maksimal 100 karakter').optional(),
  description: z.string().min(1, 'Deskripsi harus diisi').max(500, 'Deskripsi maksimal 500 karakter'),
  amount: z.number().positive('Jumlah anggaran harus lebih dari 0')
})

/**
 * GET /api/finance/budgets
 * Get all budgets with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Check permission
    await requirePermission('finance', 'read')

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const year = searchParams.get('year')
    const category = searchParams.get('category')
    const search = searchParams.get('search') || ''

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (year) {
      where.year = parseInt(year)
    }

    if (category) {
      where.category = category
    }

    if (search) {
      where.OR = [
        { category: { contains: search, mode: 'insensitive' } },
        { subcategory: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [budgets, total] = await Promise.all([
      prisma.budget.findMany({
        where,
        include: {
          expenses: {
            select: {
              id: true,
              amount: true,
              date: true,
              description: true
            }
          }
        },
        orderBy: [
          { year: 'desc' },
          { category: 'asc' }
        ],
        skip,
        take: limit
      }),
      prisma.budget.count({ where })
    ])

    const formattedBudgets = budgets.map(budget => ({
      id: budget.id,
      year: budget.year,
      category: budget.category,
      subcategory: budget.subcategory,
      description: budget.description,
      amount: Number(budget.amount),
      spent: Number(budget.spent),
      remaining: Number(budget.remaining),
      utilizationPercentage: budget.amount > 0 ? Math.round((Number(budget.spent) / Number(budget.amount)) * 100) : 0,
      expenseCount: budget.expenses.length,
      createdAt: budget.createdAt.toISOString(),
      updatedAt: budget.updatedAt.toISOString()
    }))

    return NextResponse.json({
      budgets: formattedBudgets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error getting budgets:', error)
    
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
 * POST /api/finance/budgets
 * Create a new budget
 */
export async function POST(request: NextRequest) {
  try {
    // Check permission
    await requirePermission('finance', 'create')

    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = createBudgetSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validation.error.format()
        },
        { status: 400 }
      )
    }

    const data = validation.data

    // Check if budget already exists for this year, category, and subcategory
    const existingBudget = await prisma.budget.findFirst({
      where: {
        year: data.year,
        category: data.category,
        subcategory: data.subcategory || null
      }
    })

    if (existingBudget) {
      return NextResponse.json(
        { error: 'Anggaran untuk kategori ini sudah ada di tahun yang sama' },
        { status: 409 }
      )
    }

    // Create budget
    const budget = await prisma.budget.create({
      data: {
        year: data.year,
        category: data.category,
        subcategory: data.subcategory,
        description: data.description,
        amount: data.amount,
        spent: 0,
        remaining: data.amount
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: currentUser.id,
        action: 'CREATE_BUDGET',
        resource: 'finance',
        resourceId: budget.id,
        description: `Created budget: ${budget.category} - ${budget.year} (${budget.amount})`,
      }
    })

    return NextResponse.json(
      { 
        message: 'Anggaran berhasil dibuat',
        budget: {
          id: budget.id,
          year: budget.year,
          category: budget.category,
          amount: Number(budget.amount)
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating budget:', error)
    
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