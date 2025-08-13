"use client"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function UsersPage() {
  const { data, isLoading } = useSWR("/api/users", fetcher)
  const users: Array<{ id: string; username: string; email: string; name: string; role?: { id: string; name: string } | null }> = data?.data ?? []

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Pengguna</h1>
        <a href="/users/new" className="px-3 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700">Tambah Pengguna</a>
      </div>
      {isLoading ? (
        <p>Memuat...</p>
      ) : (
        <div className="border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2">Nama</th>
                <th className="text-left p-2">Username</th>
                <th className="text-left p-2">Email</th>
                <th className="text-left p-2">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="p-2">{u.name}</td>
                  <td className="p-2">{u.username}</td>
                  <td className="p-2">{u.email}</td>
                  <td className="p-2">{u.role?.name ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

