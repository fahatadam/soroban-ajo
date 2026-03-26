import { Router, Request, Response } from 'express'
import { AuthService } from '../services/authService'
import { validateRequest } from '../middleware/validateRequest'
import { generateTokenSchema } from '../schemas/auth.schema'

const router = Router()

// POST /api/auth/token - Generate JWT token
router.post(
  '/token',
  validateRequest({ body: generateTokenSchema }),
  (req: Request, res: Response): void => {
    const { publicKey } = req.body
    const token = AuthService.generateToken(publicKey)
    res.json({ token })
  }
)

export const authRouter = router
