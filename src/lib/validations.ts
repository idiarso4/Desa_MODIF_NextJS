// Validation schemas using Zod
import { z } from 'zod'

// User validation schemas
export const userSchema = z.object({
  username: z.string()
    .min(3, 'Username minimal 3 karakter')
    .max(50, 'Username maksimal 50 karakter')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username hanya boleh mengandung huruf, angka, dan underscore'),
  email: z.string()
    .email('Format email tidak valid')
    .max(100, 'Email maksimal 100 karakter'),
  name: z.string()
    .min(2, 'Nama minimal 2 karakter')
    .max(100, 'Nama maksimal 100 karakter'),
  password: z.string()
    .min(6, 'Password minimal 6 karakter')
    .max(100, 'Password maksimal 100 karakter'),
  roleId: z.string().cuid('Role ID tidak valid'),
  isActive: z.boolean().default(true),
})

export const loginSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
})

// Citizen validation schemas
export const citizenSchema = z.object({
  nik: z.string()
    .length(16, 'NIK harus 16 digit')
    .regex(/^\d{16}$/, 'NIK hanya boleh mengandung angka'),
  name: z.string()
    .min(2, 'Nama minimal 2 karakter')
    .max(100, 'Nama maksimal 100 karakter'),
  birthDate: z.coerce.date({
    message: 'Tanggal lahir wajib diisi dan format harus valid',
  }),
  birthPlace: z.string()
    .min(2, 'Tempat lahir minimal 2 karakter')
    .max(100, 'Tempat lahir maksimal 100 karakter'),
  gender: z.enum(['L', 'P'], {
    message: 'Jenis kelamin wajib dipilih',
  }),
  religion: z.enum(['ISLAM', 'KRISTEN', 'KATOLIK', 'HINDU', 'BUDDHA', 'KONGHUCU'], {
    message: 'Agama wajib dipilih',
  }),
  education: z.enum(['TIDAK_SEKOLAH', 'SD', 'SMP', 'SMA', 'D1', 'D2', 'D3', 'S1', 'S2', 'S3'], {
    message: 'Pendidikan wajib dipilih',
  }),
  occupation: z.string()
    .min(2, 'Pekerjaan minimal 2 karakter')
    .max(100, 'Pekerjaan maksimal 100 karakter'),
  maritalStatus: z.enum(['BELUM_KAWIN', 'KAWIN', 'CERAI_HIDUP', 'CERAI_MATI'], {
    message: 'Status perkawinan wajib dipilih',
  }),
  bloodType: z.enum(['A', 'B', 'AB', 'O']).optional(),
  familyId: z.string().cuid().optional(),
  isHeadOfFamily: z.boolean().default(false),
})

// Address validation schema
export const addressSchema = z.object({
  street: z.string()
    .min(5, 'Alamat jalan minimal 5 karakter')
    .max(200, 'Alamat jalan maksimal 200 karakter'),
  rt: z.string()
    .min(1, 'RT wajib diisi')
    .max(10, 'RT maksimal 10 karakter'),
  rw: z.string()
    .min(1, 'RW wajib diisi')
    .max(10, 'RW maksimal 10 karakter'),
  village: z.string()
    .min(2, 'Desa minimal 2 karakter')
    .max(100, 'Desa maksimal 100 karakter'),
  district: z.string()
    .min(2, 'Kecamatan minimal 2 karakter')
    .max(100, 'Kecamatan maksimal 100 karakter'),
  regency: z.string()
    .min(2, 'Kabupaten minimal 2 karakter')
    .max(100, 'Kabupaten maksimal 100 karakter'),
  province: z.string()
    .min(2, 'Provinsi minimal 2 karakter')
    .max(100, 'Provinsi maksimal 100 karakter'),
  postalCode: z.string()
    .regex(/^\d{5}$/, 'Kode pos harus 5 digit angka')
    .optional(),
})

// Family validation schema
export const familySchema = z.object({
  familyNumber: z.string()
    .min(5, 'Nomor KK minimal 5 karakter')
    .max(50, 'Nomor KK maksimal 50 karakter'),
  socialStatus: z.enum(['MAMPU', 'KURANG_MAMPU', 'MISKIN']).default('MAMPU'),
  addressId: z.string().cuid().optional(),
})

// Letter request validation schema
export const letterRequestSchema = z.object({
  citizenId: z.string().cuid('ID penduduk tidak valid'),
  letterType: z.enum([
    'SURAT_KETERANGAN_DOMISILI',
    'SURAT_KETERANGAN_USAHA',
    'SURAT_KETERANGAN_TIDAK_MAMPU',
    'SURAT_PENGANTAR',
    'LAINNYA'
  ], {
    message: 'Jenis surat wajib dipilih',
  }),
  purpose: z.string()
    .min(10, 'Keperluan minimal 10 karakter')
    .max(500, 'Keperluan maksimal 500 karakter'),
  notes: z.string()
    .max(1000, 'Catatan maksimal 1000 karakter')
    .optional(),
})

// Document validation schema
export const documentSchema = z.object({
  name: z.string()
    .min(2, 'Nama dokumen minimal 2 karakter')
    .max(200, 'Nama dokumen maksimal 200 karakter'),
  type: z.enum(['KTP', 'KK', 'AKTA_LAHIR', 'IJAZAH', 'SERTIFIKAT', 'LAINNYA'], {
    message: 'Jenis dokumen wajib dipilih',
  }),
  url: z.string().url('URL dokumen tidak valid'),
  size: z.number().positive('Ukuran file harus positif'),
  mimeType: z.string().min(1, 'Tipe MIME wajib diisi'),
  citizenId: z.string().cuid().optional(),
  letterRequestId: z.string().cuid().optional(),
})

// Village configuration validation schema
export const villageConfigSchema = z.object({
  name: z.string()
    .min(2, 'Nama desa minimal 2 karakter')
    .max(100, 'Nama desa maksimal 100 karakter'),
  code: z.string()
    .min(3, 'Kode desa minimal 3 karakter')
    .max(20, 'Kode desa maksimal 20 karakter'),
  headName: z.string()
    .min(2, 'Nama kepala desa minimal 2 karakter')
    .max(100, 'Nama kepala desa maksimal 100 karakter'),
  address: z.string()
    .min(10, 'Alamat desa minimal 10 karakter')
    .max(500, 'Alamat desa maksimal 500 karakter'),
  phone: z.string()
    .regex(/^[\d\-\+\(\)\s]+$/, 'Format nomor telepon tidak valid')
    .optional(),
  email: z.string()
    .email('Format email tidak valid')
    .optional(),
  website: z.string()
    .url('Format website tidak valid')
    .optional(),
  description: z.string()
    .max(1000, 'Deskripsi maksimal 1000 karakter')
    .optional(),
})

// Search and filter schemas
export const searchSchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

// File upload validation
export const fileUploadSchema = z.object({
  file: z.any().refine(
    (file) => file instanceof File,
    'File wajib diupload'
  ).refine(
    (file) => file.size <= 10 * 1024 * 1024, // 10MB
    'Ukuran file maksimal 10MB'
  ),
  type: z.enum(['image', 'document']).default('document'),
})

// Complaint validation schema
export const complaintSchema = z.object({
  title: z.string().min(5, 'Judul minimal 5 karakter').max(200, 'Judul maksimal 200 karakter'),
  description: z.string().min(10, 'Deskripsi minimal 10 karakter').max(2000, 'Deskripsi maksimal 2000 karakter'),
  category: z.string().min(3, 'Kategori minimal 3 karakter').max(100, 'Kategori maksimal 100 karakter'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  submitterId: z.string().cuid().optional(),
})

// Article CMS schemas
export const articleSchema = z.object({
  title: z.string().min(3, 'Judul minimal 3 karakter').max(200, 'Judul maksimal 200 karakter'),
  slug: z.string().min(3, 'Slug minimal 3 karakter').max(200, 'Slug maksimal 200 karakter'),
  content: z.string().min(10, 'Konten minimal 10 karakter'),
  excerpt: z.string().max(500).optional(),
  // Map to relation field 'category' connect when provided
  categoryId: z.string().cuid().optional(),
  published: z.boolean().default(false),
})

export const categorySchema = z.object({
  name: z.string().min(3, 'Nama kategori minimal 3 karakter').max(100),
  slug: z.string().min(3, 'Slug minimal 3 karakter').max(100),
  description: z.string().max(500).optional(),
})

// Financial schemas
export const budgetSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  category: z.string().min(2),
  subcategory: z.string().optional(),
  description: z.string().min(3),
  amount: z.coerce.number().nonnegative(),
})

export const expenseSchema = z.object({
  budgetId: z.string().cuid(),
  description: z.string().min(3),
  amount: z.coerce.number().positive(),
  date: z.coerce.date(),
  receipt: z.string().url().optional(),
})

export const aidProgramSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  budget: z.coerce.number().nonnegative().optional(),
  criteria: z.string().min(3),
})

// Export types
export type UserInput = z.infer<typeof userSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type CitizenInput = z.infer<typeof citizenSchema>
export type AddressInput = z.infer<typeof addressSchema>
export type FamilyInput = z.infer<typeof familySchema>
export type LetterRequestInput = z.infer<typeof letterRequestSchema>
export type DocumentInput = z.infer<typeof documentSchema>
export type VillageConfigInput = z.infer<typeof villageConfigSchema>
export type SearchInput = z.infer<typeof searchSchema>
export type DateRangeInput = z.infer<typeof dateRangeSchema>
export type FileUploadInput = z.infer<typeof fileUploadSchema>
export type ComplaintInput = z.infer<typeof complaintSchema>
export type ArticleInput = z.infer<typeof articleSchema>
export type CategoryInput = z.infer<typeof categorySchema>