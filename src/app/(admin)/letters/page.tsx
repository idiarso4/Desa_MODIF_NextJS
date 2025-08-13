"use client"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function LettersPage() {
  const { data, isLoading } = useSWR("/api/letters", fetcher)
  const letters: Array<{ id: string; letterType: string; purpose: string; status: string; citizen: { name: string; nik: string } }> = data?.data ?? []

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Permohonan Surat</h1>
        <a href="/letters/new" className="px-3 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700">Permohonan Baru</a>
      </div>
      {isLoading ? (
        <p>Memuat...</p>
      ) : (
        <div className="border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2">Penduduk</th>
                <th className="text-left p-2">Jenis</th>
                <th className="text-left p-2">Keperluan</th>
                <th className="text-left p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {letters.map((l) => (
                <tr key={l.id} className="border-t">
                  <td className="p-2">{l.citizen.name} ({l.citizen.nik})</td>
                  <td className="p-2">{l.letterType}</td>
                  <td className="p-2">{l.purpose}</td>
                  <td className="p-2">{l.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

