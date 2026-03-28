import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import { refundController } from '../controllers/refundController'

const router = Router()

router.post('/', authMiddleware, refundController.request)
router.get('/group/:groupId', refundController.listByGroup)
router.get('/:id', refundController.get)
router.post('/:id/vote', authMiddleware, refundController.vote)
router.post('/:id/execute', authMiddleware, refundController.execute)

export const refundsRouter = router
