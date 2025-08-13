"use client"
import { Input } from "@/components/ui/input"
import { userSchema } from "@/lib/validations"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"

export default function NewUserPage() {
  const router = useRouter()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(userSchema),
  })

  async function onSubmit(values: unknown) {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
    if (res.ok) router.push("/users")
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Tambah Pengguna</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
        <div>
          <label className="block text-sm mb-1">Nama</label>
          <Input {...register("name")} />
          {errors.name && <p className="text-sm text-red-600">{String(errors.name.message)}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Username</label>
            <Input {...register("username")} />
            {errors.username && <p className="text-sm text-red-600">{String(errors.username.message)}</p>}
          </div>
          <div>
            <label className="block text-sm mb-1">Email</label>
            <Input type="email" {...register("email")} />
            {errors.email && <p className="text-sm text-red-600">{String(errors.email.message)}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Password</label>
            <Input type="password" {...register("password")} />
            {errors.password && <p className="text-sm text-red-600">{String(errors.password.message)}</p>}
          </div>
          <div>
            <label className="block text-sm mb-1">Role ID</label>
            <Input {...register("roleId")} />
            {errors.roleId && <p className="text-sm text-red-600">{String(errors.roleId.message)}</p>}
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

