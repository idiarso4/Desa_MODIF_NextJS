/**
 * Login Page
 * Modern, accessible, and user-friendly authentication interface
 */

'use client'

import { useState, useEffect } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Eye, EyeOff, Shield, AlertTriangle, Building2, Info } from 'lucide-react'
import { useAuth } from '@/lib/auth/hooks'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [attemptCount, setAttemptCount] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [lockoutTime, setLockoutTime] = useState(0)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated } = useAuth()
  
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const errorParam = searchParams.get('error')

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push(callbackUrl)
    }
  }, [isAuthenticated, router, callbackUrl])

  // Handle error from URL params
  useEffect(() => {
    if (errorParam) {
      switch (errorParam) {
        case 'AccountInactive':
          setError('Akun Anda tidak aktif. Hubungi administrator.')
          break
        case 'AccessDenied':
          setError('Akses ditolak. Anda tidak memiliki izin.')
          break
        case 'SessionRequired':
          setError('Sesi Anda telah berakhir. Silakan login kembali.')
          break
        default:
          setError('Terjadi kesalahan saat login.')
      }
    }
  }, [errorParam])

  // Handle account lockout
  useEffect(() => {
    if (attemptCount >= 5) {
      setIsLocked(true)
      setLockoutTime(300) // 5 minutes lockout
      
      const timer = setInterval(() => {
        setLockoutTime((prev) => {
          if (prev <= 1) {
            setIsLocked(false)
            setAttemptCount(0)
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [attemptCount])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isLocked) {
      setError(`Akun terkunci. Coba lagi dalam ${Math.floor(lockoutTime / 60)}:${(lockoutTime % 60).toString().padStart(2, '0')}`)
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      })

      if (result?.error) {
        setAttemptCount(prev => prev + 1)
        
        // Customize error messages
        switch (result.error) {
          case 'Username atau password salah':
            setError(`Username atau password salah. Percobaan ${attemptCount + 1}/5`)
            break
          case 'Akun Anda tidak aktif. Hubungi administrator.':
            setError('Akun Anda tidak aktif. Hubungi administrator.')
            break
          default:
            setError(result.error)
        }
      } else {
        // Reset attempt count on successful login
        setAttemptCount(0)
        
        // Refresh session and redirect
        await getSession()
        router.push(callbackUrl)
        router.refresh()
      }
    } catch (error) {
      setAttemptCount(prev => prev + 1)
      setError('Terjadi kesalahan saat login')
      console.error('Login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatLockoutTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-4 px-4 sm:py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 sm:h-20 sm:w-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mb-4 sm:mb-6 shadow-lg">
            <Shield className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">OpenSID</h1>
          <p className="text-sm sm:text-base text-gray-600 font-medium">
            Sistem Informasi Desa
          </p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Versi 2.0.0 - Next.js Edition
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg border-0 sm:border">
          <CardHeader className="space-y-1 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-xl sm:text-2xl text-center">Masuk ke Sistem</CardTitle>
            <CardDescription className="text-center text-sm sm:text-base">
              Masukkan username dan password Anda untuk mengakses sistem
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              {/* Lockout Warning */}
              {isLocked && (
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Akun terkunci karena terlalu banyak percobaan login yang gagal.
                    Coba lagi dalam {formatLockoutTime(lockoutTime)}.
                  </AlertDescription>
                </Alert>
              )}

              {/* Attempt Warning */}
              {attemptCount > 0 && attemptCount < 5 && !isLocked && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Percobaan login: {attemptCount}/5.
                    Akun akan terkunci setelah 5 percobaan gagal.
                  </AlertDescription>
                </Alert>
              )}

              {/* Username Field */}
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="username" className="text-sm sm:text-base">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username atau email"
                  required
                  disabled={isLoading || isLocked}
                  autoComplete="username"
                  className="h-10 sm:h-11 text-sm sm:text-base transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="password" className="text-sm sm:text-base">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    required
                    disabled={isLoading || isLocked}
                    autoComplete="current-password"
                    className="h-10 sm:h-11 pr-10 text-sm sm:text-base transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-blue-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading || isLocked}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-10 sm:h-11 bg-blue-600 hover:bg-blue-700 transition-colors duration-200 text-sm sm:text-base"
                disabled={isLoading || isLocked}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : isLocked ? (
                  `Terkunci (${formatLockoutTime(lockoutTime)})`
                ) : (
                  'Masuk'
                )}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
              <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Demo Credentials:</p>
              <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                <p>Username: <code className="bg-gray-200 px-1 rounded text-xs">admin</code></p>
                <p>Password: <code className="bg-gray-200 px-1 rounded text-xs">admin123</code></p>
              </div>
            </div>

            {/* Security Notice */}
            <div className="mt-4 sm:mt-6 text-center">
              <p className="text-xs text-gray-500 leading-relaxed">
                Sistem ini dilindungi dengan keamanan berlapis.
                Aktivitas login akan dicatat untuk audit keamanan.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs sm:text-sm text-gray-500 space-y-1">
          <p>© 2024 OpenSID. Sistem Informasi Desa.</p>
          <p>Versi 2.0.0 - Next.js Edition</p>
        </div>
      </div>
    </div>
  )
}