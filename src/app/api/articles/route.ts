import { prisma } from "@/lib/prisma"
import { articleSchema } from "@/lib/validations"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const articles = await prisma.article.findMany({
      orderBy: { createdAt: "desc" },
      include: { category: true, author: { select: { id: true, name: true } } },
    })
    return NextResponse.json({ success: true, data: articles })
  } catch {
    return NextResponse.json({ success: false, error: "Gagal memuat artikel" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = articleSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })
    }
    const { categoryId, ...rest } = parsed.data as { categoryId?: string; title: string; slug: string; content: string; excerpt?: string; published: boolean }
    const created = await prisma.article.create({
      data: {
        ...rest,
        // For demo purposes, assign to admin author if exists, else any first user
        author: {
          connect: await (async () => {
            const admin = await prisma.user.findFirst({ where: { username: 'admin' } })
            if (admin) return { id: admin.id }
            const anyUser = await prisma.user.findFirst()
            return anyUser ? { id: anyUser.id } : { id: '' as unknown as string }
          })(),
        },
        ...(categoryId ? { category: { connect: { id: categoryId } } } : {}),
      },
    })
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch {
    return NextResponse.json({ success: false, error: "Gagal membuat artikel" }, { status: 500 })
  }
}

