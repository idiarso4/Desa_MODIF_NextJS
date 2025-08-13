"use client"
import { budgetSchema, expenseSchema } from "@/lib/validations"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function FinancialPage() {
  const { data: budgetRes, mutate: refreshBudgets } = useSWR("/api/financial/budgets", fetcher)
  const { data: expenseRes, mutate: refreshExpenses } = useSWR("/api/financial/expenses", fetcher)
  const budgets: Array<{ id: string; year: number; category: string; subcategory?: string | null; description: string; amount: number }>
    = budgetRes?.data ?? []
  const expenses: Array<{ id: string; date: string; amount: number; description: string; receipt?: string | null; budget?: { category: string; subcategory?: string | null } | null }>
    = expenseRes?.data ?? []

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Keuangan Desa</h1>

      <section className="grid md:grid-cols-2 gap-6">
        <div className="border rounded p-4 bg-white">
          <h2 className="font-medium mb-3">Tambah Anggaran</h2>
          <BudgetForm onSuccess={refreshBudgets} />
        </div>
        <div className="border rounded p-4 bg-white">
          <h2 className="font-medium mb-3">Tambah Pengeluaran</h2>
          <ExpenseForm onSuccess={refreshExpenses} budgets={budgets} />
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-6">
        <div className="border rounded p-4 bg-white">
          <h2 className="font-medium mb-3">Daftar Anggaran</h2>
          <div className="space-y-2 max-h-80 overflow-auto">
            {budgets.map((b) => (
              <div key={b.id} className="border rounded p-3">
                <div className="font-medium">{b.year} - {b.category}{b.subcategory ? ` / ${b.subcategory}` : ''}</div>
                <div className="text-sm text-gray-600">{b.description}</div>
                <div className="text-sm">Rp {Number(b.amount).toLocaleString('id-ID')}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="border rounded p-4 bg-white">
          <h2 className="font-medium mb-3">Daftar Pengeluaran</h2>
          <div className="space-y-2 max-h-80 overflow-auto">
            {expenses.map((e) => (
              <div key={e.id} className="border rounded p-3">
                <div className="font-medium">{new Date(e.date).toLocaleDateString('id-ID')} - Rp {Number(e.amount).toLocaleString('id-ID')}</div>
                <div className="text-sm text-gray-600">{e.description}</div>
                <div className="text-sm">Anggaran: {e.budget?.category} {e.budget?.subcategory ? ` / ${e.budget?.subcategory}` : ''}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function BudgetForm({ onSuccess }: { onSuccess: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    resolver: zodResolver(budgetSchema),
  })
  async function onSubmit(values: unknown) {
    const res = await fetch('/api/financial/budgets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) })
    if (res.ok) { reset(); onSuccess() }
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
      <div className="grid grid-cols-4 gap-2">
        <input placeholder="Tahun" className="border rounded px-2 py-1 text-sm" {...register('year')} />
        <input placeholder="Kategori" className="border rounded px-2 py-1 text-sm" {...register('category')} />
        <input placeholder="Subkategori" className="border rounded px-2 py-1 text-sm" {...register('subcategory')} />
        <input placeholder="Jumlah" className="border rounded px-2 py-1 text-sm" {...register('amount')} />
      </div>
      <input placeholder="Deskripsi" className="border rounded px-2 py-1 text-sm w-full" {...register('description')} />
      {Boolean((errors as Record<string, unknown>).root) && <p className="text-sm text-red-600">Terjadi kesalahan.</p>}
      <button disabled={isSubmitting} className="mt-1 px-3 py-1 rounded bg-blue-600 text-white text-sm">Simpan</button>
    </form>
  )
}

function ExpenseForm({ onSuccess, budgets }: { onSuccess: () => void; budgets: Array<{ id: string; year: number; category: string; subcategory?: string | null }> }) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    resolver: zodResolver(expenseSchema),
  })
  async function onSubmit(values: unknown) {
    const res = await fetch('/api/financial/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) })
    if (res.ok) { reset(); onSuccess() }
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
      <div className="grid grid-cols-5 gap-2">
        <select className="border rounded px-2 py-1 text-sm" {...register('budgetId')}>
          <option value="">Pilih Anggaran</option>
          {budgets.map((b) => (
            <option key={b.id} value={b.id}>{b.year} - {b.category}{b.subcategory ? ` / ${b.subcategory}` : ''}</option>
          ))}
        </select>
        <input type="date" className="border rounded px-2 py-1 text-sm" {...register('date', { valueAsDate: true })} />
        <input placeholder="Jumlah" className="border rounded px-2 py-1 text-sm" {...register('amount')} />
        <input placeholder="Bukti (URL)" className="border rounded px-2 py-1 text-sm" {...register('receipt')} />
        <input placeholder="Deskripsi" className="border rounded px-2 py-1 text-sm" {...register('description')} />
      </div>
      {Boolean((errors as Record<string, unknown>).root) && <p className="text-sm text-red-600">Terjadi kesalahan.</p>}
      <button disabled={isSubmitting} className="mt-1 px-3 py-1 rounded bg-blue-600 text-white text-sm">Simpan</button>
    </form>
  )
}

