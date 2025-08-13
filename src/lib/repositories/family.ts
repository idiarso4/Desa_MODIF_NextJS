/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Family } from "@/types"
import { prisma } from "../prisma"
import { BaseRepository } from "./base"

export class FamilyRepository extends BaseRepository<Family> {
  protected model = prisma.family as any
  protected include = {
    address: true,
    members: true,
  }

  async findByFamilyNumber(familyNumber: string): Promise<Family | null> {
    return (await this.model.findUnique({ where: { familyNumber }, include: this.include })) as Family | null
  }
}

export const familyRepository = new FamilyRepository()

