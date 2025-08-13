"use client"
import dynamic from "next/dynamic"

const LeafletMap = dynamic(() => import("@/components/map/LeafletMap").then(m => m.LeafletMap), { ssr: false })

export default function MapsPage() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Peta Desa</h1>
      <LeafletMap center={[-6.175392, 106.827153]} zoom={13} />
    </div>
  )
}

