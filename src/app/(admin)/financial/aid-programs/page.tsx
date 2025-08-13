"use client"
import { aidProgramSchema } from "@/lib/validations"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function AidProgramsPage() {
  const { data: programsRes, mutate: refreshPrograms } = useSWR("/api/financial/aid-programs", fetcher)
  const programs: Array<{
    id: string
    name: string
    description?: string | null
    startDate: string
    endDate?: string | null
    budget?: number | null
    criteria: string
    status: string
    createdBy: { name: string | null }
    recipients: Array<{ citizen: { name: string | null } }>
  }> = programsRes?.data ?? []

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Program Bantuan</h1>

      <section className="grid md:grid-cols-2 gap-6">
        <div className="border rounded p-4 bg-white">
          <h2 className="font-medium mb-3">Tambah Program Bantuan</h2>
          <AidProgramForm onSuccess={refreshPrograms} />
        </div>
        <div className="border rounded p-4 bg-white">
          <h2 className="font-medium mb-3">Daftar Program Bantuan</h2>
          <div className="space-y-3 max-h-96 overflow-auto">
            {programs.map((program) => (
              <div key={program.id} className="border rounded p-3">
                <div className="font-medium">{program.name}</div>
                <div className="text-sm text-gray-600">{program.description}</div>
                <div className="text-sm">
                  Periode: {new Date(program.startDate).toLocaleDateString('id-ID')}
                  {program.endDate && ` - ${new Date(program.endDate).toLocaleDateString('id-ID')}`}
                </div>
                <div className="text-sm">
                  Anggaran: {program.budget ? `Rp ${Number(program.budget).toLocaleString('id-ID')}` : 'Tidak ditentukan'}
                </div>
                <div className="text-sm">Penerima: {program.recipients.length} orang</div>
                <div className="text-xs text-gray-500">Dibuat oleh: {program.createdBy.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function AidProgramForm({ onSuccess }: { onSuccess: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    resolver: zodResolver(aidProgramSchema),
  })
  
  async function onSubmit(values: unknown) {
    const res = await fetch('/api/financial/aid-programs', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(values) 
    })
    if (res.ok) { 
      reset()
      onSuccess() 
    }
  }
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <input 
        placeholder="Nama Program" 
        className="border rounded px-3 py-2 text-sm w-full" 
        {...register('name')} 
      />
      <textarea 
        placeholder="Deskripsi (opsional)" 
        className="border rounded px-3 py-2 text-sm w-full" 
        {...register('description')} 
      />
      <div className="grid grid-cols-2 gap-2">
        <input 
          type="date" 
          className="border rounded px-3 py-2 text-sm" 
          {...register('startDate')} 
        />
        <input 
          type="date" 
          className="border rounded px-3 py-2 text-sm" 
          {...register('endDate')} 
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input 
          placeholder="Anggaran (opsional)" 
          className="border rounded px-3 py-2 text-sm" 
          {...register('budget')} 
        />
        <input 
          placeholder="Kriteria" 
          className="border rounded px-3 py-2 text-sm" 
          {...register('criteria')} 
        />
      </div>
      {Boolean((errors as Record<string, unknown>).root) && (
        <p className="text-sm text-red-600">Terjadi kesalahan.</p>
      )}
      <button 
        disabled={isSubmitting} 
        className="px-4 py-2 rounded bg-blue-600 text-white text-sm"
      >
        Simpan Program
      </button>
    </form>
  )
} 