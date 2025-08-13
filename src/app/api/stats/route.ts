import { citizenRepository } from "@/lib/repositories/citizen"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const citizens = await citizenRepository.getStatistics()
    return NextResponse.json({ success: true, data: { citizens } })
  } catch {
    return NextResponse.json({ success: false, error: "Gagal memuat statistik" }, { status: 500 })
  }
}

