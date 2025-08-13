/* eslint-disable @typescript-eslint/no-explicit-any */
// Base repository with common CRUD operations
import type { PaginatedResult, PaginationOptions } from '../db-utils'
import { paginate } from '../db-utils'

export abstract class BaseRepository<T> {
  protected abstract model: Record<string, unknown>
  protected abstract include?: Record<string, unknown>

  async findById(id: string): Promise<T | null> {
    const result = await (this.model as any).findUnique({
      where: { id },
      include: this.include,
    })
    return result as T | null
  }

  async findMany(options: PaginationOptions & {
    where?: Record<string, unknown>
    orderBy?: Record<string, unknown>
  } = {}): Promise<PaginatedResult<T>> {
    return await paginate<T>(this.model as any, {
      ...options,
      include: this.include,
    })
  }

  async create(data: Record<string, unknown>): Promise<T> {
    const result = await (this.model as any).create({
      data,
      include: this.include,
    })
    return result as T
  }

  async update(id: string, data: Record<string, unknown>): Promise<T> {
    const result = await (this.model as any).update({
      where: { id },
      data,
      include: this.include,
    })
    return result as T
  }

  async delete(id: string): Promise<T> {
    const result = await (this.model as any).delete({
      where: { id },
      include: this.include,
    })
    return result as T
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return await (this.model as any).count({ where })
  }

  async exists(where: Record<string, unknown>): Promise<boolean> {
    const count = await (this.model as any).count({ where })
    return count > 0
  }
}