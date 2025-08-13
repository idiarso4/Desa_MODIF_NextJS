/* eslint-disable @typescript-eslint/no-explicit-any */
// Citizen repository
import { prisma } from '../prisma'
import { BaseRepository } from './base'
import type { Citizen } from '../../types'

export class CitizenRepository extends BaseRepository<Citizen> {
  protected model = prisma.citizen as any
  protected include = {
    address: true,
    family: {
      include: {
        address: true,
      },
    },
    documents: true,
    createdBy: {
      select: {
        id: true,
        name: true,
        username: true,
      },
    },
  }

  async findByNik(nik: string): Promise<Citizen | null> {
    return await this.model.findUnique({
      where: { nik },
      include: this.include,
    }) as Citizen | null
  }

  async searchCitizens(query: string): Promise<Citizen[]> {
    return await this.model.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { nik: { contains: query, mode: 'insensitive' } },
          { occupation: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: this.include,
      orderBy: { name: 'asc' },
    }) as Citizen[]
  }

  async findByFamily(familyId: string): Promise<Citizen[]> {
    return await this.model.findMany({
      where: { familyId },
      include: this.include,
      orderBy: [
        { isHeadOfFamily: 'desc' },
        { birthDate: 'asc' },
      ],
    }) as Citizen[]
  }

  async findHeadsOfFamily(): Promise<Citizen[]> {
    return await this.model.findMany({
      where: { isHeadOfFamily: true },
      include: this.include,
      orderBy: { name: 'asc' },
    }) as Citizen[]
  }

  async getStatistics() {
    const [
      total,
      maleCount,
      femaleCount,
      marriedCount,
      singleCount,
      childrenCount,
      adultCount,
      elderlyCount,
    ] = await Promise.all([
      this.model.count(),
      this.model.count({ where: { gender: 'L' } }),
      this.model.count({ where: { gender: 'P' } }),
      this.model.count({ where: { maritalStatus: 'KAWIN' } }),
      this.model.count({ where: { maritalStatus: 'BELUM_KAWIN' } }),
      this.model.count({
        where: {
          birthDate: {
            gte: new Date(new Date().getFullYear() - 17, 0, 1),
          },
        },
      }),
      this.model.count({
        where: {
          birthDate: {
            gte: new Date(new Date().getFullYear() - 60, 0, 1),
            lt: new Date(new Date().getFullYear() - 17, 0, 1),
          },
        },
      }),
      this.model.count({
        where: {
          birthDate: {
            lt: new Date(new Date().getFullYear() - 60, 0, 1),
          },
        },
      }),
    ])

    return {
      total,
      byGender: {
        male: maleCount,
        female: femaleCount,
      },
      byMaritalStatus: {
        married: marriedCount,
        single: singleCount,
      },
      byAge: {
        children: childrenCount,
        adults: adultCount,
        elderly: elderlyCount,
      },
    }
  }

  async findByEducation(education: string): Promise<Citizen[]> {
    return await this.model.findMany({
      where: { education },
      include: this.include,
      orderBy: { name: 'asc' },
    }) as Citizen[]
  }

  async findByReligion(religion: string): Promise<Citizen[]> {
    return await this.model.findMany({
      where: { religion },
      include: this.include,
      orderBy: { name: 'asc' },
    }) as Citizen[]
  }
}

export const citizenRepository = new CitizenRepository()