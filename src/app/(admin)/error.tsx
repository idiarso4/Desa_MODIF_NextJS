"use client"
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-6">
      <p className="text-sm text-red-600">Terjadi kesalahan: {error.message}</p>
      <button onClick={reset} className="mt-3 px-3 py-2 rounded bg-blue-600 text-white text-sm">Coba Lagi</button>
    </div>
  )
}

