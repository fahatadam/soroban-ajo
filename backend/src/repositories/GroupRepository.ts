import { PrismaClient, Group } from '@prisma/client'
import { BaseRepository } from './BaseRepository'

export class GroupRepository extends BaseRepository<Group> {
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  protected get model() {
    return this.prisma.group
  }

  async findActive(): Promise<Group[]> {
    return this.prisma.group.findMany({ where: { isActive: true } })
  }

  async findWithMembers(id: string): Promise<(Group & { members: unknown[] }) | null> {
    return this.prisma.group.findUnique({
      where: { id },
      include: { members: { include: { user: true } } },
    }) as Promise<any>
  }

  async findWithContributions(id: string): Promise<(Group & { contributions: unknown[] }) | null> {
    return this.prisma.group.findUnique({
      where: { id },
      include: { contributions: true },
    }) as Promise<any>
  }

  async findByMember(walletAddress: string): Promise<Group[]> {
    const memberships = await this.prisma.groupMember.findMany({
      where: { userId: walletAddress },
      include: { group: true },
    })
    return memberships.map((m: { group: Group }) => m.group)
  }

  async countMembers(groupId: string): Promise<number> {
    return this.prisma.groupMember.count({ where: { groupId } })
  }
}
