/* eslint-disable @typescript-eslint/no-explicit-any */
// User repository
import { prisma } from '../prisma'
import { BaseRepository } from './base'
import type { User } from '../../types'

export class UserRepository extends BaseRepository<User> {
  protected model = prisma.user as any
  protected include = {
    role: {
      include: {
        permissions: true,
      },
    },
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.model.findUnique({
      where: { username },
      include: this.include,
    })
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.model.findUnique({
      where: { email },
      include: this.include,
    })
  }

  async findByCredentials(usernameOrEmail: string): Promise<User | null> {
    return await this.model.findFirst({
      where: {
        OR: [
          { username: usernameOrEmail },
          { email: usernameOrEmail },
        ],
        isActive: true,
      },
      include: this.include,
    })
  }

  async updateLastLogin(id: string): Promise<User> {
    return await this.model.update({
      where: { id },
      data: { lastLogin: new Date() },
      include: this.include,
    })
  }

  async findActiveUsers(): Promise<User[]> {
    return await this.model.findMany({
      where: { isActive: true },
      include: this.include,
      orderBy: { name: 'asc' },
    })
  }

  async searchUsers(query: string) {
    return await this.model.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { username: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
        isActive: true,
      },
      include: this.include,
      orderBy: { name: 'asc' },
    })
  }
}

export const userRepository = new UserRepository()