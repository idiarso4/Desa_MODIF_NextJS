"use client"
import { Input } from "@/components/ui/input"
import { letterRequestSchema } from "@/lib/validations"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"

export default function NewLetterPage() {
  const router = useRouter()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(letterRequestSchema),
  })

  async function onSubmit(values: unknown) {
    const res = await fetch("/api/letters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
    if (res.ok) router.push("/letters")
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Permohonan Surat Baru</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
        <div>
          <label className="block text-sm mb-1">ID Penduduk</label>
          <Input {...register("citizenId")} />
          {errors.citizenId && <p className="text-sm text-red-600">{String(errors.citizenId.message)}</p>}
        </div>
        <div>
          <label className="block text-sm mb-1">Jenis Surat</label>
          <select className="border rounded px-3 py-2 text-sm w-full" {...register("letterType")}>
            {["SURAT_KETERANGAN_DOMISILI","SURAT_KETERANGAN_USAHA","SURAT_KETERANGAN_TIDAK_MAMPU","SURAT_PENGANTAR","LAINNYA"].map((t) => (<option key={t} value={t}>{t}</option>))}
          </select>
          {errors.letterType && <p className="text-sm text-red-600">{String(errors.letterType.message)}</p>}
        </div>
        <div>
          <label className="block text-sm mb-1">Keperluan</label>
          <Input {...register("purpose")} />
          {errors.purpose && <p className="text-sm text-red-600">{String(errors.purpose.message)}</p>}
        </div>
        <div className="pt-2">
          <button disabled={isSubmitting} className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60">
            {isSubmitting ? "Mengirim..." : "Kirim Permohonan"}
          </button>
        </div>
      </form>
    </div>
  )
}

