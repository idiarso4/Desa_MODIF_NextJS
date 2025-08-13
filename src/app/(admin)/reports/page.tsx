"use client"
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())
const COLORS = ["#2563eb", "#db2777", "#16a34a", "#f59e0b"]

export default function ReportsPage() {
  const { data, isLoading } = useSWR("/api/stats", fetcher)
  const stats = data?.data?.citizens
  const genderData = stats
    ? [
        { name: "Laki-laki", value: stats.byGender.male },
        { name: "Perempuan", value: stats.byGender.female },
      ]
    : []

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Laporan & Statistik</h1>
      {isLoading ? (
        <p>Memuat...</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="border rounded p-4 bg-white">
            <h2 className="text-sm text-gray-600 mb-3">Distribusi Jenis Kelamin</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {genderData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

