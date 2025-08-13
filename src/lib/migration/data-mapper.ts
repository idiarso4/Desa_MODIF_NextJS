/**
 * Data Mapping Utilities
 * Maps data from MySQL OpenSID format to PostgreSQL format
 */

import { Gender, Religion, Education, MaritalStatus, BloodType, SocialStatus } from '@prisma/client'

export interface MySQLUser {
  id: number
  username: string
  password: string
  nama: string
  email: string
  id_grup: number
  active: number
  last_login?: string
  created_at?: string
  updated_at?: string
}

export interface MySQLPenduduk {
  id: number
  nik: string
  nama: string
  tempatlahir: string
  tanggallahir: string
  sex: number
  agama_id: number
  pendidikan_kk_id: number
  pekerjaan_id: number
  status_kawin: number
  golongan_darah_id?: number
  id_kk: number
  kk_level: number
  alamat_sekarang?: string
  created_at?: string
  updated_at?: string
}

export interface MySQLKeluarga {
  id: number
  no_kk: string
  nik_kepala: string
  tgl_daftar: string
  kelas_sosial: number
  alamat?: string
  created_at?: string
  updated_at?: string
}

export class DataMapper {
  
  /**
   * Map MySQL user to PostgreSQL format
   */
  static mapUser(mysqlUser: MySQLUser): any {
    return {
      id: `mysql_${mysqlUser.id}`, // Prefix to avoid ID conflicts
      username: mysqlUser.username,
      email: mysqlUser.email || `${mysqlUser.username}@example.com`,
      name: mysqlUser.nama,
      password: mysqlUser.password, // Already hashed
      roleId: this.mapUserRole(mysqlUser.id_grup),
      isActive: mysqlUser.active === 1,
      lastLogin: mysqlUser.last_login ? new Date(mysqlUser.last_login) : null,
      createdAt: mysqlUser.created_at ? new Date(mysqlUser.created_at) : new Date(),
      updatedAt: mysqlUser.updated_at ? new Date(mysqlUser.updated_at) : new Date()
    }
  }

  /**
   * Map MySQL penduduk (citizen) to PostgreSQL format
   */
  static mapCitizen(mysqlPenduduk: MySQLPenduduk, createdById: string): any {
    return {
      id: `mysql_${mysqlPenduduk.id}`,
      nik: mysqlPenduduk.nik.padStart(16, '0'), // Ensure 16 digits
      name: mysqlPenduduk.nama,
      birthDate: new Date(mysqlPenduduk.tanggallahir),
      birthPlace: mysqlPenduduk.tempatlahir,
      gender: this.mapGender(mysqlPenduduk.sex),
      religion: this.mapReligion(mysqlPenduduk.agama_id),
      education: this.mapEducation(mysqlPenduduk.pendidikan_kk_id),
      occupation: this.mapOccupation(mysqlPenduduk.pekerjaan_id),
      maritalStatus: this.mapMaritalStatus(mysqlPenduduk.status_kawin),
      bloodType: mysqlPenduduk.golongan_darah_id ? this.mapBloodType(mysqlPenduduk.golongan_darah_id) : null,
      familyId: mysqlPenduduk.id_kk ? `mysql_family_${mysqlPenduduk.id_kk}` : null,
      isHeadOfFamily: mysqlPenduduk.kk_level === 1,
      createdById: createdById,
      createdAt: mysqlPenduduk.created_at ? new Date(mysqlPenduduk.created_at) : new Date(),
      updatedAt: mysqlPenduduk.updated_at ? new Date(mysqlPenduduk.updated_at) : new Date()
    }
  }

  /**
   * Map MySQL keluarga (family) to PostgreSQL format
   */
  static mapFamily(mysqlKeluarga: MySQLKeluarga): any {
    return {
      id: `mysql_family_${mysqlKeluarga.id}`,
      familyNumber: mysqlKeluarga.no_kk,
      socialStatus: this.mapSocialStatus(mysqlKeluarga.kelas_sosial),
      createdAt: mysqlKeluarga.created_at ? new Date(mysqlKeluarga.created_at) : new Date(),
      updatedAt: mysqlKeluarga.updated_at ? new Date(mysqlKeluarga.updated_at) : new Date()
    }
  }

  /**
   * Map gender from MySQL format (1=L, 2=P)
   */
  static mapGender(sex: number): Gender {
    return sex === 1 ? Gender.L : Gender.P
  }

  /**
   * Map religion from MySQL ID to enum
   */
  static mapReligion(agamaId: number): Religion {
    const religionMap: Record<number, Religion> = {
      1: Religion.ISLAM,
      2: Religion.KRISTEN,
      3: Religion.KATOLIK,
      4: Religion.HINDU,
      5: Religion.BUDDHA,
      6: Religion.KONGHUCU
    }
    return religionMap[agamaId] || Religion.ISLAM
  }

  /**
   * Map education from MySQL ID to enum
   */
  static mapEducation(pendidikanId: number): Education {
    const educationMap: Record<number, Education> = {
      1: Education.TIDAK_SEKOLAH,
      2: Education.SD,
      3: Education.SMP,
      4: Education.SMA,
      5: Education.D1,
      6: Education.D2,
      7: Education.D3,
      8: Education.S1,
      9: Education.S2,
      10: Education.S3
    }
    return educationMap[pendidikanId] || Education.SD
  }

  /**
   * Map occupation from MySQL ID to string
   */
  static mapOccupation(pekerjaanId: number): string {
    const occupationMap: Record<number, string> = {
      1: 'Tidak Bekerja',
      2: 'Petani',
      3: 'Buruh Tani',
      4: 'Nelayan',
      5: 'Pedagang',
      6: 'Wiraswasta',
      7: 'PNS',
      8: 'TNI/Polri',
      9: 'Pensiunan',
      10: 'Pelajar/Mahasiswa',
      11: 'Ibu Rumah Tangga',
      12: 'Lainnya'
    }
    return occupationMap[pekerjaanId] || 'Lainnya'
  }

  /**
   * Map marital status from MySQL ID to enum
   */
  static mapMaritalStatus(statusKawin: number): MaritalStatus {
    const maritalMap: Record<number, MaritalStatus> = {
      1: MaritalStatus.BELUM_KAWIN,
      2: MaritalStatus.KAWIN,
      3: MaritalStatus.CERAI_HIDUP,
      4: MaritalStatus.CERAI_MATI
    }
    return maritalMap[statusKawin] || MaritalStatus.BELUM_KAWIN
  }

  /**
   * Map blood type from MySQL ID to enum
   */
  static mapBloodType(golonganDarahId: number): BloodType {
    const bloodTypeMap: Record<number, BloodType> = {
      1: BloodType.A,
      2: BloodType.B,
      3: BloodType.AB,
      4: BloodType.O
    }
    return bloodTypeMap[golonganDarahId] || BloodType.O
  }

  /**
   * Map social status from MySQL ID to enum
   */
  static mapSocialStatus(kelasSosial: number): SocialStatus {
    const socialMap: Record<number, SocialStatus> = {
      1: SocialStatus.MAMPU,
      2: SocialStatus.KURANG_MAMPU,
      3: SocialStatus.MISKIN
    }
    return socialMap[kelasSosial] || SocialStatus.MAMPU
  }

  /**
   * Map user role from MySQL group ID
   */
  static mapUserRole(idGrup: number): string {
    // This will need to be updated based on actual role IDs in PostgreSQL
    const roleMap: Record<number, string> = {
      1: 'super-admin', // Will be replaced with actual role ID
      2: 'admin-desa',
      3: 'operator',
      4: 'viewer'
    }
    return roleMap[idGrup] || 'viewer'
  }

  /**
   * Validate NIK format
   */
  static validateNIK(nik: string): boolean {
    return /^[0-9]{16}$/.test(nik)
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)
  }

  /**
   * Clean and validate data before migration
   */
  static cleanData(data: any): any {
    const cleaned = { ...data }

    // Remove null/undefined values
    Object.keys(cleaned).forEach(key => {
      if (cleaned[key] === null || cleaned[key] === undefined || cleaned[key] === '') {
        delete cleaned[key]
      }
    })

    // Trim string values
    Object.keys(cleaned).forEach(key => {
      if (typeof cleaned[key] === 'string') {
        cleaned[key] = cleaned[key].trim()
      }
    })

    return cleaned
  }

  /**
   * Generate migration report
   */
  static generateMigrationReport(
    tableName: string,
    totalRecords: number,
    successCount: number,
    errorCount: number,
    errors: string[]
  ): any {
    return {
      tableName,
      totalRecords,
      successCount,
      errorCount,
      successRate: totalRecords > 0 ? (successCount / totalRecords) * 100 : 0,
      errors: errors.slice(0, 10), // Limit to first 10 errors
      timestamp: new Date().toISOString()
    }
  }
}