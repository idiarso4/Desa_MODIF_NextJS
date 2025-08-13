"use client"
import { complaintSchema } from "@/lib/validations"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

export default function PengaduanPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting, isSubmitSuccessful } } = useForm({
    resolver: zodResolver(complaintSchema),
  })

  async function onSubmit(values: unknown) {
    const res = await fetch('/api/public/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    return res.ok
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container py-10 max-w-2xl">
        <h1 className="text-2xl font-semibold mb-6">Form Pengaduan</h1>
        {isSubmitSuccessful && (
          <div className="mb-4 rounded bg-green-50 border border-green-200 text-green-700 px-3 py-2 text-sm">
            Pengaduan Anda telah dikirim. Terima kasih.
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Judul</label>
            <input className="border rounded px-3 py-2 text-sm w-full" {...register('title')} />
            {errors.title && <p className="text-sm text-red-600">{String(errors.title.message)}</p>}
          </div>
          <div>
            <label className="block text-sm mb-1">Kategori</label>
            <input className="border rounded px-3 py-2 text-sm w-full" {...register('category')} />
            {errors.category && <p className="text-sm text-red-600">{String(errors.category.message)}</p>}
          </div>
          <div>
            <label className="block text-sm mb-1">Prioritas</label>
            <select className="border rounded px-3 py-2 text-sm w-full" {...register('priority')}>
              {['LOW','MEDIUM','HIGH','URGENT'].map((p) => (<option key={p} value={p}>{p}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Deskripsi</label>
            <textarea rows={5} className="border rounded px-3 py-2 text-sm w-full" {...register('description')} />
            {errors.description && <p className="text-sm text-red-600">{String(errors.description.message)}</p>}
          </div>
          <div className="pt-2">
            <button disabled={isSubmitting} className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60">
              {isSubmitting ? 'Mengirim...' : 'Kirim Pengaduan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

