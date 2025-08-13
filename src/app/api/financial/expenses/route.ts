import { prisma } from "@/lib/prisma"
import { expenseSchema } from "@/lib/validations"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({ orderBy: { date: "desc" }, include: { budget: true } })
    return NextResponse.json({ success: true, data: expenses })
  } catch {
    return NextResponse.json({ success: false, error: "Gagal memuat pengeluaran" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = expenseSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })
    }
    const createdBy = await (async (): Promise<string> => {
      const admin = await prisma.user.findFirst({ where: { username: 'admin' } })
      if (admin) return admin.id
      const anyUser = await prisma.user.findFirst()
      return anyUser ? anyUser.id : ''
    })()
    const { budgetId, description, amount, date, receipt } = parsed.data
    const created = await prisma.expense.create({
      data: {
        budgetId,
        description,
        amount,
        date,
        receipt,
        createdById: createdBy,
      },
    })
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch {
    return NextResponse.json({ success: false, error: "Gagal membuat pengeluaran" }, { status: 500 })
  }
}

