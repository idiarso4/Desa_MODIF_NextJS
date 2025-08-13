// Core types for OpenSID application
import type {
    Address as PrismaAddress,
    Citizen as PrismaCitizen,
    Document as PrismaDocument,
    Family as PrismaFamily,
    LetterRequest as PrismaLetterRequest,
    Permission as PrismaPermission,
    User as PrismaUser,
    UserRole as PrismaUserRole,
    VillageConfig as PrismaVillageConfig
} from '@prisma/client'

// Re-export Prisma types with relations
export type User = PrismaUser & {
  role?: UserRole
}

export type UserRole = PrismaUserRole & {
  permissions?: Permission[]
}

export type Permission = PrismaPermission

export type Citizen = PrismaCitizen & {
  address?: Address | null
  family?: Family | null
  documents?: Document[]
  letterRequests?: LetterRequest[]
  createdBy?: User
}

export type Family = PrismaFamily & {
  address?: Address | null
  members?: Citizen[]
}

export type Address = PrismaAddress

export type Document = PrismaDocument & {
  citizen?: Citizen | null
  letterRequest?: LetterRequest | null
  uploadedBy?: User
}

export type LetterRequest = PrismaLetterRequest & {
  citizen?: Citizen
  processedBy?: User | null
  documents?: Document[]
}

export type VillageConfig = PrismaVillageConfig

// Enums
export type Religion = 'Islam' | 'Kristen' | 'Katolik' | 'Hindu' | 'Buddha' | 'Konghucu'
export type Education = 'Tidak Sekolah' | 'SD' | 'SMP' | 'SMA' | 'D1' | 'D2' | 'D3' | 'S1' | 'S2' | 'S3'
export type MaritalStatus = 'Belum Kawin' | 'Kawin' | 'Cerai Hidup' | 'Cerai Mati'
export type SocialStatus = 'Mampu' | 'Kurang Mampu' | 'Miskin'
export type DocumentType = 'KTP' | 'KK' | 'Akta Lahir' | 'Ijazah' | 'Sertifikat' | 'Lainnya'
export type LetterType = 'Surat Keterangan Domisili' | 'Surat Keterangan Usaha' | 'Surat Keterangan Tidak Mampu' | 'Surat Pengantar' | 'Lainnya'
export type RequestStatus = 'Pending' | 'Diproses' | 'Selesai' | 'Ditolak'

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Auth user shape used in session and auth flows
export type AuthUser = {
  id: string
  username: string
  email: string
  name: string
  role: {
    id: string
    name: string
    permissions: Array<{
      resource: string
      action: string
      name: string
    }>
  }
}