export interface FindOptions {
  where?: Record<string, unknown>
  orderBy?: Record<string, 'asc' | 'desc'>
  skip?: number
  take?: number
  include?: Record<string, unknown>
}

export interface IRepository<T> {
  findById(id: string): Promise<T | null>
  findAll(options?: FindOptions): Promise<T[]>
  create(data: unknown): Promise<T>
  update(id: string, data: unknown): Promise<T>
  delete(id: string): Promise<void>
}
