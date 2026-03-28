import { Response, NextFunction } from 'express'
import { AuthRequest } from './auth'

/**
 * Verifies the authenticated user is a member of the group specified
 * by `req.params.groupId`. Extend this with a real DB/contract lookup
 * once membership data is persisted.
 */
export function requireGroupMember(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' })
    return
  }

  const { groupId } = req.params
  if (!groupId) {
    res.status(400).json({ success: false, error: 'Missing groupId', code: 'VALIDATION_ERROR' })
    return
  }

  // TODO: replace with real membership check against DB / Soroban contract
  next()
}
