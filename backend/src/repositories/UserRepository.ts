import { PrismaClient, User } from '@prisma/client'
import { BaseRepository } from './BaseRepository'

export class UserRepository extends BaseRepository<User> {
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  protected get model() {
    return this.prisma.user
  }

  async findByWalletAddress(walletAddress: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { walletAddress } })
  }

  async upsertByWalletAddress(
    walletAddress: string,
    data: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<User> {
    return this.prisma.user.upsert({
      where: { walletAddress },
      create: { walletAddress, ...data },
      update: data,
    })
  }

  async findWithMetrics(walletAddress: string): Promise<User & { metrics: unknown } | null> {
    return this.prisma.user.findUnique({
      where: { walletAddress },
      include: { metrics: true },
    }) as Promise<any>
  }

  async findWithGroups(walletAddress: string): Promise<User & { groups: unknown[] } | null> {
    return this.prisma.user.findUnique({
      where: { walletAddress },
      include: { groups: { include: { group: true } } },
    }) as Promise<any>
  }
}
