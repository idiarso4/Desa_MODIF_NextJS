"use client"
import { citizenSchema } from "@/lib/validations"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
// import type { z } from "zod"
import { Input } from "@/components/ui/input"

// Using resolver for validation; rely on runtime validation instead of compile-time inference here

export default function NewCitizenPage() {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(citizenSchema),
    defaultValues: {
      gender: "L",
      education: "SMA",
      maritalStatus: "BELUM_KAWIN",
      isHeadOfFamily: false,
    },
  })

  async function onSubmit(values: unknown) {
    const res = await fetch("/api/citizens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
    if (res.ok) {
      router.push("/citizens")
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Tambah Penduduk</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
        <div>
          <label className="block text-sm mb-1">NIK</label>
          <Input {...register("nik")} placeholder="16 digit NIK" />
          {errors.nik && <p className="text-sm text-red-600">{errors.nik.message}</p>}
        </div>
        <div>
          <label className="block text-sm mb-1">Nama</label>
          <Input {...register("name")} placeholder="Nama lengkap" />
          {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Tempat Lahir</label>
            <Input {...register("birthPlace")} />
            {errors.birthPlace && <p className="text-sm text-red-600">{errors.birthPlace.message}</p>}
          </div>
          <div>
            <label className="block text-sm mb-1">Tanggal Lahir</label>
            <Input type="date" {...register("birthDate", { valueAsDate: true })} />
            {errors.birthDate && <p className="text-sm text-red-600">{errors.birthDate.message as string}</p>}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-1">Jenis Kelamin</label>
            <select className="border rounded px-3 py-2 text-sm w-full" {...register("gender")}>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Pendidikan</label>
            <select className="border rounded px-3 py-2 text-sm w-full" {...register("education")}>
              {[
                "TIDAK_SEKOLAH","SD","SMP","SMA","D1","D2","D3","S1","S2","S3"
              ].map((e) => (<option key={e} value={e}>{e}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Status Kawin</label>
            <select className="border rounded px-3 py-2 text-sm w-full" {...register("maritalStatus")}>
              {["BELUM_KAWIN","KAWIN","CERAI_HIDUP","CERAI_MATI"].map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Pekerjaan</label>
            <Input {...register("occupation")} />
            {errors.occupation && <p className="text-sm text-red-600">{errors.occupation.message}</p>}
          </div>
          <div className="flex items-center gap-2 mt-6">
            <input id="isHeadOfFamily" type="checkbox" {...register("isHeadOfFamily")} />
            <label htmlFor="isHeadOfFamily" className="text-sm">Kepala Keluarga</label>
          </div>
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

