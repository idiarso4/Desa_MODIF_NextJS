/**
 * Document Generation Page
 * Admin page for generating PDF documents
 */

import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { DocumentGenerator } from '@/components/documents/document-generator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

async function getCitizens() {
  try {
    const citizens = await prisma.citizen.findMany({
      select: {
        id: true,
        name: true,
        nik: true
      },
      orderBy: {
        name: 'asc'
      },
      take: 100 // Limit for performance
    })

    return citizens
  } catch (error) {
    console.error('Error fetching citizens:', error)
    return []
  }
}

function DocumentGeneratorSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-96" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-20 w-full" />
        </div>
        <div className="flex gap-2 pt-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-40" />
        </div>
      </CardContent>
    </Card>
  )
}

async function DocumentGeneratorWrapper() {
  const citizens = await getCitizens()

  return (
    <DocumentGenerator 
      citizens={citizens}
      onDocumentGenerated={(filename) => {
        console.log('Document generated:', filename)
      }}
    />
  )
}

export default function DocumentGenerationPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Generator Dokumen</h1>
        <p className="text-muted-foreground mt-2">
          Buat dokumen administratif dalam format PDF untuk berbagai keperluan warga
        </p>
      </div>

      <Suspense fallback={<DocumentGeneratorSkeleton />}>
        <DocumentGeneratorWrapper />
      </Suspense>

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Surat Keterangan Domisili</CardTitle>
            <CardDescription>
              Surat keterangan tempat tinggal warga untuk berbagai keperluan administratif
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Pendaftaran sekolah</li>
              <li>• Pembuatan KTP</li>
              <li>• Administrasi bank</li>
              <li>• Keperluan lainnya</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Surat Keterangan Usaha</CardTitle>
            <CardDescription>
              Surat keterangan kepemilikan usaha untuk keperluan perizinan dan administrasi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Pengajuan kredit usaha</li>
              <li>• Perizinan usaha</li>
              <li>• Administrasi pajak</li>
              <li>• Program bantuan UMKM</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Surat Keterangan Tidak Mampu</CardTitle>
            <CardDescription>
              Surat keterangan kondisi ekonomi untuk bantuan sosial dan keringanan biaya
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Beasiswa pendidikan</li>
              <li>• Bantuan kesehatan</li>
              <li>• Keringanan biaya administrasi</li>
              <li>• Program bantuan sosial</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Cara Penggunaan</CardTitle>
          <CardDescription>
            Panduan untuk menggunakan generator dokumen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Pilih jenis dokumen yang akan dibuat</li>
            <li>Pilih warga yang akan dibuatkan dokumen</li>
            <li>Isi tujuan/keperluan pembuatan dokumen</li>
            <li>Isi informasi tambahan jika diperlukan (untuk surat usaha)</li>
            <li>Klik "Preview" untuk melihat hasil sebelum download</li>
            <li>Klik "Generate & Download" untuk mengunduh dokumen PDF</li>
          </ol>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Catatan:</strong> Dokumen yang dihasilkan akan tersimpan dalam sistem untuk keperluan audit dan tracking. 
              Pastikan data yang diisi sudah benar sebelum generate dokumen.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
