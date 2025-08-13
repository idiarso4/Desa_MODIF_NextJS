"use client"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function FamiliesPage() {
  const { data, isLoading } = useSWR("/api/families", fetcher)
  const families: Array<{ id: string; familyNumber: string }> = data?.data ?? []

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Keluarga</h1>
        <a href="/families/new" className="px-3 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700">Tambah Keluarga</a>
      </div>
      {isLoading ? (
        <p>Memuat...</p>
      ) : (
        <div className="space-y-2">
          {families.map((f) => (
            <div key={f.id} className="border rounded p-3">
              <div className="font-medium">No. KK: {f.familyNumber}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

