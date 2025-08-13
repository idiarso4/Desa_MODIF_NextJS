"use client"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function BeritaPage() {
  const { data, isLoading } = useSWR("/api/public/articles", fetcher)
  const articles: Array<{ id: string; title: string; excerpt: string; category?: { name: string } | null; publishedAt: string }>
    = data?.data ?? []

  return (
    <div className="min-h-screen bg-white">
      <div className="container py-10">
        <h1 className="text-2xl font-semibold mb-6">Berita Desa</h1>
        {isLoading ? (
          <p>Memuat...</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {articles.map((a) => (
              <article key={a.id} className="border rounded p-4">
                <h2 className="text-lg font-semibold">{a.title}</h2>
                <p className="text-sm text-gray-500">{new Date(a.publishedAt).toLocaleDateString("id-ID")}</p>
                <p className="mt-2 text-gray-700">{a.excerpt}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

