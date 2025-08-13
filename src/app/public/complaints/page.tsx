"use client"

/**
 * Public Complaints Page
 * Allows public to submit complaints and track existing ones
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { 
  MessageSquare, 
  Send, 
  Search, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  FileText,
  User,
  Calendar,
  TrendingUp,
  Shield
} from 'lucide-react'

interface ComplaintForm {
  title: string
  description: string
  category: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  submitterName: string
  submitterEmail: string
  submitterPhone: string
  submitterAddress: string
  isAnonymous: boolean
}

interface TrackingResult {
  complaint: {
    id: string
    title: string
    description: string
    category: string
    priority: string
    status: string
    statusCode: string
    trackingNumber: string
    submittedAt: string
    response?: string
    respondedAt?: string
    assignedTo?: string
    estimatedResolution: string
    progress: number
  }
  timeline: Array<{
    action: string
    description: string
    timestamp: string
    user?: string
  }>
  nextSteps: string[]
  contactInfo: {
    message: string
    phone: string
    email: string
    office: string
  }
}

const complaintCategories = [
  'Infrastruktur Jalan',
  'Pelayanan Administrasi',
  'Kebersihan Lingkungan',
  'Keamanan dan Ketertiban',
  'Fasilitas Umum',
  'Pelayanan Kesehatan',
  'Pendidikan',
  'Ekonomi dan UMKM',
  'Sosial Kemasyarakatan',
  'Lainnya'
]

export default function ComplaintsPage() {
  const [activeTab, setActiveTab] = useState('submit')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isTracking, setIsTracking] = useState(false)
  const [trackingNumber, setTrackingNumber] = useState('')
  const [trackingResult, setTrackingResult] = useState<TrackingResult | null>(null)
  const [submitResult, setSubmitResult] = useState<{ trackingNumber: string } | null>(null)
  const { toast } = useToast()

  const [form, setForm] = useState<ComplaintForm>({
    title: '',
    description: '',
    category: '',
    priority: 'MEDIUM',
    submitterName: '',
    submitterEmail: '',
    submitterPhone: '',
    submitterAddress: '',
    isAnonymous: false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/public/complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitResult({ trackingNumber: data.trackingNumber })
        setForm({
          title: '',
          description: '',
          category: '',
          priority: 'MEDIUM',
          submitterName: '',
          submitterEmail: '',
          submitterPhone: '',
          submitterAddress: '',
          isAnonymous: false
        })
        toast({
          title: 'Pengaduan Berhasil Dikirim',
          description: `Nomor tracking: ${data.trackingNumber}`,
          variant: 'success'
        })
      } else {
        throw new Error(data.error || 'Gagal mengirim pengaduan')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsTracking(true)

    try {
      const response = await fetch('/api/public/complaints/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ trackingNumber })
      })

      const data = await response.json()

      if (response.ok) {
        setTrackingResult(data)
      } else {
        throw new Error(data.error || 'Pengaduan tidak ditemukan')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
        variant: 'destructive'
      })
      setTrackingResult(null)
    } finally {
      setIsTracking(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-500'
      case 'IN_PROGRESS': return 'bg-yellow-500'
      case 'RESOLVED': return 'bg-green-500'
      case 'CLOSED': return 'bg-gray-500'
      case 'REJECTED': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'destructive'
      case 'HIGH': return 'destructive'
      case 'MEDIUM': return 'default'
      case 'LOW': return 'secondary'
      default: return 'default'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <MessageSquare className="h-16 w-16 mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-4">
              Pengaduan Masyarakat
            </h1>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Sampaikan keluhan, saran, dan masukan Anda untuk kemajuan desa. 
              Kami berkomitmen untuk merespon setiap pengaduan dengan baik.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="submit" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Kirim Pengaduan
            </TabsTrigger>
            <TabsTrigger value="track" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Lacak Pengaduan
            </TabsTrigger>
          </TabsList>

          {/* Submit Complaint Tab */}
          <TabsContent value="submit" className="space-y-6">
            {submitResult ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    Pengaduan Berhasil Dikirim
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Nomor Tracking: {submitResult.trackingNumber}</strong>
                      <br />
                      Simpan nomor ini untuk melacak status pengaduan Anda.
                    </AlertDescription>
                  </Alert>
                  <div className="flex gap-4">
                    <Button 
                      onClick={() => {
                        setTrackingNumber(submitResult.trackingNumber)
                        setActiveTab('track')
                      }}
                    >
                      Lacak Pengaduan
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setSubmitResult(null)}
                    >
                      Kirim Pengaduan Baru
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Form Pengaduan</CardTitle>
                  <CardDescription>
                    Isi form berikut untuk menyampaikan pengaduan Anda
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="title">Judul Pengaduan *</Label>
                        <Input
                          id="title"
                          value={form.title}
                          onChange={(e) => setForm({ ...form, title: e.target.value })}
                          placeholder="Ringkasan singkat masalah Anda"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="category">Kategori *</Label>
                        <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih kategori" />
                          </SelectTrigger>
                          <SelectContent>
                            {complaintCategories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Deskripsi Pengaduan *</Label>
                      <Textarea
                        id="description"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="Jelaskan masalah Anda secara detail..."
                        rows={4}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="priority">Tingkat Prioritas</Label>
                      <Select value={form.priority} onValueChange={(value: any) => setForm({ ...form, priority: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">Rendah</SelectItem>
                          <SelectItem value="MEDIUM">Sedang</SelectItem>
                          <SelectItem value="HIGH">Tinggi</SelectItem>
                          <SelectItem value="URGENT">Mendesak</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {!form.isAnonymous && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="submitterName">Nama Lengkap *</Label>
                          <Input
                            id="submitterName"
                            value={form.submitterName}
                            onChange={(e) => setForm({ ...form, submitterName: e.target.value })}
                            placeholder="Nama lengkap Anda"
                            required={!form.isAnonymous}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="submitterPhone">Nomor Telepon</Label>
                          <Input
                            id="submitterPhone"
                            value={form.submitterPhone}
                            onChange={(e) => setForm({ ...form, submitterPhone: e.target.value })}
                            placeholder="08xxxxxxxxxx"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="submitterEmail">Email</Label>
                          <Input
                            id="submitterEmail"
                            type="email"
                            value={form.submitterEmail}
                            onChange={(e) => setForm({ ...form, submitterEmail: e.target.value })}
                            placeholder="email@example.com"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="submitterAddress">Alamat</Label>
                          <Input
                            id="submitterAddress"
                            value={form.submitterAddress}
                            onChange={(e) => setForm({ ...form, submitterAddress: e.target.value })}
                            placeholder="RT/RW, Dusun"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isAnonymous"
                        checked={form.isAnonymous}
                        onChange={(e) => setForm({ ...form, isAnonymous: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="isAnonymous">
                        Kirim sebagai anonim (identitas tidak akan ditampilkan)
                      </Label>
                    </div>

                    <Button type="submit" disabled={isSubmitting} className="w-full">
                      {isSubmitting ? (
                        <>
                          <Clock className="mr-2 h-4 w-4 animate-spin" />
                          Mengirim...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Kirim Pengaduan
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Track Complaint Tab */}
          <TabsContent value="track" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Lacak Status Pengaduan</CardTitle>
                <CardDescription>
                  Masukkan nomor tracking untuk melihat status pengaduan Anda
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTrack} className="space-y-4">
                  <div className="flex gap-4">
                    <Input
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="Masukkan nomor tracking (contoh: ADU123456ABCD)"
                      className="flex-1"
                    />
                    <Button type="submit" disabled={isTracking}>
                      {isTracking ? (
                        <Clock className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {trackingResult && (
              <div className="space-y-6">
                {/* Complaint Details */}
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{trackingResult.complaint.title}</CardTitle>
                        <CardDescription>
                          Tracking: {trackingResult.complaint.trackingNumber}
                        </CardDescription>
                      </div>
                      <Badge variant={getPriorityColor(trackingResult.complaint.priority)}>
                        {trackingResult.complaint.priority}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Status</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(trackingResult.complaint.statusCode)}`}></div>
                          <span>{trackingResult.complaint.status}</span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Kategori</Label>
                        <p className="mt-1">{trackingResult.complaint.category}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Tanggal Pengajuan</Label>
                        <p className="mt-1">
                          {new Date(trackingResult.complaint.submittedAt).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Progress</Label>
                      <Progress value={trackingResult.complaint.progress} className="mt-2" />
                      <p className="text-sm text-gray-600 mt-1">
                        {trackingResult.complaint.progress}% selesai
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Deskripsi</Label>
                      <p className="mt-1 text-gray-700">{trackingResult.complaint.description}</p>
                    </div>

                    {trackingResult.complaint.response && (
                      <div>
                        <Label className="text-sm font-medium">Respon</Label>
                        <div className="mt-1 p-3 bg-blue-50 rounded-lg">
                          <p className="text-gray-700">{trackingResult.complaint.response}</p>
                          {trackingResult.complaint.respondedAt && (
                            <p className="text-sm text-gray-500 mt-2">
                              Direspon pada: {new Date(trackingResult.complaint.respondedAt).toLocaleDateString('id-ID')}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle>Timeline Pengaduan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {trackingResult.timeline.map((item, index) => (
                        <div key={index} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                            {index < trackingResult.timeline.length - 1 && (
                              <div className="w-px h-8 bg-gray-300 mt-2"></div>
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <p className="font-medium">{item.description}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(item.timestamp).toLocaleString('id-ID')}
                              {item.user && ` • ${item.user}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Next Steps */}
                <Card>
                  <CardHeader>
                    <CardTitle>Langkah Selanjutnya</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {trackingResult.nextSteps.map((step, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Contact Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Informasi Kontak</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4">{trackingResult.contactInfo.message}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">{trackingResult.contactInfo.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">{trackingResult.contactInfo.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">{trackingResult.contactInfo.office}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}