"use client"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function ArticlesAdminPage() {
  const { data, isLoading } = useSWR("/api/articles", fetcher)
  const articles: Array<{ id: string; title: string; slug: string; published: boolean; category?: { name: string } | null }> = data?.data ?? []

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Artikel</h1>
        <a href="/public/articles/new" className="px-3 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700">Artikel Baru</a>
      </div>
      {isLoading ? (
        <p>Memuat...</p>
      ) : (
        <div className="border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2">Judul</th>
                <th className="text-left p-2">Slug</th>
                <th className="text-left p-2">Kategori</th>
                <th className="text-left p-2">Publikasi</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="p-2">{a.title}</td>
                  <td className="p-2">{a.slug}</td>
                  <td className="p-2">{a.category?.name ?? '-'}</td>
                  <td className="p-2">{a.published ? 'Ya' : 'Tidak'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

