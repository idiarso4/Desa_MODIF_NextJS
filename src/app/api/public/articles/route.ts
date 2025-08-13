import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q") ?? ""
  try {
    const articles = await prisma.article.findMany({
      where: {
        published: true,
        OR: q
          ? [
              { title: { contains: q, mode: "insensitive" } },
              { content: { contains: q, mode: "insensitive" } },
            ]
          : undefined,
      },
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        publishedAt: true,
        category: { select: { name: true, slug: true } },
      },
    })
    return NextResponse.json({ success: true, data: articles })
  } catch {
    return NextResponse.json({ success: false, error: "Gagal memuat artikel" }, { status: 500 })
  }
}

