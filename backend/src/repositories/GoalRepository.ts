import { PrismaClient, Goal } from '@prisma/client'
import { BaseRepository } from './BaseRepository'

export class GoalRepository extends BaseRepository<Goal> {
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  protected get model() {
    return this.prisma.goal
  }

  async findByUser(userId: string): Promise<Goal[]> {
    return this.prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findPublic(): Promise<Goal[]> {
    return this.prisma.goal.findMany({
      where: { isPublic: true, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findWithMembers(id: string): Promise<(Goal & { members: unknown[] }) | null> {
    return this.prisma.goal.findUnique({
      where: { id },
      include: { members: true },
    }) as Promise<any>
  }

  async updateAmount(id: string, amount: bigint): Promise<Goal> {
    return this.prisma.goal.update({
      where: { id },
      data: { currentAmount: amount },
    })
  }

  async findByStatus(userId: string, status: string): Promise<Goal[]> {
    return this.prisma.goal.findMany({
      where: { userId, status },
      orderBy: { deadline: 'asc' },
    })
  }
}
