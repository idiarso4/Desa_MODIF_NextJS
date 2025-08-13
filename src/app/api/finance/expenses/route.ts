/**
 * Expenses API Routes
 * CRUD operations for expense management
 */

import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, getCurrentUser } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createExpenseSchema = z.object({
  budgetId: z.string().min(1, 'Budget harus dipilih'),
  description: z.string().min(1, 'Deskripsi harus diisi').max(500, 'Deskripsi maksimal 500 karakter'),
  amount: z.number().positive('Jumlah pengeluaran harus lebih dari 0'),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Format tanggal tidak valid'),
  receipt: z.string().max(255, 'URL bukti maksimal 255 karakter').optional()
})

/**
 * GET /api/finance/expenses
 * Get all expenses with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Check permission
    await requirePermission('finance', 'read')

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const budgetId = searchParams.get('budgetId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const search = searchParams.get('search') || ''

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (budgetId) {
      where.budgetId = budgetId
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    if (search) {
      where.description = {
        contains: search,
        mode: 'insensitive'
      }
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          budget: {
            select: {
              id: true,
              year: true,
              category: true,
              subcategory: true,
              amount: true
            }
          },
          approver: {
            select: {
              id: true,
              name: true,
              username: true
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              username: true
            }
          }
        },
        orderBy: {
          date: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.expense.count({ where })
    ])

    const formattedExpenses = expenses.map(expense => ({
      id: expense.id,
      description: expense.description,
      amount: Number(expense.amount),
      date: expense.date.toISOString().split('T')[0],
      receipt: expense.receipt,
      budget: expense.budget,
      approver: expense.approver,
      createdBy: expense.createdBy,
      createdAt: expense.createdAt.toISOString(),
      updatedAt: expense.updatedAt.toISOString()
    }))

    return NextResponse.json({
      expenses: formattedExpenses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error getting expenses:', error)
    
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
 * POST /api/finance/expenses
 * Create a new expense
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
    const validation = createExpenseSchema.safeParse(body)

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

    // Check if budget exists and has sufficient remaining amount
    const budget = await prisma.budget.findUnique({
      where: { id: data.budgetId }
    })

    if (!budget) {
      return NextResponse.json(
        { error: 'Anggaran tidak ditemukan' },
        { status: 400 }
      )
    }

    if (Number(budget.remaining) < data.amount) {
      return NextResponse.json(
        { error: 'Sisa anggaran tidak mencukupi' },
        { status: 400 }
      )
    }

    // Create expense
    const expense = await prisma.expense.create({
      data: {
        budgetId: data.budgetId,
        description: data.description,
        amount: data.amount,
        date: new Date(data.date),
        receipt: data.receipt,
        createdById: currentUser.id
      },
      include: {
        budget: {
          select: {
            category: true,
            subcategory: true
          }
        }
      }
    })

    // Update budget spent and remaining amounts
    await prisma.budget.update({
      where: { id: data.budgetId },
      data: {
        spent: {
          increment: data.amount
        },
        remaining: {
          decrement: data.amount
        }
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: currentUser.id,
        action: 'CREATE_EXPENSE',
        resource: 'finance',
        resourceId: expense.id,
        description: `Created expense: ${expense.description} (${expense.amount})`,
      }
    })

    return NextResponse.json(
      { 
        message: 'Pengeluaran berhasil dicatat',
        expense: {
          id: expense.id,
          description: expense.description,
          amount: Number(expense.amount),
          budget: expense.budget
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating expense:', error)
    
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