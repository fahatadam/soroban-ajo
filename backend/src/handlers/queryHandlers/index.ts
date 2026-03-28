import { PrismaClient } from '@prisma/client'
import {
  Query,
  GetGoalByIdQuery,
  ListGoalsByUserQuery,
  GetGroupByIdQuery,
  ListGroupsQuery,
  GetGroupMembersQuery,
  GetUserByWalletQuery,
} from '../../queries'
import { AppError } from '../../errors/AppError'

export interface QueryHandler<Q extends Query, R> {
  handle(query: Q): Promise<R>
}

// --- Goal query handlers ---

export class GetGoalByIdHandler implements QueryHandler<GetGoalByIdQuery, unknown> {
  constructor(private readonly prisma: PrismaClient) {}

  async handle(query: GetGoalByIdQuery) {
    const goal = await this.prisma.goal.findUnique({
      where: { id: query.payload.id },
      include: { members: true },
    })
    if (!goal) throw new AppError('Goal not found', 'NOT_FOUND', 404)
    return goal
  }
}

export class ListGoalsByUserHandler implements QueryHandler<ListGoalsByUserQuery, unknown[]> {
  constructor(private readonly prisma: PrismaClient) {}

  async handle(query: ListGoalsByUserQuery) {
    return this.prisma.goal.findMany({
      where: {
        userId: query.payload.userId,
        ...(query.payload.status && { status: query.payload.status }),
      },
      orderBy: { createdAt: 'desc' },
    })
  }
}

// --- Group query handlers ---

export class GetGroupByIdHandler implements QueryHandler<GetGroupByIdQuery, unknown> {
  constructor(private readonly prisma: PrismaClient) {}

  async handle(query: GetGroupByIdQuery) {
    const group = await this.prisma.group.findUnique({
      where: { id: query.payload.id },
      include: { members: true, metrics: true },
    })
    if (!group) throw new AppError('Group not found', 'NOT_FOUND', 404)
    return group
  }
}

export class ListGroupsHandler implements QueryHandler<ListGroupsQuery, unknown[]> {
  constructor(private readonly prisma: PrismaClient) {}

  async handle(query: ListGroupsQuery) {
    const { page, limit, activeOnly } = query.payload
    return this.prisma.group.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    })
  }
}

export class GetGroupMembersHandler implements QueryHandler<GetGroupMembersQuery, unknown[]> {
  constructor(private readonly prisma: PrismaClient) {}

  async handle(query: GetGroupMembersQuery) {
    return this.prisma.groupMember.findMany({
      where: { groupId: query.payload.groupId },
      include: { user: true },
    })
  }
}

// --- User query handlers ---

export class GetUserByWalletHandler implements QueryHandler<GetUserByWalletQuery, unknown> {
  constructor(private readonly prisma: PrismaClient) {}

  async handle(query: GetUserByWalletQuery) {
    const user = await this.prisma.user.findUnique({
      where: { walletAddress: query.payload.walletAddress },
      include: { metrics: true },
    })
    if (!user) throw new AppError('User not found', 'NOT_FOUND', 404)
    return user
  }
}

// --- Query bus ---

export class QueryBus {
  private handlers = new Map<string, QueryHandler<any, any>>()

  register<Q extends Query, R>(type: Q['type'], handler: QueryHandler<Q, R>): this {
    this.handlers.set(type, handler)
    return this
  }

  async dispatch<R>(query: Query): Promise<R> {
    const handler = this.handlers.get(query.type)
    if (!handler) throw new AppError(`No handler for query: ${query.type}`, 'INTERNAL_ERROR', 500)
    return handler.handle(query)
  }
}
