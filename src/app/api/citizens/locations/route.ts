import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const citizens = await prisma.citizen.findMany({
      where: {
        OR: [
          { latitude: { not: null } },
          { longitude: { not: null } }
        ]
      },
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
        address: {
          select: {
            street: true,
            village: true,
            district: true,
            regency: true,
            postalCode: true
          }
        }
      }
    })
    
    return NextResponse.json({ success: true, data: citizens })
  } catch {
    return NextResponse.json({ success: false, error: "Gagal memuat data lokasi" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { citizenId, latitude, longitude } = body
    
    if (!citizenId || !latitude || !longitude) {
      return NextResponse.json({ success: false, error: "Data tidak lengkap" }, { status: 400 })
    }
    
    const updated = await prisma.citizen.update({
      where: { id: citizenId },
      data: { latitude, longitude }
    })
    
    return NextResponse.json({ success: true, data: updated })
  } catch {
    return NextResponse.json({ success: false, error: "Gagal memperbarui lokasi" }, { status: 500 })
  }
} 