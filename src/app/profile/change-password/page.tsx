/**
 * Change Password Page
 * Interface for users to change their password
 */

'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Key, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

interface PasswordStrength {
  score: number
  feedback: string[]
  color: string
}

export default function ChangePasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Password strength checker
  const checkPasswordStrength = (password: string): PasswordStrength => {
    let score = 0
    const feedback: string[] = []

    if (password.length >= 8) {
      score += 25
    } else {
      feedback.push('Minimal 8 karakter')
    }

    if (/[a-z]/.test(password)) {
      score += 25
    } else {
      feedback.push('Gunakan huruf kecil')
    }

    if (/[A-Z]/.test(password)) {
      score += 25
    } else {
      feedback.push('Gunakan huruf besar')
    }

    if (/[0-9]/.test(password)) {
      score += 25
    } else {
      feedback.push('Gunakan angka')
    }

    let color = 'bg-red-500'
    if (score >= 75) color = 'bg-green-500'
    else if (score >= 50) color = 'bg-yellow-500'
    else if (score >= 25) color = 'bg-orange-500'

    return { score, feedback, color }
  }

  const passwordStrength = checkPasswordStrength(formData.newPassword)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    // Validation
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Password baru dan konfirmasi password tidak cocok' })
      setIsLoading(false)
      return
    }

    if (passwordStrength.score < 75) {
      setMessage({ type: 'error', text: 'Password terlalu lemah. Gunakan kombinasi huruf besar, kecil, dan angka.' })
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'Password berhasil diubah' })
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      } else {
        setMessage({ type: 'error', text: data.error || 'Gagal mengubah password' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan saat mengubah password' })
    } finally {
      setIsLoading(false)
    }
  }

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  return (
    <MainLayout title="Ubah Password">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Link 
            href="/profile" 
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Profil
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Ubah Password
            </CardTitle>
            <CardDescription>
              Pastikan password baru Anda kuat dan mudah diingat
            </CardDescription>
          </CardHeader>
          <CardContent>
            {message && (
              <Alert className={`mb-6 ${message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                <div className="flex items-center gap-2">
                  {message.type === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription className={message.type === 'error' ? 'text-red-700' : 'text-green-700'}>
                    {message.text}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Current Password */}
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Password Saat Ini</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPasswords.current ? 'text' : 'password'}
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    placeholder="Masukkan password saat ini"
                    required
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => togglePasswordVisibility('current')}
                  >
                    {showPasswords.current ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword">Password Baru</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPasswords.new ? 'text' : 'password'}
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    placeholder="Masukkan password baru"
                    required
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => togglePasswordVisibility('new')}
                  >
                    {showPasswords.new ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {formData.newPassword && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Kekuatan Password:</span>
                      <span className={`font-medium ${
                        passwordStrength.score >= 75 ? 'text-green-600' :
                        passwordStrength.score >= 50 ? 'text-yellow-600' :
                        passwordStrength.score >= 25 ? 'text-orange-600' : 'text-red-600'
                      }`}>
                        {passwordStrength.score >= 75 ? 'Kuat' :
                         passwordStrength.score >= 50 ? 'Sedang' :
                         passwordStrength.score >= 25 ? 'Lemah' : 'Sangat Lemah'}
                      </span>
                    </div>
                    <Progress value={passwordStrength.score} className="h-2" />
                    {passwordStrength.feedback.length > 0 && (
                      <ul className="text-xs text-gray-600 space-y-1">
                        {passwordStrength.feedback.map((item, index) => (
                          <li key={index} className="flex items-center gap-1">
                            <XCircle className="h-3 w-3 text-red-500" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Ulangi password baru"
                    required
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => togglePasswordVisibility('confirm')}
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>

                {/* Password Match Indicator */}
                {formData.confirmPassword && (
                  <div className="flex items-center gap-2 text-sm">
                    {formData.newPassword === formData.confirmPassword ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-green-600">Password cocok</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-red-600">Password tidak cocok</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Security Tips */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Tips Keamanan Password:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Gunakan minimal 8 karakter</li>
                  <li>• Kombinasikan huruf besar, kecil, dan angka</li>
                  <li>• Hindari menggunakan informasi pribadi</li>
                  <li>• Jangan gunakan password yang sama di tempat lain</li>
                  <li>• Ubah password secara berkala</li>
                </ul>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  disabled={isLoading || passwordStrength.score < 75 || formData.newPassword !== formData.confirmPassword}
                  className="flex-1"
                >
                  {isLoading ? 'Mengubah Password...' : 'Ubah Password'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setFormData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    })
                    setMessage(null)
                  }}
                  disabled={isLoading}
                >
                  Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}