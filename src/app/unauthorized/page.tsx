/**
 * Unauthorized Page
 * Displayed when user doesn't have permission to access a resource
 */

'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, ArrowLeft, Home } from 'lucide-react'
import { useAuth } from '@/lib/auth/hooks'

export default function UnauthorizedPage() {
  const router = useRouter()
  const { user } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Akses Ditolak</h1>
          <p className="mt-2 text-sm text-gray-600">
            Anda tidak memiliki izin untuk mengakses halaman ini
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center text-red-600">403 - Forbidden</CardTitle>
            <CardDescription className="text-center">
              Halaman yang Anda coba akses memerlukan izin khusus yang tidak Anda miliki.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {user && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Informasi Akun Anda:</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Nama:</strong> {user.name}</p>
                  <p><strong>Username:</strong> {user.username}</p>
                  <p><strong>Role:</strong> {user.role}</p>
                </div>
              </div>
            )}

            <div className="text-sm text-gray-600">
              <p className="mb-2">Kemungkinan penyebab:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Role Anda tidak memiliki akses ke fitur ini</li>
                <li>Izin khusus diperlukan untuk halaman ini</li>
                <li>Akun Anda mungkin tidak aktif</li>
                <li>Sesi login Anda mungkin telah berakhir</li>
              </ul>
            </div>

            <div className="text-sm text-gray-600">
              <p className="mb-2">Yang dapat Anda lakukan:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Hubungi administrator untuk meminta akses</li>
                <li>Kembali ke halaman sebelumnya</li>
                <li>Pergi ke dashboard utama</li>
                <li>Logout dan login kembali</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={() => router.back()}
                variant="outline"
                className="flex-1"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali
              </Button>
              <Button
                onClick={() => router.push('/dashboard')}
                className="flex-1"
              >
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-500">
          <p>
            Jika Anda yakin ini adalah kesalahan, silakan hubungi administrator sistem.
          </p>
        </div>
      </div>
    </div>
  )
}