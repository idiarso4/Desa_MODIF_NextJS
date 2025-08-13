"use client"
import { Input } from "@/components/ui/input"
import { familySchema } from "@/lib/validations"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"

export default function NewFamilyPage() {
  const router = useRouter()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(familySchema),
  })

  async function onSubmit(values: unknown) {
    const res = await fetch("/api/families", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
    if (res.ok) router.push("/families")
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Tambah Keluarga</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
        <div>
          <label className="block text-sm mb-1">Nomor KK</label>
          <Input {...register("familyNumber")} />
          {errors.familyNumber && <p className="text-sm text-red-600">{String(errors.familyNumber.message)}</p>}
        </div>
        <div>
          <label className="block text-sm mb-1">Status Sosial</label>
          <select className="border rounded px-3 py-2 text-sm w-full" {...register("socialStatus")}> 
            {["MAMPU","KURANG_MAMPU","MISKIN"].map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </div>
        <div className="pt-2">
          <button disabled={isSubmitting} className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60">
            {isSubmitting ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </div>
  )
}

