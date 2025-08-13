"use client"
import { Input } from "@/components/ui/input"
import { articleSchema } from "@/lib/validations"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"

export default function NewArticlePage() {
  const router = useRouter()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(articleSchema),
  })

  async function onSubmit(values: unknown) {
    const res = await fetch('/api/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    if (res.ok) router.push('/public/articles')
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Artikel Baru</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
        <div>
          <label className="block text-sm mb-1">Judul</label>
          <Input {...register('title')} />
          {errors.title && <p className="text-sm text-red-600">{String(errors.title.message)}</p>}
        </div>
        <div>
          <label className="block text-sm mb-1">Slug</label>
          <Input {...register('slug')} />
          {errors.slug && <p className="text-sm text-red-600">{String(errors.slug.message)}</p>}
        </div>
        <div>
          <label className="block text-sm mb-1">Kategori ID (opsional)</label>
          <Input {...register('categoryId')} />
        </div>
        <div>
          <label className="block text-sm mb-1">Excerpt (opsional)</label>
          <Input {...register('excerpt')} />
        </div>
        <div>
          <label className="block text-sm mb-1">Konten</label>
          <textarea rows={10} className="border rounded px-3 py-2 text-sm w-full" {...register('content')} />
          {errors.content && <p className="text-sm text-red-600">{String(errors.content.message)}</p>}
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="published" {...register('published')} />
          <label htmlFor="published" className="text-sm">Publikasikan</label>
        </div>
        <div className="pt-2">
          <button disabled={isSubmitting} className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60">
            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  )
}

