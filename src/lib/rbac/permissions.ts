/**
 * Role-Based Access Control (RBAC) Permissions
 * Defines all system permissions and role mappings
 */

export interface Permission {
  id: string
  name: string
  resource: string
  action: string
  description: string
}

export interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
}

/**
 * System Resources
 */
export const RESOURCES = {
  USERS: 'users',
  CITIZENS: 'citizens',
  FAMILIES: 'families',
  LETTERS: 'letters',
  DOCUMENTS: 'documents',
  FINANCE: 'finance',
  CONTENT: 'content',
  REPORTS: 'reports',
  SETTINGS: 'settings',
  SYSTEM: 'system',
  GROUPS: 'groups',
  INVENTORY: 'inventory',
  COMPLAINTS: 'complaints',
  VILLAGE: 'village'
} as const

/**
 * System Actions
 */
export const ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  MANAGE: 'manage',
  PROCESS: 'process',
  APPROVE: 'approve',
  EXPORT: 'export',
  IMPORT: 'import',
  PUBLISH: 'publish'
} as const

/**
 * All System Permissions
 */
export const PERMISSIONS: Permission[] = [
  // User Management
  {
    id: 'users.manage',
    name: 'Kelola Pengguna',
    resource: RESOURCES.USERS,
    action: ACTIONS.MANAGE,
    description: 'Mengelola semua aspek pengguna sistem'
  },
  {
    id: 'users.read',
    name: 'Lihat Pengguna',
    resource: RESOURCES.USERS,
    action: ACTIONS.READ,
    description: 'Melihat daftar dan detail pengguna'
  },
  {
    id: 'users.create',
    name: 'Tambah Pengguna',
    resource: RESOURCES.USERS,
    action: ACTIONS.CREATE,
    description: 'Menambah pengguna baru'
  },
  {
    id: 'users.update',
    name: 'Edit Pengguna',
    resource: RESOURCES.USERS,
    action: ACTIONS.UPDATE,
    description: 'Mengubah data pengguna'
  },
  {
    id: 'users.delete',
    name: 'Hapus Pengguna',
    resource: RESOURCES.USERS,
    action: ACTIONS.DELETE,
    description: 'Menghapus pengguna'
  },

  // Citizen Management
  {
    id: 'citizens.manage',
    name: 'Kelola Penduduk',
    resource: RESOURCES.CITIZENS,
    action: ACTIONS.MANAGE,
    description: 'Mengelola semua aspek data penduduk'
  },
  {
    id: 'citizens.read',
    name: 'Lihat Penduduk',
    resource: RESOURCES.CITIZENS,
    action: ACTIONS.READ,
    description: 'Melihat daftar dan detail penduduk'
  },
  {
    id: 'citizens.create',
    name: 'Tambah Penduduk',
    resource: RESOURCES.CITIZENS,
    action: ACTIONS.CREATE,
    description: 'Menambah data penduduk baru'
  },
  {
    id: 'citizens.update',
    name: 'Edit Penduduk',
    resource: RESOURCES.CITIZENS,
    action: ACTIONS.UPDATE,
    description: 'Mengubah data penduduk'
  },
  {
    id: 'citizens.delete',
    name: 'Hapus Penduduk',
    resource: RESOURCES.CITIZENS,
    action: ACTIONS.DELETE,
    description: 'Menghapus data penduduk'
  },
  {
    id: 'citizens.export',
    name: 'Export Data Penduduk',
    resource: RESOURCES.CITIZENS,
    action: ACTIONS.EXPORT,
    description: 'Mengexport data penduduk'
  },
  {
    id: 'citizens.import',
    name: 'Import Data Penduduk',
    resource: RESOURCES.CITIZENS,
    action: ACTIONS.IMPORT,
    description: 'Mengimport data penduduk'
  },

  // Family Management
  {
    id: 'families.manage',
    name: 'Kelola Keluarga',
    resource: RESOURCES.FAMILIES,
    action: ACTIONS.MANAGE,
    description: 'Mengelola data keluarga'
  },
  {
    id: 'families.read',
    name: 'Lihat Keluarga',
    resource: RESOURCES.FAMILIES,
    action: ACTIONS.READ,
    description: 'Melihat data keluarga'
  },
  {
    id: 'families.create',
    name: 'Tambah Keluarga',
    resource: RESOURCES.FAMILIES,
    action: ACTIONS.CREATE,
    description: 'Menambah data keluarga baru'
  },
  {
    id: 'families.update',
    name: 'Edit Keluarga',
    resource: RESOURCES.FAMILIES,
    action: ACTIONS.UPDATE,
    description: 'Mengubah data keluarga'
  },
  {
    id: 'families.delete',
    name: 'Hapus Keluarga',
    resource: RESOURCES.FAMILIES,
    action: ACTIONS.DELETE,
    description: 'Menghapus data keluarga'
  },

  // Letter Management
  {
    id: 'letters.manage',
    name: 'Kelola Surat',
    resource: RESOURCES.LETTERS,
    action: ACTIONS.MANAGE,
    description: 'Mengelola semua aspek surat menyurat'
  },
  {
    id: 'letters.read',
    name: 'Lihat Surat',
    resource: RESOURCES.LETTERS,
    action: ACTIONS.READ,
    description: 'Melihat daftar dan detail surat'
  },
  {
    id: 'letters.create',
    name: 'Buat Surat',
    resource: RESOURCES.LETTERS,
    action: ACTIONS.CREATE,
    description: 'Membuat surat baru'
  },
  {
    id: 'letters.process',
    name: 'Proses Surat',
    resource: RESOURCES.LETTERS,
    action: ACTIONS.PROCESS,
    description: 'Memproses permohonan surat'
  },
  {
    id: 'letters.approve',
    name: 'Setujui Surat',
    resource: RESOURCES.LETTERS,
    action: ACTIONS.APPROVE,
    description: 'Menyetujui surat'
  },

  // Document Management
  {
    id: 'documents.manage',
    name: 'Kelola Dokumen',
    resource: RESOURCES.DOCUMENTS,
    action: ACTIONS.MANAGE,
    description: 'Mengelola dokumen'
  },
  {
    id: 'documents.read',
    name: 'Lihat Dokumen',
    resource: RESOURCES.DOCUMENTS,
    action: ACTIONS.READ,
    description: 'Melihat dokumen'
  },
  {
    id: 'documents.create',
    name: 'Upload Dokumen',
    resource: RESOURCES.DOCUMENTS,
    action: ACTIONS.CREATE,
    description: 'Mengupload dokumen'
  },
  {
    id: 'documents.delete',
    name: 'Hapus Dokumen',
    resource: RESOURCES.DOCUMENTS,
    action: ACTIONS.DELETE,
    description: 'Menghapus dokumen'
  },

  // Financial Management
  {
    id: 'finance.manage',
    name: 'Kelola Keuangan',
    resource: RESOURCES.FINANCE,
    action: ACTIONS.MANAGE,
    description: 'Mengelola semua aspek keuangan'
  },
  {
    id: 'finance.read',
    name: 'Lihat Keuangan',
    resource: RESOURCES.FINANCE,
    action: ACTIONS.READ,
    description: 'Melihat data keuangan'
  },
  {
    id: 'finance.create',
    name: 'Input Keuangan',
    resource: RESOURCES.FINANCE,
    action: ACTIONS.CREATE,
    description: 'Menginput data keuangan'
  },
  {
    id: 'finance.approve',
    name: 'Setujui Keuangan',
    resource: RESOURCES.FINANCE,
    action: ACTIONS.APPROVE,
    description: 'Menyetujui transaksi keuangan'
  },

  // Content Management
  {
    id: 'content.manage',
    name: 'Kelola Konten',
    resource: RESOURCES.CONTENT,
    action: ACTIONS.MANAGE,
    description: 'Mengelola konten website'
  },
  {
    id: 'content.read',
    name: 'Lihat Konten',
    resource: RESOURCES.CONTENT,
    action: ACTIONS.READ,
    description: 'Melihat konten'
  },
  {
    id: 'content.create',
    name: 'Buat Konten',
    resource: RESOURCES.CONTENT,
    action: ACTIONS.CREATE,
    description: 'Membuat konten baru'
  },
  {
    id: 'content.publish',
    name: 'Publikasi Konten',
    resource: RESOURCES.CONTENT,
    action: ACTIONS.PUBLISH,
    description: 'Mempublikasikan konten'
  },

  // Reports
  {
    id: 'reports.read',
    name: 'Lihat Laporan',
    resource: RESOURCES.REPORTS,
    action: ACTIONS.READ,
    description: 'Melihat laporan'
  },
  {
    id: 'reports.export',
    name: 'Export Laporan',
    resource: RESOURCES.REPORTS,
    action: ACTIONS.EXPORT,
    description: 'Mengexport laporan'
  },
  {
    id: 'reports.manage',
    name: 'Kelola Laporan',
    resource: RESOURCES.REPORTS,
    action: ACTIONS.MANAGE,
    description: 'Mengelola template laporan'
  },

  // Settings
  {
    id: 'settings.manage',
    name: 'Kelola Pengaturan',
    resource: RESOURCES.SETTINGS,
    action: ACTIONS.MANAGE,
    description: 'Mengelola pengaturan sistem'
  },
  {
    id: 'settings.read',
    name: 'Lihat Pengaturan',
    resource: RESOURCES.SETTINGS,
    action: ACTIONS.READ,
    description: 'Melihat pengaturan'
  },

  // System Administration
  {
    id: 'system.manage',
    name: 'Kelola Sistem',
    resource: RESOURCES.SYSTEM,
    action: ACTIONS.MANAGE,
    description: 'Mengelola sistem secara keseluruhan'
  },
  {
    id: 'system.read',
    name: 'Monitor Sistem',
    resource: RESOURCES.SYSTEM,
    action: ACTIONS.READ,
    description: 'Memonitor status sistem'
  },

  // Groups Management
  {
    id: 'groups.manage',
    name: 'Kelola Kelompok',
    resource: RESOURCES.GROUPS,
    action: ACTIONS.MANAGE,
    description: 'Mengelola kelompok masyarakat'
  },
  {
    id: 'groups.read',
    name: 'Lihat Kelompok',
    resource: RESOURCES.GROUPS,
    action: ACTIONS.READ,
    description: 'Melihat data kelompok'
  },

  // Inventory Management
  {
    id: 'inventory.manage',
    name: 'Kelola Inventaris',
    resource: RESOURCES.INVENTORY,
    action: ACTIONS.MANAGE,
    description: 'Mengelola inventaris desa'
  },
  {
    id: 'inventory.read',
    name: 'Lihat Inventaris',
    resource: RESOURCES.INVENTORY,
    action: ACTIONS.READ,
    description: 'Melihat data inventaris'
  },

  // Complaints Management
  {
    id: 'complaints.manage',
    name: 'Kelola Pengaduan',
    resource: RESOURCES.COMPLAINTS,
    action: ACTIONS.MANAGE,
    description: 'Mengelola pengaduan masyarakat'
  },
  {
    id: 'complaints.read',
    name: 'Lihat Pengaduan',
    resource: RESOURCES.COMPLAINTS,
    action: ACTIONS.READ,
    description: 'Melihat pengaduan'
  },

  // Village Management
  {
    id: 'village.manage',
    name: 'Kelola Data Desa',
    resource: RESOURCES.VILLAGE,
    action: ACTIONS.MANAGE,
    description: 'Mengelola data dan konfigurasi desa'
  },
  {
    id: 'village.read',
    name: 'Lihat Data Desa',
    resource: RESOURCES.VILLAGE,
    action: ACTIONS.READ,
    description: 'Melihat data desa'
  }
]

/**
 * System Roles with their permissions
 */
export const ROLES: Role[] = [
  {
    id: 'super-admin',
    name: 'Super Admin',
    description: 'Administrator sistem dengan akses penuh ke semua fitur',
    permissions: PERMISSIONS.map(p => p.id) // All permissions
  },
  {
    id: 'admin-desa',
    name: 'Admin Desa',
    description: 'Administrator desa dengan akses ke sebagian besar fitur',
    permissions: [
      // User management (limited)
      'users.read',
      'users.create',
      'users.update',
      
      // Full citizen management
      'citizens.manage',
      'citizens.read',
      'citizens.create',
      'citizens.update',
      'citizens.delete',
      'citizens.export',
      'citizens.import',
      
      // Full family management
      'families.manage',
      'families.read',
      'families.create',
      'families.update',
      'families.delete',
      
      // Full letter management
      'letters.manage',
      'letters.read',
      'letters.create',
      'letters.process',
      'letters.approve',
      
      // Document management
      'documents.manage',
      'documents.read',
      'documents.create',
      'documents.delete',
      
      // Financial management
      'finance.manage',
      'finance.read',
      'finance.create',
      'finance.approve',
      
      // Content management
      'content.manage',
      'content.read',
      'content.create',
      'content.publish',
      
      // Reports
      'reports.read',
      'reports.export',
      'reports.manage',
      
      // Settings (limited)
      'settings.read',
      
      // Groups
      'groups.manage',
      'groups.read',
      
      // Inventory
      'inventory.manage',
      'inventory.read',
      
      // Complaints
      'complaints.manage',
      'complaints.read',
      
      // Village
      'village.manage',
      'village.read'
    ]
  },
  {
    id: 'operator',
    name: 'Operator',
    description: 'Operator data dengan akses input dan edit data',
    permissions: [
      // Citizen management (no delete)
      'citizens.read',
      'citizens.create',
      'citizens.update',
      'citizens.export',
      
      // Family management (no delete)
      'families.read',
      'families.create',
      'families.update',
      
      // Letter processing
      'letters.read',
      'letters.create',
      'letters.process',
      
      // Document management
      'documents.read',
      'documents.create',
      
      // Financial input
      'finance.read',
      'finance.create',
      
      // Content creation
      'content.read',
      'content.create',
      
      // Reports viewing
      'reports.read',
      'reports.export',
      
      // Groups
      'groups.read',
      
      // Inventory
      'inventory.read',
      
      // Complaints
      'complaints.read',
      
      // Village data
      'village.read'
    ]
  },
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'Pengguna dengan akses hanya lihat',
    permissions: [
      // Read-only access
      'citizens.read',
      'families.read',
      'letters.read',
      'documents.read',
      'finance.read',
      'content.read',
      'reports.read',
      'groups.read',
      'inventory.read',
      'complaints.read',
      'village.read'
    ]
  }
]

/**
 * Get permission by ID
 */
export function getPermission(id: string): Permission | undefined {
  return PERMISSIONS.find(p => p.id === id)
}

/**
 * Get role by ID
 */
export function getRole(id: string): Role | undefined {
  return ROLES.find(r => r.id === id)
}

/**
 * Get permissions for a role
 */
export function getRolePermissions(roleId: string): Permission[] {
  const role = getRole(roleId)
  if (!role) return []
  
  return role.permissions
    .map(permId => getPermission(permId))
    .filter((perm): perm is Permission => perm !== undefined)
}

/**
 * Check if role has permission
 */
export function roleHasPermission(roleId: string, permissionId: string): boolean {
  const role = getRole(roleId)
  return role ? role.permissions.includes(permissionId) : false
}

/**
 * Get permissions by resource
 */
export function getPermissionsByResource(resource: string): Permission[] {
  return PERMISSIONS.filter(p => p.resource === resource)
}

/**
 * Get permissions by action
 */
export function getPermissionsByAction(action: string): Permission[] {
  return PERMISSIONS.filter(p => p.action === action)
}