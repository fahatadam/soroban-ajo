/**
 * Shared pagination types supporting both offset-based and cursor-based strategies.
 */

export type PaginationStrategy = 'offset' | 'cursor'

// --- Offset-based ---

export interface OffsetPaginationParams {
  strategy: 'offset'
  page: number
  limit: number
}

export interface OffsetPaginationMeta {
  strategy: 'offset'
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

// --- Cursor-based ---

export interface CursorPaginationParams {
  strategy: 'cursor'
  cursor?: string
  limit: number
  direction?: 'forward' | 'backward'
}

export interface CursorPaginationMeta {
  strategy: 'cursor'
  limit: number
  nextCursor: string | null
  prevCursor: string | null
  hasNextPage: boolean
  hasPrevPage: boolean
}

// --- Union types ---

export type PaginationParams = OffsetPaginationParams | CursorPaginationParams
export type PaginationMeta = OffsetPaginationMeta | CursorPaginationMeta

export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationMeta
}
