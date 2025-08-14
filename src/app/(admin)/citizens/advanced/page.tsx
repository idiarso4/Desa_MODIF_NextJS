/**
 * Advanced Citizens Table Page
 * Example usage of AdvancedDataTable component
 */

'use client'

import { useState, useEffect } from 'react'
import { AdvancedDataTable, Column, FilterOption, BulkAction, RowAction } from '@/components/ui/advanced-data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Edit, Eye, Trash2, Download, UserPlus, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

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
  address: string
  rt: string
  rw: string
  isActive: boolean
  createdAt: string
}

// Mock data - in real app this would come from API
const mockCitizens: Citizen[] = [
  {
    id: '1',
    nik: '3201234567890001',
    name: 'Ahmad Suryadi',
    birthDate: '1985-05-15',
    birthPlace: 'Jakarta',
    gender: 'L',
    religion: 'ISLAM',
    education: 'SMA',
    occupation: 'Wiraswasta',
    maritalStatus: 'KAWIN',
    address: 'Jl. Merdeka No. 123',
    rt: '001',
    rw: '002',
    isActive: true,
    createdAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    nik: '3201234567890002',
    name: 'Siti Nurhaliza',
    birthDate: '1990-08-22',
    birthPlace: 'Bandung',
    gender: 'P',
    religion: 'ISLAM',
    education: 'S1',
    occupation: 'Guru',
    maritalStatus: 'KAWIN',
    address: 'Jl. Sudirman No. 456',
    rt: '002',
    rw: '003',
    isActive: true,
    createdAt: '2024-01-16T14:20:00Z'
  },
  {
    id: '3',
    nik: '3201234567890003',
    name: 'Budi Santoso',
    birthDate: '1978-12-10',
    birthPlace: 'Surabaya',
    gender: 'L',
    religion: 'KRISTEN',
    education: 'D3',
    occupation: 'Pegawai Swasta',
    maritalStatus: 'KAWIN',
    address: 'Jl. Gatot Subroto No. 789',
    rt: '003',
    rw: '001',
    isActive: false,
    createdAt: '2024-01-17T09:15:00Z'
  }
]

export default function AdvancedCitizensPage() {
  const [citizens, setCitizens] = useState<Citizen[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setCitizens(mockCitizens)
      setLoading(false)
    }, 1000)
  }, [])

  const columns: Column<Citizen>[] = [
    {
      key: 'nik',
      title: 'NIK',
      sortable: true,
      filterable: true,
      width: '150px',
      render: (value) => (
        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
          {value}
        </code>
      )
    },
    {
      key: 'name',
      title: 'Nama Lengkap',
      sortable: true,
      filterable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-xs text-gray-500">{row.birthPlace}</div>
        </div>
      )
    },
    {
      key: 'birthDate',
      title: 'Tanggal Lahir',
      sortable: true,
      width: '120px',
      render: (value) => format(new Date(value), 'dd MMM yyyy', { locale: id })
    },
    {
      key: 'gender',
      title: 'Jenis Kelamin',
      sortable: true,
      filterable: true,
      width: '100px',
      render: (value) => (
        <Badge variant={value === 'L' ? 'default' : 'secondary'}>
          {value === 'L' ? 'Laki-laki' : 'Perempuan'}
        </Badge>
      )
    },
    {
      key: 'education',
      title: 'Pendidikan',
      sortable: true,
      filterable: true,
      width: '100px'
    },
    {
      key: 'occupation',
      title: 'Pekerjaan',
      sortable: true,
      filterable: true,
      width: '150px'
    },
    {
      key: 'address',
      title: 'Alamat',
      render: (value, row) => (
        <div className="max-w-xs">
          <div className="truncate">{value}</div>
          <div className="text-xs text-gray-500">RT {row.rt}/RW {row.rw}</div>
        </div>
      )
    },
    {
      key: 'isActive',
      title: 'Status',
      sortable: true,
      filterable: true,
      width: '80px',
      render: (value) => (
        <Badge variant={value ? 'default' : 'destructive'}>
          {value ? 'Aktif' : 'Nonaktif'}
        </Badge>
      )
    }
  ]

  const filterOptions: FilterOption[] = [
    {
      key: 'gender',
      label: 'Jenis Kelamin',
      type: 'select',
      options: [
        { value: 'L', label: 'Laki-laki' },
        { value: 'P', label: 'Perempuan' }
      ]
    },
    {
      key: 'religion',
      label: 'Agama',
      type: 'select',
      options: [
        { value: 'ISLAM', label: 'Islam' },
        { value: 'KRISTEN', label: 'Kristen' },
        { value: 'KATOLIK', label: 'Katolik' },
        { value: 'HINDU', label: 'Hindu' },
        { value: 'BUDDHA', label: 'Buddha' },
        { value: 'KONGHUCU', label: 'Konghucu' }
      ]
    },
    {
      key: 'education',
      label: 'Pendidikan',
      type: 'select',
      options: [
        { value: 'SD', label: 'SD' },
        { value: 'SMP', label: 'SMP' },
        { value: 'SMA', label: 'SMA' },
        { value: 'D3', label: 'D3' },
        { value: 'S1', label: 'S1' },
        { value: 'S2', label: 'S2' },
        { value: 'S3', label: 'S3' }
      ]
    },
    {
      key: 'maritalStatus',
      label: 'Status Kawin',
      type: 'select',
      options: [
        { value: 'BELUM_KAWIN', label: 'Belum Kawin' },
        { value: 'KAWIN', label: 'Kawin' },
        { value: 'CERAI_HIDUP', label: 'Cerai Hidup' },
        { value: 'CERAI_MATI', label: 'Cerai Mati' }
      ]
    },
    {
      key: 'isActive',
      label: 'Status Aktif',
      type: 'select',
      options: [
        { value: 'true', label: 'Aktif' },
        { value: 'false', label: 'Nonaktif' }
      ]
    },
    {
      key: 'rt',
      label: 'RT',
      type: 'text'
    },
    {
      key: 'rw',
      label: 'RW',
      type: 'text'
    }
  ]

  const bulkActions: BulkAction[] = [
    {
      key: 'activate',
      label: 'Aktifkan',
      icon: UserPlus,
      onClick: (selectedRows) => {
        console.log('Activating citizens:', selectedRows)
        // Implement activation logic
      }
    },
    {
      key: 'deactivate',
      label: 'Nonaktifkan',
      variant: 'destructive',
      icon: Trash2,
      onClick: (selectedRows) => {
        console.log('Deactivating citizens:', selectedRows)
        // Implement deactivation logic
      }
    },
    {
      key: 'export',
      label: 'Export Terpilih',
      icon: Download,
      onClick: (selectedRows) => {
        console.log('Exporting selected citizens:', selectedRows)
        // Implement export logic
      }
    }
  ]

  const rowActions: RowAction[] = [
    {
      key: 'view',
      label: 'Lihat Detail',
      icon: Eye,
      onClick: (row) => {
        console.log('Viewing citizen:', row)
        // Navigate to detail page
      }
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: Edit,
      onClick: (row) => {
        console.log('Editing citizen:', row)
        // Navigate to edit page
      }
    },
    {
      key: 'generate-letter',
      label: 'Buat Surat',
      icon: FileText,
      onClick: (row) => {
        console.log('Generating letter for citizen:', row)
        // Navigate to letter generation
      }
    },
    {
      key: 'delete',
      label: 'Hapus',
      icon: Trash2,
      variant: 'destructive',
      onClick: (row) => {
        console.log('Deleting citizen:', row)
        // Implement delete logic
      }
    }
  ]

  const handleExport = (data: Citizen[]) => {
    console.log('Exporting all data:', data)
    // Implement export logic
    const csv = [
      ['NIK', 'Nama', 'Tanggal Lahir', 'Jenis Kelamin', 'Pendidikan', 'Pekerjaan', 'Alamat'],
      ...data.map(citizen => [
        citizen.nik,
        citizen.name,
        citizen.birthDate,
        citizen.gender === 'L' ? 'Laki-laki' : 'Perempuan',
        citizen.education,
        citizen.occupation,
        `${citizen.address}, RT ${citizen.rt}/RW ${citizen.rw}`
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'data-penduduk.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Penduduk (Advanced)</h1>
          <p className="text-muted-foreground mt-2">
            Contoh penggunaan Advanced Data Table dengan fitur lengkap
          </p>
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Tambah Penduduk
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Penduduk</CardTitle>
          <CardDescription>
            Tabel dengan fitur pencarian, filter, sorting, bulk actions, dan export
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdvancedDataTable
            data={citizens}
            columns={columns}
            loading={loading}
            searchable={true}
            searchPlaceholder="Cari berdasarkan nama, NIK, atau alamat..."
            sortable={true}
            pagination={true}
            pageSize={10}
            pageSizeOptions={[5, 10, 25, 50]}
            filterOptions={filterOptions}
            bulkActions={bulkActions}
            rowActions={rowActions}
            exportable={true}
            onExport={handleExport}
            selectable={true}
            emptyMessage="Belum ada data penduduk"
            onRowClick={(row) => console.log('Row clicked:', row)}
          />
        </CardContent>
      </Card>

      {/* Feature Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fitur Pencarian & Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1">
              <li>• Pencarian global di semua kolom</li>
              <li>• Filter berdasarkan kolom spesifik</li>
              <li>• Multiple filter conditions</li>
              <li>• Real-time filtering</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sorting & Pagination</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1">
              <li>• Sort ascending/descending</li>
              <li>• Multiple column sorting</li>
              <li>• Configurable page sizes</li>
              <li>• Navigation controls</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bulk Actions & Export</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1">
              <li>• Select multiple rows</li>
              <li>• Bulk operations</li>
              <li>• Export to CSV/Excel</li>
              <li>• Row-level actions</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
