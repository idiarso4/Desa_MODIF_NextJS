/**
 * Create Citizen Form Component
 * Form for adding new citizen with validation
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingButton } from '@/components/ui/loading'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Save, User } from 'lucide-react'

interface FormData {
  nik: string
  name: string
  birthDate: string
  birthPlace: string
  gender: string
  religion: string
  education: string
  occupation: string
  maritalStatus: string
  bloodType: string
  familyId: string
  isHeadOfFamily: boolean
  addressId: string
}

interface FormErrors {
  [key: string]: string
}

export function CreateCitizenForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})

  const [formData, setFormData] = useState<FormData>({
    nik: '',
    name: '',
    birthDate: '',
    birthPlace: '',
    gender: '',
    religion: '',
    education: '',
    occupation: '',
    maritalStatus: '',
    bloodType: '',
    familyId: '',
    isHeadOfFamily: false,
    addressId: ''
  })

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Required fields validation
    if (!formData.nik) newErrors.nik = 'NIK harus diisi'
    else if (!/^\d{16}$/.test(formData.nik)) newErrors.nik = 'NIK harus 16 digit angka'

    if (!formData.name) newErrors.name = 'Nama harus diisi'
    if (!formData.birthDate) newErrors.birthDate = 'Tanggal lahir harus diisi'
    if (!formData.birthPlace) newErrors.birthPlace = 'Tempat lahir harus diisi'
    if (!formData.gender) newErrors.gender = 'Jenis kelamin harus dipilih'
    if (!formData.religion) newErrors.religion = 'Agama harus dipilih'
    if (!formData.education) newErrors.education = 'Pendidikan harus dipilih'
    if (!formData.occupation) newErrors.occupation = 'Pekerjaan harus diisi'
    if (!formData.maritalStatus) newErrors.maritalStatus = 'Status kawin harus dipilih'

    // Date validation
    if (formData.birthDate) {
      const birthDate = new Date(formData.birthDate)
      const today = new Date()
      if (birthDate > today) {
        newErrors.birthDate = 'Tanggal lahir tidak boleh di masa depan'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      setMessage({ type: 'error', text: 'Mohon perbaiki kesalahan pada form' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/citizens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          isHeadOfFamily: formData.isHeadOfFamily,
          // Remove empty optional fields
          ...(formData.bloodType && { bloodType: formData.bloodType }),
          ...(formData.familyId && { familyId: formData.familyId }),
          ...(formData.addressId && { addressId: formData.addressId })
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'Penduduk berhasil ditambahkan' })
        setTimeout(() => {
          router.push('/citizens')
        }, 2000)
      } else {
        if (data.details) {
          // Handle validation errors from server
          const serverErrors: FormErrors = {}
          Object.keys(data.details).forEach(key => {
            if (data.details[key]._errors) {
              serverErrors[key] = data.details[key]._errors[0]
            }
          })
          setErrors(serverErrors)
        }
        setMessage({ type: 'error', text: data.error || 'Gagal menambahkan penduduk' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan saat menyimpan data' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/citizens">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tambah Penduduk Baru</h2>
          <p className="text-gray-600">Isi form di bawah untuk menambahkan data penduduk</p>
        </div>
      </div>

      {message && (
        <Alert className={`${message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
          <AlertDescription className={message.type === 'error' ? 'text-red-700' : 'text-green-700'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Data Pribadi
            </CardTitle>
            <CardDescription>
              Informasi dasar penduduk
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nik">NIK *</Label>
                <Input
                  id="nik"
                  value={formData.nik}
                  onChange={(e) => handleInputChange('nik', e.target.value)}
                  placeholder="Masukkan 16 digit NIK"
                  maxLength={16}
                  error={errors.nik}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Masukkan nama lengkap"
                  error={errors.name}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthPlace">Tempat Lahir *</Label>
                <Input
                  id="birthPlace"
                  value={formData.birthPlace}
                  onChange={(e) => handleInputChange('birthPlace', e.target.value)}
                  placeholder="Masukkan tempat lahir"
                  error={errors.birthPlace}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate">Tanggal Lahir *</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => handleInputChange('birthDate', e.target.value)}
                  error={errors.birthDate}
                />
              </div>

              <div className="space-y-2">
                <Label>Jenis Kelamin *</Label>
                <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                  <SelectTrigger className={errors.gender ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Pilih jenis kelamin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Laki-laki</SelectItem>
                    <SelectItem value="P">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && <p className="text-sm text-red-600">{errors.gender}</p>}
              </div>

              <div className="space-y-2">
                <Label>Agama *</Label>
                <Select value={formData.religion} onValueChange={(value) => handleInputChange('religion', value)}>
                  <SelectTrigger className={errors.religion ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Pilih agama" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ISLAM">Islam</SelectItem>
                    <SelectItem value="KRISTEN">Kristen</SelectItem>
                    <SelectItem value="KATOLIK">Katolik</SelectItem>
                    <SelectItem value="HINDU">Hindu</SelectItem>
                    <SelectItem value="BUDDHA">Buddha</SelectItem>
                    <SelectItem value="KONGHUCU">Konghucu</SelectItem>
                  </SelectContent>
                </Select>
                {errors.religion && <p className="text-sm text-red-600">{errors.religion}</p>}
              </div>

              <div className="space-y-2">
                <Label>Pendidikan *</Label>
                <Select value={formData.education} onValueChange={(value) => handleInputChange('education', value)}>
                  <SelectTrigger className={errors.education ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Pilih pendidikan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TIDAK_SEKOLAH">Tidak Sekolah</SelectItem>
                    <SelectItem value="SD">SD</SelectItem>
                    <SelectItem value="SMP">SMP</SelectItem>
                    <SelectItem value="SMA">SMA</SelectItem>
                    <SelectItem value="D1">D1</SelectItem>
                    <SelectItem value="D2">D2</SelectItem>
                    <SelectItem value="D3">D3</SelectItem>
                    <SelectItem value="S1">S1</SelectItem>
                    <SelectItem value="S2">S2</SelectItem>
                    <SelectItem value="S3">S3</SelectItem>
                  </SelectContent>
                </Select>
                {errors.education && <p className="text-sm text-red-600">{errors.education}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="occupation">Pekerjaan *</Label>
                <Input
                  id="occupation"
                  value={formData.occupation}
                  onChange={(e) => handleInputChange('occupation', e.target.value)}
                  placeholder="Masukkan pekerjaan"
                  error={errors.occupation}
                />
              </div>

              <div className="space-y-2">
                <Label>Status Kawin *</Label>
                <Select value={formData.maritalStatus} onValueChange={(value) => handleInputChange('maritalStatus', value)}>
                  <SelectTrigger className={errors.maritalStatus ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Pilih status kawin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BELUM_KAWIN">Belum Kawin</SelectItem>
                    <SelectItem value="KAWIN">Kawin</SelectItem>
                    <SelectItem value="CERAI_HIDUP">Cerai Hidup</SelectItem>
                    <SelectItem value="CERAI_MATI">Cerai Mati</SelectItem>
                  </SelectContent>
                </Select>
                {errors.maritalStatus && <p className="text-sm text-red-600">{errors.maritalStatus}</p>}
              </div>

              <div className="space-y-2">
                <Label>Golongan Darah</Label>
                <Select value={formData.bloodType} onValueChange={(value) => handleInputChange('bloodType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih golongan darah (opsional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tidak diketahui</SelectItem>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="AB">AB</SelectItem>
                    <SelectItem value="O">O</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Family Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Keluarga</CardTitle>
            <CardDescription>
              Data keluarga dan status dalam keluarga (opsional)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isHeadOfFamily"
                checked={formData.isHeadOfFamily}
                onChange={(e) => handleInputChange('isHeadOfFamily', e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isHeadOfFamily">Kepala Keluarga</Label>
            </div>
            
            <div className="text-sm text-gray-600">
              <p>Informasi keluarga dan alamat dapat diisi nanti setelah data penduduk disimpan.</p>
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/citizens">Batal</Link>
          </Button>
          <LoadingButton
            type="submit"
            loading={loading}
            loadingText="Menyimpan..."
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Simpan Data
          </LoadingButton>
        </div>
      </form>
    </div>
  )
}