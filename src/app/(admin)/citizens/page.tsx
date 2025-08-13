"use client"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function CitizensPage() {
  const { data, isLoading } = useSWR("/api/citizens", fetcher)

  if (isLoading) return <div className="p-6">Memuat...</div>

  const citizens: Array<{ id: string; name: string; nik: string }> = data?.data ?? []
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Data Penduduk</h1>
        <a
          href="/citizens/new"
          className="px-3 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
        >
          Tambah Penduduk
        </a>
      </div>
      <div className="space-y-2">
        {citizens.map((c) => (
          <div key={c.id} className="border rounded p-3">
            <div className="font-medium">{c.name}</div>
            <div className="text-sm text-gray-500">NIK: {c.nik}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

