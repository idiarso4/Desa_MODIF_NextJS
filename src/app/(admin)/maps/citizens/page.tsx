"use client"
import dynamic from "next/dynamic"
import { useState } from "react"
import useSWR from "swr"

const LeafletMap = dynamic(() => import("@/components/map/LeafletMap").then(m => m.LeafletMap), { ssr: false })

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function CitizenLocationsPage() {
  const { data: citizensRes } = useSWR("/api/citizens/locations", fetcher)
  const citizens = citizensRes?.data ?? []
  const [selectedCitizen, setSelectedCitizen] = useState<{
    id: string
    name: string
    latitude?: number | null
    longitude?: number | null
    address?: {
      street?: string | null
      village?: string | null
      district?: string | null
      regency?: string | null
      postalCode?: string | null
    } | null
  } | null>(null)

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Peta Lokasi Penduduk</h1>
      
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <LeafletMap center={[-6.175392, 106.827153]} zoom={13} />
        </div>
        
        <div className="space-y-4">
          <div className="border rounded p-4 bg-white">
            <h2 className="font-medium mb-3">Daftar Penduduk</h2>
            <div className="space-y-2 max-h-96 overflow-auto">
              {citizens.map((citizen: {
                id: string
                name: string
                latitude?: number | null
                longitude?: number | null
                address?: {
                  street?: string | null
                  village?: string | null
                  district?: string | null
                  regency?: string | null
                  postalCode?: string | null
                } | null
              }) => (
                <div 
                  key={citizen.id} 
                  className="border rounded p-2 cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelectedCitizen(citizen)}
                >
                  <div className="font-medium text-sm">{citizen.name}</div>
                  <div className="text-xs text-gray-600">
                    {citizen.address?.street}, {citizen.address?.village}
                  </div>
                  {citizen.latitude && citizen.longitude && (
                    <div className="text-xs text-blue-600">
                      📍 {citizen.latitude.toFixed(4)}, {citizen.longitude.toFixed(4)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {selectedCitizen && (
            <div className="border rounded p-4 bg-white">
              <h2 className="font-medium mb-3">Detail Penduduk</h2>
              <div className="space-y-2 text-sm">
                <div><strong>Nama:</strong> {selectedCitizen.name}</div>
                <div><strong>Alamat:</strong></div>
                <div className="pl-2">
                  {selectedCitizen.address?.street}<br />
                  {selectedCitizen.address?.village}, {selectedCitizen.address?.district}<br />
                  {selectedCitizen.address?.regency} {selectedCitizen.address?.postalCode}
                </div>
                {selectedCitizen.latitude && selectedCitizen.longitude && (
                  <div><strong>Koordinat:</strong> {selectedCitizen.latitude}, {selectedCitizen.longitude}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 