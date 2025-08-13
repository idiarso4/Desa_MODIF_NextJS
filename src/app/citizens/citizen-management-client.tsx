/**
 * Citizen Management Client Component
 * Client-side interface for citizen management
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DataTable, Column } from '@/components/ui/data-table'
import { LoadingCard } from '@/components/ui/loading'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Plus, 
  Search, 
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Users,
  UserCheck,
  Calendar,
  MapPin
} from 'lucide-react'
import { usePermission } from '@/lib/auth/hooks'

interface Citizen {
  id: string
  nik: string
  name: string
  birthDate: string
  birthPlace: string
  gender: 'L' | 'P'
  religion: string
  education: string
  occupation: string
  maritalStatus: string
  bloodType?: string
  isHeadOfFamily: boolean
  family?: {
    id: string
    familyNumber: string
    socialStatus: string
  }
  address?: {
    id: string
    street: string
    rt: string
    rw: string
    village: string
    district: string
    regency: string
    province: string
  }
  createdBy: {
    id: string
    name: string
    username: string
  }
  createdAt: string
  updatedAt: string
}

interface CitizenResponse {
  citizens: Citizen[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export function CitizenManagementClient() {
  const [citizens, setCitizens] = useState<Citizen[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGender, setSelectedGender] = useState<string>('all')
  const [selectedReligion, setSelectedReligion] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCitizens, setTotalCitizens] = useState(0)
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const { hasPermission: canCreate } = usePermission('citizens', 'create')
  const { hasPermission: canUpdate } = usePermission('citizens', 'update')
  const { hasPermission: canDelete } = usePermission('citizens', 'delete')
  const { hasPermission: canExport } = usePermission('citizens', 'export')

  const fetchCitizens = async (page = 1, search = '', gender = 'all', religion = 'all') => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(gender !== 'all' && { gender }),
        ...(religion !== 'all' && { religion })
      })

      const response = await fetch(`/api/citizens?${params}`)
      const data: CitizenResponse = await response.json()

      if (response.ok) {
        setCitizens(data.citizens)
        setCurrentPage(data.pagination.page)
        setTotalPages(data.pagination.pages)
        setTotalCitizens(data.pagination.total)
      } else {
        setMessage({ type: 'error', text: 'Gagal memuat data penduduk' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan saat memuat data' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCitizens()
  }, [])

  const handleSearch = () => {
    setCurrentPage(1)
    fetchCitizens(1, searchTerm, selectedGender, selectedReligion)
  }

  const handlePageChange = (page: number) => {
    fetchCitizens(page, searchTerm, selectedGender, selectedReligion)
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        format: 'csv',
        ...(selectedGender !== 'all' && { gender: selectedGender }),
        ...(selectedReligion !== 'all' && { religion: selectedReligion })
      })

      const response = await fetch(`/api/citizens/export?${params}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `data-penduduk-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        setMessage({ type: 'success', text: 'Data berhasil diekspor' })
      } else {
        setMessage({ type: 'error', text: 'Gagal mengekspor data' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan saat mengekspor data' })
    }
  }

  const handleViewDetail = (citizen: Citizen) => {
    setSelectedCitizen(citizen)
    setIsDetailDialogOpen(true)
  }

  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }

  const columns: Column<Citizen>[] = [
    {
      key: 'nik',
      title: 'NIK',
      sortable: true,
      width: '140px',
      render: (value) => (
        <span className="font-mono text-sm">{value}</span>
      )
    },
    {
      key: 'name',
      title: 'Nama',
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-gray-500">
            {row.gender === 'L' ? 'Laki-laki' : 'Perempuan'} • {calculateAge(row.birthDate)} tahun
          </div>
        </div>
      )
    },
    {
      key: 'birthPlace',
      title: 'Tempat, Tanggal Lahir',
      render: (value, row) => (
        <div className="text-sm">
          <div>{value}</div>
          <div className="text-gray-500">
            {new Date(row.birthDate).toLocaleDateString('id-ID')}
          </div>
        </div>
      )
    },
    {
      key: 'occupation',
      title: 'Pekerjaan',
      render: (value) => (
        <span className="text-sm">{value}</span>
      )
    },
    {
      key: 'family',
      title: 'Keluarga',
      render: (value, row) => (
        <div className="text-sm">
          {value ? (
            <>
              <div className="font-medium">KK: {value.familyNumber}</div>
              <div className="flex items-center gap-1">
                {row.isHeadOfFamily ? (
                  <Badge variant="default" className="text-xs">Kepala KK</Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">Anggota</Badge>
                )}
              </div>
            </>
          ) : (
            <span className="text-gray-400">Belum ada KK</span>
          )}
        </div>
      )
    },
    {
      key: 'address',
      title: 'Alamat',
      render: (value) => (
        <div className="text-sm">
          {value ? (
            <>
              <div>{value.street}</div>
              <div className="text-gray-500">RT {value.rt}/RW {value.rw}</div>
            </>
          ) : (
            <span className="text-gray-400">Belum ada alamat</span>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      title: 'Aksi',
      width: '120px',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewDetail(row)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {canUpdate && (
            <Button
              variant="ghost"
              size="sm"
              asChild
            >
              <Link href={`/citizens/${row.id}/edit`}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    }
  ]

  if (loading && citizens.length === 0) {
    return <LoadingCard message="Memuat data penduduk..." />
  }

  return (
    <div className="space-y-6">
      {message && (
        <Alert className={`${message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
          <AlertDescription className={message.type === 'error' ? 'text-red-700' : 'text-green-700'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Data Penduduk</h2>
          <p className="text-gray-600">
            Kelola data penduduk desa ({totalCitizens.toLocaleString('id-ID')} penduduk)
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {canExport && (
            <Button variant="outline" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          )}
          {canCreate && (
            <Button asChild className="gap-2">
              <Link href="/citizens/create">
                <Plus className="h-4 w-4" />
                Tambah Penduduk
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari NIK, nama, atau tempat lahir..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedGender} onValueChange={setSelectedGender}>
              <SelectTrigger>
                <SelectValue placeholder="Jenis Kelamin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jenis Kelamin</SelectItem>
                <SelectItem value="L">Laki-laki</SelectItem>
                <SelectItem value="P">Perempuan</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedReligion} onValueChange={setSelectedReligion}>
              <SelectTrigger>
                <SelectValue placeholder="Agama" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Agama</SelectItem>
                <SelectItem value="ISLAM">Islam</SelectItem>
                <SelectItem value="KRISTEN">Kristen</SelectItem>
                <SelectItem value="KATOLIK">Katolik</SelectItem>
                <SelectItem value="HINDU">Hindu</SelectItem>
                <SelectItem value="BUDDHA">Buddha</SelectItem>
                <SelectItem value="KONGHUCU">Konghucu</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={handleSearch} className="gap-2">
              <Filter className="h-4 w-4" />
              Terapkan Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Penduduk</CardTitle>
          <CardDescription>
            Data penduduk yang terdaftar dalam sistem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={citizens}
            columns={columns}
            loading={loading}
            searchable={false}
            pagination={false}
            emptyMessage="Tidak ada data penduduk"
          />
          
          {/* Custom Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-700">
                Halaman {currentPage} dari {totalPages} • Total {totalCitizens} penduduk
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Penduduk</DialogTitle>
            <DialogDescription>
              Informasi lengkap data penduduk
            </DialogDescription>
          </DialogHeader>
          
          {selectedCitizen && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">NIK</label>
                  <p className="font-mono">{selectedCitizen.nik}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Nama Lengkap</label>
                  <p className="font-medium">{selectedCitizen.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Tempat Lahir</label>
                  <p>{selectedCitizen.birthPlace}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Tanggal Lahir</label>
                  <p>{new Date(selectedCitizen.birthDate).toLocaleDateString('id-ID')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Jenis Kelamin</label>
                  <p>{selectedCitizen.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Agama</label>
                  <p>{selectedCitizen.religion}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Pendidikan</label>
                  <p>{selectedCitizen.education}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Pekerjaan</label>
                  <p>{selectedCitizen.occupation}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status Kawin</label>
                  <p>{selectedCitizen.maritalStatus}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Golongan Darah</label>
                  <p>{selectedCitizen.bloodType || '-'}</p>
                </div>
              </div>

              {/* Family Info */}
              {selectedCitizen.family && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Informasi Keluarga
                  </h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Nomor KK:</span>
                        <span className="ml-2 font-mono">{selectedCitizen.family.familyNumber}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Status:</span>
                        <span className="ml-2">
                          {selectedCitizen.isHeadOfFamily ? 'Kepala Keluarga' : 'Anggota Keluarga'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Address Info */}
              {selectedCitizen.address && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Alamat
                  </h4>
                  <div className="bg-gray-50 p-3 rounded-lg text-sm">
                    <p>{selectedCitizen.address.street}</p>
                    <p>RT {selectedCitizen.address.rt}/RW {selectedCitizen.address.rw}</p>
                    <p>{selectedCitizen.address.village}, {selectedCitizen.address.district}</p>
                    <p>{selectedCitizen.address.regency}, {selectedCitizen.address.province}</p>
                  </div>
                </div>
              )}

              {/* Meta Info */}
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Informasi Sistem
                </h4>
                <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
                  <div>
                    <span className="text-gray-600">Dibuat oleh:</span>
                    <span className="ml-2">{selectedCitizen.createdBy.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Tanggal dibuat:</span>
                    <span className="ml-2">
                      {new Date(selectedCitizen.createdAt).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Terakhir diubah:</span>
                    <span className="ml-2">
                      {new Date(selectedCitizen.updatedAt).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}