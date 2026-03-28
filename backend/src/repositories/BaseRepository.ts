import { PrismaClient } from '@prisma/client'
import { FindOptions, IRepository } from './interfaces/IRepository'

/**
 * Abstract base repository providing common CRUD operations.
 * Concrete repositories extend this and implement `get model()`.
 */
export abstract class BaseRepository<T> implements IRepository<T> {
  constructor(protected readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<T | null> {
    return (this.model.findUnique({ where: { id } }) as Promise<T | null>)
  }

  async findAll(options: FindOptions = {}): Promise<T[]> {
    return (this.model.findMany(options) as Promise<T[]>)
  }

  async create(data: unknown): Promise<T> {
    return (this.model.create({ data }) as Promise<T>)
  }

  async update(id: string, data: unknown): Promise<T> {
    return (this.model.update({ where: { id }, data }) as Promise<T>)
  }

  async delete(id: string): Promise<void> {
    await this.model.delete({ where: { id } })
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.model.count({ where })
  }

  async findOne(where: Record<string, unknown>): Promise<T | null> {
    return (this.model.findFirst({ where }) as Promise<T | null>)
  }

  /** Subclasses return the Prisma delegate for their model, e.g. `this.prisma.user` */
  protected abstract get model(): any
}
