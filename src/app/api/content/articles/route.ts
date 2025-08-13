/**
 * Articles API Routes
 * CRUD operations for article/news management
 */

import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, getCurrentUser } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createArticleSchema = z.object({
  title: z.string().min(1, 'Judul harus diisi').max(200, 'Judul maksimal 200 karakter'),
  slug: z.string().min(1, 'Slug harus diisi').max(200, 'Slug maksimal 200 karakter'),
  content: z.string().min(1, 'Konten harus diisi'),
  excerpt: z.string().max(500, 'Ringkasan maksimal 500 karakter').optional(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  published: z.boolean().default(false),
  publishedAt: z.string().optional()
})

/**
 * GET /api/content/articles
 * Get all articles with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const published = searchParams.get('published')
    const featured = searchParams.get('featured')
    const categoryId = searchParams.get('categoryId')
    const search = searchParams.get('search') || ''
    const isPublic = searchParams.get('public') === 'true'

    // For public access, only check published articles
    if (!isPublic) {
      await requirePermission('content', 'read')
    }

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (isPublic || published === 'true') {
      where.published = true
    } else if (published === 'false') {
      where.published = false
    }

    if (featured === 'true') {
      where.featured = true
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          author: {
            select: {
              id: true,
              name: true,
              username: true
            }
          }
        },
        orderBy: [
          { featured: 'desc' },
          { publishedAt: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.article.count({ where })
    ])

    const formattedArticles = articles.map(article => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      content: isPublic ? undefined : article.content, // Don't send full content for public list
      excerpt: article.excerpt,
      featured: article.featured,
      published: article.published,
      publishedAt: article.publishedAt?.toISOString(),
      tags: article.tags,
      viewCount: article.viewCount,
      category: article.category,
      author: article.author,
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString()
    }))

    return NextResponse.json({
      articles: formattedArticles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error getting articles:', error)
    
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
 * POST /api/content/articles
 * Create a new article
 */
export async function POST(request: NextRequest) {
  try {
    // Check permission
    await requirePermission('content', 'create')

    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = createArticleSchema.safeParse(body)

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

    // Check if slug already exists
    const existingArticle = await prisma.article.findUnique({
      where: { slug: data.slug }
    })

    if (existingArticle) {
      return NextResponse.json(
        { error: 'Slug sudah digunakan' },
        { status: 409 }
      )
    }

    // Check if category exists (if provided)
    if (data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId }
      })

      if (!category) {
        return NextResponse.json(
          { error: 'Kategori tidak ditemukan' },
          { status: 400 }
        )
      }
    }

    // Create article
    const article = await prisma.article.create({
      data: {
        title: data.title,
        slug: data.slug,
        content: data.content,
        excerpt: data.excerpt,
        categoryId: data.categoryId,
        tags: data.tags,
        featured: data.featured,
        published: data.published,
        publishedAt: data.published && data.publishedAt ? new Date(data.publishedAt) : 
                    data.published ? new Date() : null,
        authorId: currentUser.id
      },
      include: {
        category: {
          select: {
            name: true
          }
        }
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: currentUser.id,
        action: 'CREATE_ARTICLE',
        resource: 'content',
        resourceId: article.id,
        description: `Created article: ${article.title}`,
      }
    })

    return NextResponse.json(
      { 
        message: 'Artikel berhasil dibuat',
        article: {
          id: article.id,
          title: article.title,
          slug: article.slug,
          published: article.published,
          category: article.category
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating article:', error)
    
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