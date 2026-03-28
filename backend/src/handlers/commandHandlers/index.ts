import { PrismaClient } from '@prisma/client'
import {
  Command,
  CreateGoalCommand,
  UpdateGoalCommand,
  DeleteGoalCommand,
  ContributeCommand,
} from '../../commands'
import { AppError } from '../../errors/AppError'

export type CommandResult<T = void> = { success: true; data?: T } | { success: false; error: string }

export interface CommandHandler<C extends Command, R = void> {
  handle(command: C): Promise<CommandResult<R>>
}

// --- Goal command handlers ---

export class CreateGoalHandler implements CommandHandler<CreateGoalCommand> {
  constructor(private readonly prisma: PrismaClient) {}

  async handle(cmd: CreateGoalCommand): Promise<CommandResult> {
    const goal = await this.prisma.goal.create({
      data: {
        userId: cmd.payload.userId,
        title: cmd.payload.title,
        description: cmd.payload.description,
        targetAmount: cmd.payload.targetAmount,
        deadline: cmd.payload.deadline,
        category: cmd.payload.category,
        isPublic: cmd.payload.isPublic ?? false,
        currentAmount: BigInt(0),
      },
    })
    return { success: true, data: goal }
  }
}

export class UpdateGoalHandler implements CommandHandler<UpdateGoalCommand> {
  constructor(private readonly prisma: PrismaClient) {}

  async handle(cmd: UpdateGoalCommand): Promise<CommandResult> {
    const existing = await this.prisma.goal.findUnique({ where: { id: cmd.payload.id } })
    if (!existing) throw new AppError('Goal not found', 'NOT_FOUND', 404)
    if (existing.userId !== cmd.payload.userId)
      throw new AppError('Forbidden', 'FORBIDDEN', 403)

    const { id, userId, ...updates } = cmd.payload
    const goal = await this.prisma.goal.update({ where: { id }, data: updates })
    return { success: true, data: goal }
  }
}

export class DeleteGoalHandler implements CommandHandler<DeleteGoalCommand> {
  constructor(private readonly prisma: PrismaClient) {}

  async handle(cmd: DeleteGoalCommand): Promise<CommandResult> {
    const existing = await this.prisma.goal.findUnique({ where: { id: cmd.payload.id } })
    if (!existing) throw new AppError('Goal not found', 'NOT_FOUND', 404)
    if (existing.userId !== cmd.payload.userId)
      throw new AppError('Forbidden', 'FORBIDDEN', 403)

    await this.prisma.goal.delete({ where: { id: cmd.payload.id } })
    return { success: true }
  }
}

export class ContributeHandler implements CommandHandler<ContributeCommand> {
  constructor(private readonly prisma: PrismaClient) {}

  async handle(cmd: ContributeCommand): Promise<CommandResult> {
    const contribution = await this.prisma.contribution.create({
      data: {
        groupId: cmd.payload.groupId,
        userId: cmd.payload.walletAddress,
        amount: cmd.payload.amount,
        round: cmd.payload.round,
        txHash: cmd.payload.txHash,
      },
    })
    return { success: true, data: contribution }
  }
}

// --- Command bus ---

export class CommandBus {
  private handlers = new Map<string, CommandHandler<any, any>>()

  register<C extends Command>(type: C['type'], handler: CommandHandler<C, any>): this {
    this.handlers.set(type, handler)
    return this
  }

  async dispatch<R = void>(command: Command): Promise<CommandResult<R>> {
    const handler = this.handlers.get(command.type)
    if (!handler) throw new AppError(`No handler for command: ${command.type}`, 'INTERNAL_ERROR', 500)
    return handler.handle(command)
  }
}
