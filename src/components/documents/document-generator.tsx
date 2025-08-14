/**
 * Document Generator Component
 * UI for generating PDF documents
 */

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Download, Eye, FileText } from 'lucide-react'

const documentGenerationSchema = z.object({
  type: z.enum(['domicileCertificate', 'businessCertificate', 'povertyLetter']),
  citizenId: z.string().min(1, 'Pilih warga'),
  purpose: z.string().min(1, 'Tujuan harus diisi').max(500, 'Tujuan terlalu panjang'),
  validUntil: z.string().optional(),
  businessType: z.string().optional(),
  businessAddress: z.string().optional(),
  businessStartDate: z.string().optional()
})

type FormData = z.infer<typeof documentGenerationSchema>

interface DocumentGeneratorProps {
  citizens: Array<{
    id: string
    name: string
    nik: string
  }>
  onDocumentGenerated?: (filename: string) => void
}

export function DocumentGenerator({ citizens, onDocumentGenerated }: DocumentGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(documentGenerationSchema)
  })

  const selectedType = watch('type')

  const documentTypes = [
    { value: 'domicileCertificate', label: 'Surat Keterangan Domisili' },
    { value: 'businessCertificate', label: 'Surat Keterangan Usaha' },
    { value: 'povertyLetter', label: 'Surat Keterangan Tidak Mampu' }
  ]

  const handleGenerate = async (data: FormData) => {
    setIsGenerating(true)
    setError('')

    try {
      const requestBody = {
        type: data.type,
        citizenId: data.citizenId,
        purpose: data.purpose,
        validUntil: data.validUntil ? new Date(data.validUntil).toISOString() : undefined,
        additionalData: data.type === 'businessCertificate' ? {
          businessType: data.businessType,
          businessAddress: data.businessAddress,
          businessStartDate: data.businessStartDate
        } : undefined
      }

      const response = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Gagal generate dokumen')
      }

      // Download the PDF
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const filename = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'document.pdf'
      
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      onDocumentGenerated?.(filename)

    } catch (error) {
      console.error('Error generating document:', error)
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan')
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePreview = async (data: FormData) => {
    setIsPreviewing(true)
    setError('')

    try {
      const params = new URLSearchParams({
        type: data.type,
        citizenId: data.citizenId,
        purpose: data.purpose
      })

      const response = await fetch(`/api/documents/generate?${params}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Gagal preview dokumen')
      }

      const result = await response.json()
      const pdfBlob = new Blob([Uint8Array.from(atob(result.data.pdf), c => c.charCodeAt(0))], { type: 'application/pdf' })
      const url = URL.createObjectURL(pdfBlob)
      setPreviewUrl(url)

    } catch (error) {
      console.error('Error previewing document:', error)
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan')
    } finally {
      setIsPreviewing(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generator Dokumen
          </CardTitle>
          <CardDescription>
            Buat dokumen administratif dalam format PDF
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleGenerate)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Document Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Jenis Dokumen</Label>
              <Select onValueChange={(value) => setValue('type', value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis dokumen" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-red-600">{errors.type.message}</p>
              )}
            </div>

            {/* Citizen Selection */}
            <div className="space-y-2">
              <Label htmlFor="citizenId">Warga</Label>
              <Select onValueChange={(value) => setValue('citizenId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih warga" />
                </SelectTrigger>
                <SelectContent>
                  {citizens.map((citizen) => (
                    <SelectItem key={citizen.id} value={citizen.id}>
                      {citizen.name} - {citizen.nik}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.citizenId && (
                <p className="text-sm text-red-600">{errors.citizenId.message}</p>
              )}
            </div>

            {/* Purpose */}
            <div className="space-y-2">
              <Label htmlFor="purpose">Tujuan/Keperluan</Label>
              <Textarea
                {...register('purpose')}
                placeholder="Masukkan tujuan pembuatan dokumen"
                rows={3}
              />
              {errors.purpose && (
                <p className="text-sm text-red-600">{errors.purpose.message}</p>
              )}
            </div>

            {/* Valid Until */}
            <div className="space-y-2">
              <Label htmlFor="validUntil">Berlaku Sampai (Opsional)</Label>
              <Input
                {...register('validUntil')}
                type="date"
              />
            </div>

            {/* Business Certificate Additional Fields */}
            {selectedType === 'businessCertificate' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="businessType">Jenis Usaha</Label>
                  <Input
                    {...register('businessType')}
                    placeholder="Contoh: Warung Kelontong"
                  />
                  {errors.businessType && (
                    <p className="text-sm text-red-600">{errors.businessType.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessAddress">Alamat Usaha</Label>
                  <Input
                    {...register('businessAddress')}
                    placeholder="Alamat lokasi usaha"
                  />
                  {errors.businessAddress && (
                    <p className="text-sm text-red-600">{errors.businessAddress.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessStartDate">Mulai Usaha (Opsional)</Label>
                  <Input
                    {...register('businessStartDate')}
                    type="date"
                  />
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleSubmit(handlePreview)}
                disabled={isPreviewing || isGenerating}
              >
                {isPreviewing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Preview...
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </>
                )}
              </Button>

              <Button
                type="submit"
                disabled={isGenerating || isPreviewing}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Generate & Download
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* PDF Preview */}
      {previewUrl && (
        <Card>
          <CardHeader>
            <CardTitle>Preview Dokumen</CardTitle>
          </CardHeader>
          <CardContent>
            <iframe
              src={previewUrl}
              className="w-full h-96 border rounded"
              title="Document Preview"
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
