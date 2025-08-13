/**
 * Financial Transactions API
 * Handles financial transactions and audit logging
 */

import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db'
import { checkServerPermission } from '@/lib/rbac/server-utils'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Validation schemas
const createTransactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
  amount: z.number().positive('Jumlah harus lebih dari 0'),
  description: z.string().min(1, 'Deskripsi harus diisi').max(500),
  category: z.string().min(1, 'Kategori harus diisi').max(100),
  budgetId: z.string().optional(),
  expenseId: z.string().optional(),
  reference: z.string().optional(),
  date: z.string().transform(str => new Date(str)),
  notes: z.string().optional()
})

const querySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']).optional(),
  category: z.string().optional(),
  budgetId: z.string().optional(),
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  search: z.string().optional()
})

// GET /api/finance/transactions - Get financial transactions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    const hasPermission = await checkServerPermission('finance', 'read')
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const query = querySchema.parse(Object.fromEntries(searchParams))

    // Build where clause
    const where: any = {}
    
    if (query.type) {
      where.type = query.type
    }

    if (query.category) {
      where.category = { contains: query.category, mode: 'insensitive' }
    }

    if (query.budgetId) {
      where.budgetId = query.budgetId
    }

    if (query.startDate || query.endDate) {
      where.date = {}
      if (query.startDate) where.date.gte = query.startDate
      if (query.endDate) where.date.lte = query.endDate
    }

    if (query.search) {
      where.OR = [
        { description: { contains: query.search, mode: 'insensitive' } },
        { reference: { contains: query.search, mode: 'insensitive' } },
        { notes: { contains: query.search, mode: 'insensitive' } }
      ]
    }

    // Get total count
    const total = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM (
        SELECT id FROM expenses WHERE ${where ? 'TRUE' : 'TRUE'}
        UNION ALL
        SELECT CONCAT('income_', id) as id FROM budgets WHERE amount > 0
      ) as transactions
    ` as any[]

    const totalCount = parseInt(total[0]?.count || '0')

    // Get transactions (combining expenses and budget allocations)
    const expenses = await prisma.expense.findMany({
      where: {
        ...where,
        ...(where.type === 'EXPENSE' ? {} : where.type ? { id: 'never' } : {})
      },
      include: {
        budget: true,
        createdBy: {
          select: { name: true }
        },
        approver: {
          select: { name: true }
        }
      },
      orderBy: { date: 'desc' },
      skip: query.type === 'INCOME' ? 0 : (query.page - 1) * query.limit,
      take: query.type === 'INCOME' ? 0 : query.limit
    })

    // Transform expenses to transaction format
    const transactions = expenses.map(expense => ({
      id: expense.id,
      type: 'EXPENSE' as const,
      amount: expense.amount,
      description: expense.description,
      category: expense.budget?.category || 'Uncategorized',
      budgetId: expense.budgetId,
      reference: expense.receipt || undefined,
      date: expense.date,
      notes: `Created by: ${expense.createdBy.name}${expense.approver ? `, Approved by: ${expense.approver.name}` : ''}`,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt
    }))

    // Get summary statistics
    const summary = await prisma.$queryRaw`
      SELECT 
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as totalIncome,
        SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as totalExpense,
        COUNT(*) as totalTransactions
      FROM (
        SELECT amount FROM expenses WHERE date >= ${query.startDate || new Date('1900-01-01')} 
          AND date <= ${query.endDate || new Date()}
        UNION ALL
        SELECT amount FROM budgets WHERE year = ${new Date().getFullYear()}
      ) as all_transactions
    ` as any[]

    return NextResponse.json({
      transactions,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: totalCount,
        pages: Math.ceil(totalCount / query.limit)
      },
      summary: summary[0] || {
        totalIncome: 0,
        totalExpense: 0,
        totalTransactions: 0
      }
    })

  } catch (error) {
    console.error('Get transactions error:', error)
    
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

// POST /api/finance/transactions - Create financial transaction
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    const hasPermission = await checkServerPermission('finance', 'create')
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const data = createTransactionSchema.parse(body)

    let transaction: any

    if (data.type === 'EXPENSE') {
      // Validate budget if provided
      if (data.budgetId) {
        const budget = await prisma.budget.findUnique({
          where: { id: data.budgetId }
        })

        if (!budget) {
          return NextResponse.json({
            error: 'Budget tidak ditemukan'
          }, { status: 400 })
        }

        // Check if budget has sufficient remaining amount
        if (budget.remaining < data.amount) {
          return NextResponse.json({
            error: 'Saldo anggaran tidak mencukupi'
          }, { status: 400 })
        }
      }

      // Create expense transaction
      transaction = await prisma.$transaction(async (tx) => {
        // Create expense
        const expense = await tx.expense.create({
          data: {
            budgetId: data.budgetId,
            description: data.description,
            amount: data.amount,
            date: data.date,
            receipt: data.reference,
            createdById: session.user.id
          }
        })

        // Update budget if provided
        if (data.budgetId) {
          await tx.budget.update({
            where: { id: data.budgetId },
            data: {
              spent: { increment: data.amount },
              remaining: { decrement: data.amount }
            }
          })
        }

        return expense
      })

    } else if (data.type === 'INCOME') {
      // Create or update budget for income
      const currentYear = new Date().getFullYear()
      
      transaction = await prisma.budget.upsert({
        where: {
          year_category_subcategory: {
            year: currentYear,
            category: data.category,
            subcategory: data.description
          }
        },
        update: {
          amount: { increment: data.amount }
        },
        create: {
          year: currentYear,
          category: data.category,
          subcategory: data.description,
          description: data.description,
          amount: data.amount,
          spent: 0,
          remaining: data.amount
        }
      })
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        resource: 'financial_transaction',
        resourceId: transaction.id,
        description: `Created ${data.type.toLowerCase()} transaction: ${data.description} - ${data.amount}`
      }
    })

    return NextResponse.json({
      message: 'Transaksi berhasil dibuat',
      transaction: {
        id: transaction.id,
        type: data.type,
        amount: data.amount,
        description: data.description,
        category: data.category,
        date: data.date,
        createdAt: transaction.createdAt
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Create transaction error:', error)
    
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