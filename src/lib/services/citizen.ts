// Citizen service with business logic
import { prisma } from '../prisma'
import { citizenRepository } from '../repositories/citizen'
import { userRepository } from '../repositories/user'
import type { Citizen } from '../../types'
import type { CitizenInput } from '../validations'

export class CitizenService {
  async createCitizen(data: CitizenInput & { createdById: string }): Promise<Citizen> {
    // Check if NIK already exists
    const existingCitizen = await citizenRepository.findByNik(data.nik)
    if (existingCitizen) {
      throw new Error('NIK sudah terdaftar dalam sistem')
    }

    // Validate creator exists
    const creator = await userRepository.findById(data.createdById)
    if (!creator) {
      throw new Error('User pembuat tidak ditemukan')
    }

    // Create citizen
    const citizen = await citizenRepository.create(data)
    return citizen
  }

  async updateCitizen(id: string, data: Partial<CitizenInput>): Promise<Citizen> {
    // Check if citizen exists
    const existingCitizen = await citizenRepository.findById(id)
    if (!existingCitizen) {
      throw new Error('Data penduduk tidak ditemukan')
    }

    // If NIK is being updated, check for duplicates
    if (data.nik && data.nik !== existingCitizen.nik) {
      const nikExists = await citizenRepository.findByNik(data.nik)
      if (nikExists) {
        throw new Error('NIK sudah terdaftar dalam sistem')
      }
    }

    // Update citizen
    const updatedCitizen = await citizenRepository.update(id, data)
    return updatedCitizen
  }

  async deleteCitizen(id: string): Promise<void> {
    // Check if citizen exists
    const citizen = await citizenRepository.findById(id)
    if (!citizen) {
      throw new Error('Data penduduk tidak ditemukan')
    }

    // Check if citizen is head of family
    if (citizen.isHeadOfFamily) {
      throw new Error('Tidak dapat menghapus kepala keluarga. Pindahkan status kepala keluarga terlebih dahulu.')
    }

    // Delete citizen
    await citizenRepository.delete(id)
  }

  async getCitizenById(id: string): Promise<Citizen | null> {
    return await citizenRepository.findById(id)
  }

  async getCitizenByNik(nik: string): Promise<Citizen | null> {
    return await citizenRepository.findByNik(nik)
  }

  async searchCitizens(query: string, options: { page?: number; limit?: number } = {}) {
    if (query.trim().length === 0) {
      return await citizenRepository.findMany(options)
    }
    
    return await citizenRepository.searchCitizens(query)
  }

  async getCitizenStatistics() {
    return await citizenRepository.getStatistics()
  }

  async setAsHeadOfFamily(citizenId: string, familyId: string): Promise<Citizen> {
    // Remove current head of family
    await prisma.citizen.updateMany({
      where: { familyId, isHeadOfFamily: true },
      data: { isHeadOfFamily: false },
    })

    // Set new head of family
    const updatedCitizen = await citizenRepository.update(citizenId, {
      familyId,
      isHeadOfFamily: true,
    })

    return updatedCitizen
  }

  async validateCitizenData(data: CitizenInput): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = []

    // Check NIK format (16 digits)
    if (!/^\d{16}$/.test(data.nik)) {
      errors.push('NIK harus terdiri dari 16 digit angka')
    }

    // Check age (must be reasonable)
    const age = new Date().getFullYear() - data.birthDate.getFullYear()
    if (age < 0 || age > 150) {
      errors.push('Tanggal lahir tidak valid')
    }

    // Check if NIK already exists (for new citizens)
    const existingCitizen = await citizenRepository.findByNik(data.nik)
    if (existingCitizen) {
      errors.push('NIK sudah terdaftar dalam sistem')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }
}

export const citizenService = new CitizenService()