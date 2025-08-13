import { prisma } from "@/lib/prisma"
import { budgetSchema } from "@/lib/validations"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const budgets = await prisma.budget.findMany({ orderBy: { year: "desc" } })
    return NextResponse.json({ success: true, data: budgets })
  } catch {
    return NextResponse.json({ success: false, error: "Gagal memuat anggaran" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = budgetSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })
    }
    const created = await prisma.budget.create({ data: parsed.data })
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch {
    return NextResponse.json({ success: false, error: "Gagal membuat anggaran" }, { status: 500 })
  }
}

