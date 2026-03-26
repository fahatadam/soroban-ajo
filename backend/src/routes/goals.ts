import { Router } from 'express'
import { goalsController } from '../controllers/goalsController'
import { authMiddleware as auth } from '../middleware/auth'
import { validateRequest } from '../middleware/validateRequest'
import {
  createGoalSchema,
  updateGoalSchema,
  affordabilitySchema,
  projectionSchema,
  goalIdParamSchema,
} from '../schemas/goal.schema'

const router = Router()

// Goal Management
router.post('/', auth, validateRequest({ body: createGoalSchema }), goalsController.createGoal)
router.get('/', auth, goalsController.getGoals)
router.get('/:id', auth, validateRequest({ params: goalIdParamSchema }), goalsController.getGoal)
router.patch(
  '/:id',
  auth,
  validateRequest({ params: goalIdParamSchema, body: updateGoalSchema }),
  goalsController.updateGoal
)
router.delete(
  '/:id',
  auth,
  validateRequest({ params: goalIdParamSchema }),
  goalsController.deleteGoal
)

// Financial Intelligence Tools
router.post(
  '/affordability',
  auth,
  validateRequest({ body: affordabilitySchema }),
  goalsController.checkAffordability
)
router.post(
  '/projection',
  auth,
  validateRequest({ body: projectionSchema }),
  goalsController.calculateProjection
)

export const goalsRouter = router
