// Application constants in Indonesian
export const GENDER_OPTIONS = [
  { value: 'L', label: 'Laki-laki' },
  { value: 'P', label: 'Perempuan' },
] as const

export const RELIGION_OPTIONS = [
  { value: 'ISLAM', label: 'Islam' },
  { value: 'KRISTEN', label: 'Kristen' },
  { value: 'KATOLIK', label: 'Katolik' },
  { value: 'HINDU', label: 'Hindu' },
  { value: 'BUDDHA', label: 'Buddha' },
  { value: 'KONGHUCU', label: 'Konghucu' },
] as const

export const EDUCATION_OPTIONS = [
  { value: 'TIDAK_SEKOLAH', label: 'Tidak Sekolah' },
  { value: 'SD', label: 'SD' },
  { value: 'SMP', label: 'SMP' },
  { value: 'SMA', label: 'SMA' },
  { value: 'D1', label: 'D1' },
  { value: 'D2', label: 'D2' },
  { value: 'D3', label: 'D3' },
  { value: 'S1', label: 'S1' },
  { value: 'S2', label: 'S2' },
  { value: 'S3', label: 'S3' },
] as const

export const MARITAL_STATUS_OPTIONS = [
  { value: 'BELUM_KAWIN', label: 'Belum Kawin' },
  { value: 'KAWIN', label: 'Kawin' },
  { value: 'CERAI_HIDUP', label: 'Cerai Hidup' },
  { value: 'CERAI_MATI', label: 'Cerai Mati' },
] as const

export const BLOOD_TYPE_OPTIONS = [
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'AB', label: 'AB' },
  { value: 'O', label: 'O' },
] as const

export const SOCIAL_STATUS_OPTIONS = [
  { value: 'MAMPU', label: 'Mampu' },
  { value: 'KURANG_MAMPU', label: 'Kurang Mampu' },
  { value: 'MISKIN', label: 'Miskin' },
] as const

export const DOCUMENT_TYPE_OPTIONS = [
  { value: 'KTP', label: 'KTP' },
  { value: 'KK', label: 'Kartu Keluarga' },
  { value: 'AKTA_LAHIR', label: 'Akta Lahir' },
  { value: 'IJAZAH', label: 'Ijazah' },
  { value: 'SERTIFIKAT', label: 'Sertifikat' },
  { value: 'LAINNYA', label: 'Lainnya' },
] as const

export const LETTER_TYPE_OPTIONS = [
  { value: 'SURAT_KETERANGAN_DOMISILI', label: 'Surat Keterangan Domisili' },
  { value: 'SURAT_KETERANGAN_USAHA', label: 'Surat Keterangan Usaha' },
  { value: 'SURAT_KETERANGAN_TIDAK_MAMPU', label: 'Surat Keterangan Tidak Mampu' },
  { value: 'SURAT_PENGANTAR', label: 'Surat Pengantar' },
  { value: 'LAINNYA', label: 'Lainnya' },
] as const

export const REQUEST_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Menunggu', color: 'yellow' },
  { value: 'DIPROSES', label: 'Diproses', color: 'blue' },
  { value: 'SELESAI', label: 'Selesai', color: 'green' },
  { value: 'DITOLAK', label: 'Ditolak', color: 'red' },
] as const

// Navigation menu items in Indonesian
export const MAIN_NAVIGATION = [
  {
    title: 'Beranda',
    href: '/dashboard',
    icon: 'Home',
  },
  {
    title: 'Kependudukan',
    icon: 'Users',
    children: [
      { title: 'Data Penduduk', href: '/penduduk' },
      { title: 'Data Keluarga', href: '/keluarga' },
      { title: 'Kartu Keluarga', href: '/kartu-keluarga' },
      { title: 'Kelompok', href: '/kelompok' },
    ],
  },
  {
    title: 'Layanan Surat',
    icon: 'FileText',
    children: [
      { title: 'Permohonan Surat', href: '/surat/permohonan' },
      { title: 'Cetak Surat', href: '/surat/cetak' },
      { title: 'Arsip Surat', href: '/surat/arsip' },
      { title: 'Pengaturan Surat', href: '/surat/pengaturan' },
    ],
  },
  {
    title: 'Keuangan',
    icon: 'DollarSign',
    children: [
      { title: 'APBDes', href: '/keuangan/apbdes' },
      { title: 'Realisasi', href: '/keuangan/realisasi' },
      { title: 'Laporan', href: '/keuangan/laporan' },
    ],
  },
  {
    title: 'Program Bantuan',
    icon: 'Heart',
    children: [
      { title: 'Data Program', href: '/bantuan/program' },
      { title: 'Data Peserta', href: '/bantuan/peserta' },
      { title: 'Laporan Bantuan', href: '/bantuan/laporan' },
    ],
  },
  {
    title: 'Inventaris',
    icon: 'Package',
    children: [
      { title: 'Asset', href: '/inventaris/asset' },
      { title: 'Gedung & Bangunan', href: '/inventaris/gedung' },
      { title: 'Jalan', href: '/inventaris/jalan' },
      { title: 'Tanah', href: '/inventaris/tanah' },
    ],
  },
  {
    title: 'Laporan',
    icon: 'BarChart3',
    children: [
      { title: 'Laporan Penduduk', href: '/laporan/penduduk' },
      { title: 'Laporan Keuangan', href: '/laporan/keuangan' },
      { title: 'Laporan Inventaris', href: '/laporan/inventaris' },
      { title: 'Statistik', href: '/laporan/statistik' },
    ],
  },
  {
    title: 'Pengaturan',
    icon: 'Settings',
    children: [
      { title: 'Identitas Desa', href: '/pengaturan/identitas' },
      { title: 'Pengguna', href: '/pengaturan/pengguna' },
      { title: 'Grup Pengguna', href: '/pengaturan/grup' },
      { title: 'Backup & Restore', href: '/pengaturan/backup' },
    ],
  },
] as const

// Pagination constants
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  MAX_PAGE_SIZE: 100,
} as const

// File upload constants
export const UPLOAD = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
} as const