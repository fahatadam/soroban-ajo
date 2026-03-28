import {
  OffsetPaginationParams,
  CursorPaginationParams,
  OffsetPaginationMeta,
  CursorPaginationMeta,
  PaginatedResponse,
} from '../types/pagination'

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

// --- Offset helpers ---

export function parseOffsetParams(query: Record<string, unknown>): OffsetPaginationParams {
  const page = Math.max(1, parseInt(String(query.page ?? 1), 10) || 1)
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(String(query.limit ?? DEFAULT_LIMIT), 10) || DEFAULT_LIMIT))
  return { strategy: 'offset', page, limit }
}

export function buildOffsetMeta(
  params: OffsetPaginationParams,
  total: number
): OffsetPaginationMeta {
  const totalPages = Math.ceil(total / params.limit) || 0
  return {
    strategy: 'offset',
    page: params.page,
    limit: params.limit,
    total,
    totalPages,
    hasNextPage: params.page < totalPages,
    hasPrevPage: params.page > 1,
  }
}

export function applyOffsetPagination<T>(
  items: T[],
  params: OffsetPaginationParams
): PaginatedResponse<T> {
  const total = items.length
  const offset = (params.page - 1) * params.limit
  return {
    data: items.slice(offset, offset + params.limit),
    pagination: buildOffsetMeta(params, total),
  }
}

export function offsetToSkipTake(params: OffsetPaginationParams): { skip: number; take: number } {
  return {
    skip: (params.page - 1) * params.limit,
    take: params.limit,
  }
}

// --- Cursor helpers ---

export function parseCursorParams(query: Record<string, unknown>): CursorPaginationParams {
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(String(query.limit ?? DEFAULT_LIMIT), 10) || DEFAULT_LIMIT))
  const cursor = query.cursor ? String(query.cursor) : undefined
  const direction = query.direction === 'backward' ? 'backward' : 'forward'
  return { strategy: 'cursor', cursor, limit, direction }
}

/**
 * Builds cursor pagination meta from a result set.
 * Fetches `limit + 1` items to detect next page; caller passes that raw slice.
 */
export function buildCursorMeta<T extends { id: string }>(
  items: T[],
  params: CursorPaginationParams
): { data: T[]; pagination: CursorPaginationMeta } {
  const hasNextPage = items.length > params.limit
  const data = hasNextPage ? items.slice(0, params.limit) : items

  return {
    data,
    pagination: {
      strategy: 'cursor',
      limit: params.limit,
      nextCursor: hasNextPage ? data[data.length - 1]?.id ?? null : null,
      prevCursor: params.cursor ?? null,
      hasNextPage,
      hasPrevPage: !!params.cursor,
    },
  }
}
