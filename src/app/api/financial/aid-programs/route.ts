import { prisma } from "@/lib/prisma"
import { aidProgramSchema } from "@/lib/validations"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const programs = await prisma.aidProgram.findMany({ 
      orderBy: { startDate: "desc" },
      include: { 
        createdBy: { select: { name: true } },
        recipients: { 
          include: { citizen: { select: { name: true } } },
          orderBy: { createdAt: "desc" }
        }
      }
    })
    return NextResponse.json({ success: true, data: programs })
  } catch {
    return NextResponse.json({ success: false, error: "Gagal memuat program bantuan" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = aidProgramSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })
    }
    
    const createdBy = await (async (): Promise<string> => {
      const admin = await prisma.user.findFirst({ where: { username: 'admin' } })
      if (admin) return admin.id
      const anyUser = await prisma.user.findFirst()
      return anyUser ? anyUser.id : ''
    })()
    
    const { name, description, startDate, endDate, budget, criteria } = parsed.data
    const created = await prisma.aidProgram.create({
      data: {
        name,
        description,
        startDate,
        endDate,
        budget,
        criteria,
        createdById: createdBy,
      },
    })
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch {
    return NextResponse.json({ success: false, error: "Gagal membuat program bantuan" }, { status: 500 })
  }
} 