import { Request, Response, NextFunction } from 'express'
import { parseOffsetParams, parseCursorParams } from '../utils/pagination'
import { PaginationParams } from '../types/pagination'

declare global {
  namespace Express {
    interface Request {
      pagination?: PaginationParams
    }
  }
}

/**
 * Middleware that parses pagination query params and attaches them to `req.pagination`.
 *
 * Offset mode (default):  ?page=1&limit=20
 * Cursor mode:            ?cursor=<id>&limit=20&strategy=cursor
 */
export function paginateMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const strategy = req.query.strategy === 'cursor' ? 'cursor' : 'offset'

  req.pagination =
    strategy === 'cursor'
      ? parseCursorParams(req.query as Record<string, unknown>)
      : parseOffsetParams(req.query as Record<string, unknown>)

  next()
}
